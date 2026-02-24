import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { getGameDetails } from "../../services/GamesApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import Questions from "../../components/Questions";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES } from "../../constants/index.js";
import GameButton from "../../components/GameButton";
import WsUrl from "../../configWs";
import ErrorMessage from "../../components/ErrorMessage";


const PRINCE_WISDOM_PREFIXES = [
  "I believe the answer is: ",
  "My royal gut says: ",
  "The scrolls suggest: ",
  "I'd wager: ",
  "Dare I say: ",
  "The stars align on: ",
  "My kingdom for: ",
  "Verily, it must be: ",
];

export default function Game() {
  const { userToken, userInfo } = useAuth();
  const {
    musicMuted,
    setMusicMuted,
    soundMuted,
    setSoundMuted,
    playCorrect,
    playWrong,
    startMusic,
    stopMusic,
  } = useGameAudio();
  const { gameId, gameCode } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [allScores, setAllScores] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(20000);
  const [doubleDipActive, setDoubleDipActive] = useState(false);
  const [askTheAIActive, setAskTheAIActive] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [aiWisdomPrefix, setAiWisdomPrefix] = useState<string>(
    PRINCE_WISDOM_PREFIXES[0]
  );
  const [doubleDipUsed, setDoubleDipUsed] = useState(false);
  const [askTheAIUsed, setAskTheAIUsed] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(questionDuration); // Added timeLeft state
  const [error, setError] = useState<string>(""); // Add error state
  const [wsError, setWsError] = useState<string>("");
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsConnectionAttempts, setWsConnectionAttempts] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFastAnswerCue, setShowFastAnswerCue] = useState(false);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // Main game music: start when game screen is active, stop when game ends or unmount
  useEffect(() => {
    startMusic();
    return () => {
      stopMusic();
    };
  }, [startMusic, stopMusic]);

  useEffect(() => {
    if (gameEnded) stopMusic();
  }, [gameEnded, stopMusic]);

  // When user unmutes music while on game screen, start music
  useEffect(() => {
    if (!musicMuted && !gameEnded) startMusic();
  }, [musicMuted, gameEnded, startMusic]);

  // Animation refs for power-ups
  const doubleDipScale = useRef(new Animated.Value(1)).current;
  const askTheAIScale = useRef(new Animated.Value(1)).current;
  const doubleDipGlow = useRef(new Animated.Value(0)).current;
  const askTheAIGlow = useRef(new Animated.Value(0)).current;

  // Animation refs for question counter
  const questionCounterPulse = useRef(new Animated.Value(1)).current;

  // Animation refs for progress bar
  const progressBarWidth = useRef(new Animated.Value(100)).current;
  const progressBarPulse = useRef(new Animated.Value(1)).current;

  const webSocket = useRef<WebSocket | null>(null);
  const handleMessageRef = useRef<(event: MessageEvent) => void>(() => {});
  const startTimeRef = useRef<number>(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Fetch game details from the backend
  const { data: gameDetails, error: gameDetailsError } = useQuery<
    GameDetailsResponse,
    Error
  >({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  // Handle errors and set user-friendly messages
  useEffect(() => {
    if (gameDetailsError) {
      if (gameDetailsError.message.includes("404")) {
        setError("Game not found. Please check the game code and try again.");
      } else if (gameDetailsError.message.includes("403")) {
        setError("You don't have permission to access this game.");
      } else if (gameDetailsError.message.includes("network")) {
        setError("Connection failed. Please check your internet connection.");
      } else {
        setError("Unable to load game. Please try again later.");
      }
    } else {
      setError(""); // Clear error when successful
    }
  }, [gameDetailsError]);

  // Initialize game state when gameDetails is loaded
  useEffect(() => {
    if (gameDetails) {
      setGameQuestions(gameDetails.questions || []);
      setQuestionDuration((gameDetails.duration || 20) * 1000);
      if (gameDetails.ended) setGameEnded(true);
      if (gameDetails.questions) {
        const fetchAllAnswers = async () => {
          try {
            const answersPromises = gameDetails.questions.map(
              (question: Question) =>
                getPracticeAnswers(question.id, userToken?.token)
            );
            const answers = await Promise.all(answersPromises);
            setGameAnswers(answers.flat());
          } catch (error) {
            setError("Failed to load questions. Please try again.");
          }
        };
        fetchAllAnswers();
      }
    }
  }, [gameDetails, userToken]);

  // Identify questions with multiple correct answers
  useEffect(() => {
    if (gameQuestions.length === 0 || gameAnswers.length === 0) return;
    const multiCorrect = gameQuestions
      .filter(
        (q) =>
          gameAnswers.filter((a) => a.question === q.id && a.isRight).length > 1
      )
      .map((q) => q.id);
    setQuestionsWithMultipleCorrectAnswers(multiCorrect);
  }, [gameQuestions, gameAnswers]);

  // Timer with countdown display
  useEffect(() => {
    if (gameQuestions.length === 0 || gameEnded) return;

    startTimeRef.current = Date.now();
    setTimeLeft(questionDuration);
    progressBarWidth.setValue(100);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = questionDuration - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        Animated.timing(progressBarWidth, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        const newWidth = (remaining / questionDuration) * 100;
        Animated.timing(progressBarWidth, {
          toValue: newWidth,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
    }, 1000);

    const timer = setTimeout(() => {
      if (!gameEnded) {
        if (currentQuestion < gameQuestions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          handleSubmit();
        }
      }
    }, questionDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentQuestion, questionDuration, gameQuestions, gameEnded]);

  // Reset power-ups and fast cue when question changes
  useEffect(() => {
    if (gameEnded) return;
    setAiPrediction(null);
    setAskTheAIActive(false);
    setDoubleDipActive(false);
    setShowFastAnswerCue(false);
  }, [currentQuestion, gameEnded]);

  // Animate question counter when 5 or fewer questions remain
  useEffect(() => {
    if (gameEnded || gameQuestions.length === 0) return;

    const questionsRemaining = gameQuestions.length - currentQuestion;
    if (questionsRemaining <= 5) {
      // Start subtle pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(questionCounterPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(questionCounterPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation and reset to normal
      questionCounterPulse.stopAnimation();
      questionCounterPulse.setValue(1);
    }
  }, [currentQuestion, gameQuestions.length, gameEnded]);

  // Animate progress bar when time is low
  useEffect(() => {
    if (gameEnded) return;

    if (timeLeft <= 5000 && timeLeft > 0) {
      // Start subtle pulsing animation for progress bar
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressBarPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(progressBarPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      // Stop animation and reset to normal
      progressBarPulse.stopAnimation();
      progressBarPulse.setValue(1);
    }
  }, [timeLeft, gameEnded]);

  // Handle WebSocket messages
  useEffect(() => {
    handleMessageRef.current = (event) => {
      if (gameEnded) return;

      try {
        const message = JSON.parse(event.data);

        if (
          message.type === "question.attempted" &&
          message.question_id === gameQuestions[currentQuestion]?.id
        ) {
          if (currentQuestion < gameQuestions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
          } else {
            handleSubmit();
          }
        } else if (message.type === "all_scores_submitted") {
          const scoresObject = message.scores.reduce((acc: any, score: any) => {
            acc[score.user_id] = score.score;
            return acc;
          }, {});
          setAllScores(scoresObject);
          setGameEnded(true);
          if (webSocket.current) {
            webSocket.current.close();
          }
          if (!redirected) {
            setRedirected(true);
            router.replace({
              pathname: "Results",
              params: { scores: JSON.stringify(scoresObject), gameId },
            });
          }
        } else if (message.type === "game.start") {
          // Game is already started, just ensure we're ready
        } else if (
          message.type === "game.update" ||
          message.type === "game.state"
        ) {
          const payload = message.data || message;
          if (payload.started && !payload.ended) {
            // Game is already started, just ensure we're ready
          }
        }
      } catch (error) {
        const errorMsg = `Failed to parse WebSocket message: ${
          error instanceof Error ? error.message : "Unknown parsing error"
        }`;
        setWsError(errorMsg);

        // Don't show WebSocket parsing errors to users - they're not actionable
      }
    };
  }, [currentQuestion, gameQuestions, gameId, gameEnded, userInfo, redirected]);

  // Fallback navigation if game ends with scores
  useEffect(() => {
    if (gameEnded && Object.keys(allScores).length > 0 && !redirected) {
      setRedirected(true);
      if (webSocket.current) {
        webSocket.current.close();
      }
      router.push({
        pathname: "Results",
        params: { scores: JSON.stringify(allScores), gameId },
      });
      if (webSocket.current) webSocket.current.close();
    }
  }, [gameEnded, allScores, gameId, redirected]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!gameCode || !userToken?.token || gameEnded) return;

    setWsConnectionAttempts((prev) => prev + 1);
    setWsError("");

    const ws = new WebSocket(
      `${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken.token}`
    );
    webSocket.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setWsError("");
      setWsConnectionAttempts(0);
      // Send join_game message to ensure we're registered
      ws.send(JSON.stringify({ type: "join_game" }));
    };

    ws.onerror = (error) => {
      setWsConnected(false);
      const errorMsg = `WebSocket connection failed (attempt ${
        wsConnectionAttempts + 1
      }). Error: ${error?.type || "Unknown error"}`;
      setWsError(errorMsg);

      // Don't show WebSocket connection errors to users - they're not actionable
    };

    ws.onmessage = (event) => handleMessageRef.current(event);

    ws.onclose = (event) => {
      setWsConnected(false);
      webSocket.current = null;

      if (event.code !== 1000) {
        // Not a normal closure
        const errorMsg = `WebSocket connection closed unexpectedly. Code: ${
          event.code
        }, Reason: ${event.reason || "No reason provided"}`;
        setWsError(errorMsg);
      }
    };

    return () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
    };
  }, [gameCode, userToken?.token, gameEnded, userInfo]);

  // Send WebSocket message helper
  const sendWebSocketMessage = (message: object) => {
    if (gameEnded) return;
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      try {
        webSocket.current.send(JSON.stringify(message));
        setWsError(""); // Clear any previous errors
      } catch (error) {
        const errorMsg = `Failed to send WebSocket message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setWsError(errorMsg);

        // Show user-friendly error for game interaction failure
        setErrorMessage("Unable to submit your answer. Please try again.");
      }
    } else {
      const errorMsg = `WebSocket is not connected (state: ${
        webSocket.current?.readyState || "null"
      }). Cannot send message.`;
      setWsError(errorMsg);

      // Show user-friendly error for connection issues
      setErrorMessage("Connection issue. Your progress may not be saved.");
    }
  };

  // Attempt a question
  const attemptQuestion = (questionId: number) => {
    if (gameEnded) return;
    sendWebSocketMessage({
      type: "attempt_question",
      question_id: questionId,
      game_id: gameId,
    });
  };

  // Submit player's score
  const submitScore = (scorePercentage: number) => {
    if (gameEnded) return;
    sendWebSocketMessage({
      type: "submit_score",
      score: scorePercentage,
      user_id: userInfo?.user.id,
      game_id: gameId,
    });
  };

  // Handle answer selection
  const handleAnswerSelection = (answerId: number, questionId: number) => {
    if (gameEnded) return;
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      const correctCount = gameAnswers.filter(
        (a) => a.question === questionId && a.isRight
      ).length;
      const correctIds = gameAnswers
        .filter((a) => a.question === questionId && a.isRight)
        .map((a) => a.id);
      let didSubmit = false;
      let isCorrect = false;

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        if (updated[questionId]?.length === correctCount) return updated;
        if (!updated[questionId]) updated[questionId] = [answerId];
        else if (!updated[questionId].includes(answerId))
          updated[questionId].push(answerId);
        if (updated[questionId].length === correctCount) {
          didSubmit = true;
          const sel = updated[questionId];
          isCorrect =
            sel.length === correctIds.length &&
            sel.every((id) => correctIds.includes(id));
          attemptQuestion(questionId);
        }
      } else {
        if (updated[questionId]?.length > 0 && !doubleDipActive) return updated;
        if (doubleDipActive) {
          if (updated[questionId]?.length >= 2) return updated;
          if (!updated[questionId]) updated[questionId] = [answerId];
          else updated[questionId].push(answerId);
          if (updated[questionId].length === 2) {
            setDoubleDipActive(false);
            didSubmit = true;
            const sel = updated[questionId];
            isCorrect =
              sel.length === correctIds.length &&
              sel.every((id) => correctIds.includes(id));
            attemptQuestion(questionId);
          }
        } else {
          updated[questionId] = [answerId];
          didSubmit = true;
          isCorrect = correctIds.includes(answerId);
          attemptQuestion(questionId);
        }
      }

      if (didSubmit) {
        const elapsed = Date.now() - startTimeRef.current;
        const fastThreshold = questionDuration * 0.3;
        if (isCorrect && elapsed < fastThreshold) {
          setTimeout(() => setShowFastAnswerCue(true), 0);
          setTimeout(() => setShowFastAnswerCue(false), 1500);
        }
        setTimeout(() => {
          try {
            Haptics.notificationAsync(
              isCorrect
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Error
            );
          } catch (_) {}
          if (isCorrect) {
            playCorrect();
          } else {
            playWrong();
          }
        }, 0);
      }
      return updated;
    });
  };

  // Submit game results
  const handleSubmit = () => {
    if (gameEnded) return;
    const total = gameQuestions.length;
    let correct = 0;
    gameQuestions.forEach((question) => {
      const selectedIds = selectedAnswers[question.id] || [];
      const correctIds = gameAnswers
        .filter((ans) => ans.question === question.id && ans.isRight)
        .map((ans) => ans.id);
      if (
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id))
      ) {
        correct++;
      }
    });
    const scorePercentage = (correct / total) * 100;
    submitScore(scorePercentage);
  };

  // Check if answer is selected
  const isAnswerSelected = (questionId: number, answerId: number) =>
    selectedAnswers[questionId]?.includes(answerId);

  // Streak: consecutive correct from last answered backward
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = currentQuestion - 1; i >= 0; i--) {
      const q = gameQuestions[i];
      if (!q) break;
      const selectedIds = selectedAnswers[q.id] || [];
      const correctIds = gameAnswers
        .filter((a) => a.question === q.id && a.isRight)
        .map((a) => a.id);
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));
      if (isCorrect) streak++;
      else break;
    }
    return streak;
  }, [currentQuestion, gameQuestions, selectedAnswers, gameAnswers]);

  // Power-up: Double Dip
  const activateDoubleDip = () => {
    if (!doubleDipUsed && !askTheAIActive && !doubleDipActive && !gameEnded) {
      // Animate button press
      Animated.sequence([
        Animated.timing(doubleDipScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(doubleDipScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(doubleDipGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(doubleDipGlow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setDoubleDipActive(true);
      setDoubleDipUsed(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
  };

  // Power-up: Ask The AI
  const activateAskTheAI = () => {
    if (!askTheAIUsed && !doubleDipActive && !askTheAIActive && !gameEnded) {
      // Animate button press
      Animated.sequence([
        Animated.timing(askTheAIScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(askTheAIScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(askTheAIGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(askTheAIGlow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setAskTheAIActive(true);
      const currentQId = gameQuestions[currentQuestion]?.id;
      const correctIds = gameAnswers
        .filter((answer) => answer.question === currentQId && answer.isRight)
        .map((answer) => answer.id);
      const aiGuess = correctIds[Math.floor(Math.random() * correctIds.length)];
      setAiPrediction(aiGuess);
      setAiWisdomPrefix(
        PRINCE_WISDOM_PREFIXES[
          Math.floor(Math.random() * PRINCE_WISDOM_PREFIXES.length)
        ]
      );
      setTimeout(() => {
        setAskTheAIActive(false);
        setAiPrediction(null);
      }, 20000);
      setAskTheAIUsed(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
  };

  // Styles
  const styles = StyleSheet.create({
    container: { flex: 1, marginTop: rV(10) },
    powerUpContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: rMS(16),
      paddingVertical: rV(12),
      paddingBottom: Math.max(rV(12), insets.bottom + rV(8)), // Use safe area bottom + padding
      backgroundColor: themeColors.background,
      borderTopWidth: 1,
      borderTopColor: themeColors.textSecondary + "20",
    },
    powerUpCard: {
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: rMS(12),
      padding: rMS(8),
      alignItems: "center",
      justifyContent: "center",
      minWidth: rS(100),
      minHeight: rV(80),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: "transparent",
    },
    powerUpButton: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    powerUpCardActive: {
      borderColor: "#FFD700",
      shadowColor: "#FFD700",
      shadowOpacity: 0.6,
    },
    powerUpCardUsed: {
      opacity: 0.5,
      backgroundColor: themeColors.textSecondary + "20",
    },
    powerUpIcon: {
      marginBottom: rV(4),
    },
    powerUpTitle: {
      fontSize: rMS(11),
      fontWeight: "600",
      color: themeColors.text,
      textAlign: "center",
    },
    powerUpDescription: {
      fontSize: rMS(9),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(2),
    },
    powerUpBadge: {
      position: "absolute",
      top: -rV(4),
      right: -rV(4),
      backgroundColor: "#FF6B6B",
      borderRadius: rMS(8),
      width: rS(16),
      height: rS(16),
      alignItems: "center",
      justifyContent: "center",
    },
    powerUpBadgeText: {
      color: "white",
      fontSize: rMS(8),
      fontWeight: "bold",
    },
    aiPrediction: {
      backgroundColor: themeColors.tint + "20",
      borderRadius: rMS(12),
      padding: rMS(16),
      margin: rMS(16),
      borderLeftWidth: 4,
      borderLeftColor: themeColors.tint,
    },
    aiPredictionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(8),
    },
    aiPredictionTitle: {
      fontSize: rMS(16),
      fontWeight: "bold",
      color: themeColors.tint,
    },
    aiPredictionText: {
      fontSize: rMS(14),
      color: themeColors.text,
      fontStyle: "italic",
    },
    timerRowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: rV(16),
      paddingHorizontal: rS(20),
    },
    questionCounterText: {
      fontSize: rMS(18),
      fontWeight: "bold",
      textAlign: "left",
    },
    progressBarContainer: {
      alignItems: "center",
      width: rS(120),
      marginLeft: rS(16),
    },
    progressBarBackground: {
      width: "100%",
      height: rV(8),
      backgroundColor: "rgba(13, 71, 161, 0.2)",
      borderRadius: rMS(4),
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: rMS(4),
      alignSelf: "flex-end",
    },
    answerButton: {
      padding: rMS(10),
      marginVertical: rV(5),
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#ccc",
    },
    correctAnswer: { backgroundColor: "#097969" },
    wrongAnswer: { backgroundColor: "#D22B2B" },
    errorMessage: {
      alignSelf: "center",
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginVertical: rV(16),
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
    muteButton: {
      padding: rMS(4),
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF6B3520",
      paddingHorizontal: rMS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
      marginLeft: rS(8),
    },
    streakText: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: "#FF6B35",
      marginLeft: rS(4),
    },
    fastAnswerCue: {
      alignSelf: "center",
      marginVertical: rV(8),
      paddingHorizontal: rMS(12),
      paddingVertical: rV(6),
      backgroundColor: themeColors.tint + "25",
      borderRadius: rMS(8),
    },
    fastAnswerCueText: {
      fontSize: rMS(14),
      fontWeight: "600",
      color: themeColors.tint,
    },
  });

  // Render UI
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Timer and Question Counter Row */}
      {!gameEnded && gameQuestions.length > 0 && !error && (
        <View style={styles.timerRowContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Animated.Text
            style={[
              styles.questionCounterText,
              {
                color:
                  gameQuestions.length - currentQuestion <= 5
                    ? "#FF0000"
                    : themeColors.text,
                transform: [{ scale: questionCounterPulse }],
              },
            ]}
          >
            {currentQuestion + 1}/{gameQuestions.length}
          </Animated.Text>
          {currentStreak >= 2 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{currentStreak}</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressBarWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                      extrapolate: "clamp",
                    }),
                    backgroundColor:
                      timeLeft <= 5000 ? "#DC2626" : themeColors.tint,
                    transform: [{ scale: progressBarPulse }],
                  },
                ]}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setMusicMuted(!musicMuted)}
            style={[styles.muteButton, { marginLeft: rS(8) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={musicMuted ? "music-off" : "music-note"}
              size={24}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSoundMuted(!soundMuted)}
            style={[styles.muteButton, { marginLeft: rS(4) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={soundMuted ? "volume-mute" : "volume-high"}
              size={24}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
          </View>
        </View>
      )}

      {showFastAnswerCue && (
        <View style={styles.fastAnswerCue}>
          <Text style={styles.fastAnswerCueText}>Quick thinking!</Text>
        </View>
      )}

      {/* AI Prediction Display */}
      {askTheAIActive && aiPrediction !== null && (
        <View style={styles.aiPrediction}>
          <View style={styles.aiPredictionTitleRow}>
            <Ionicons
              name="bulb-outline"
              size={22}
              color={themeColors.tint}
              style={{ marginRight: rS(6) }}
            />
            <Text style={styles.aiPredictionTitle}>The Prince's Wisdom</Text>
          </View>
          <Text style={styles.aiPredictionText}>
            "{aiWisdomPrefix}
            {gameAnswers.find((ans) => ans.id === aiPrediction)?.text}"
          </Text>
        </View>
      )}

      {/* Questions Section */}
      {!error && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {gameQuestions.length > 0 && (
            <Questions
              practiceQuestions={gameQuestions}
              practiceAnswers={gameAnswers}
              currentQuestion={currentQuestion}
              questionsWithMultipleCorrectAnswers={
                questionsWithMultipleCorrectAnswers
              }
              isAnswerSelected={isAnswerSelected}
              handleAnswerSelection={handleAnswerSelection}
              styles={styles}
            />
          )}
        </ScrollView>
      )}

      {/* Power-ups Section - Fixed at Bottom */}
      <View style={styles.powerUpContainer}>
        {/* Double Dip Power-up */}
        <Animated.View
          style={[
            styles.powerUpCard,
            doubleDipActive && styles.powerUpCardActive,
            doubleDipUsed && styles.powerUpCardUsed,
            {
              transform: [{ scale: doubleDipScale }],
              shadowOpacity: doubleDipGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={activateDoubleDip}
            disabled={
              doubleDipUsed || doubleDipActive || askTheAIActive || gameEnded
            }
            style={styles.powerUpButton}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={
                doubleDipActive
                  ? "#FFD700"
                  : doubleDipUsed
                  ? themeColors.textSecondary
                  : themeColors.tint
              }
              style={styles.powerUpIcon}
            />
            <Text
              style={[
                styles.powerUpTitle,
                { color: doubleDipActive ? "#FFD700" : themeColors.text },
              ]}
            >
              Double Dip
            </Text>
            <Text style={styles.powerUpDescription}>
              {doubleDipActive
                ? "Active!"
                : doubleDipUsed
                ? "Used"
                : "2 attempts"}
            </Text>
            {doubleDipActive && (
              <View style={styles.powerUpBadge}>
                <Text style={styles.powerUpBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Ask The AI Power-up */}
        <Animated.View
          style={[
            styles.powerUpCard,
            askTheAIActive && styles.powerUpCardActive,
            askTheAIUsed && styles.powerUpCardUsed,
            {
              transform: [{ scale: askTheAIScale }],
              shadowOpacity: askTheAIGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={activateAskTheAI}
            disabled={
              askTheAIUsed || askTheAIActive || doubleDipActive || gameEnded
            }
            style={styles.powerUpButton}
          >
            <Ionicons
              name="bulb"
              size={20}
              color={
                askTheAIActive
                  ? "#FFD700"
                  : askTheAIUsed
                  ? themeColors.textSecondary
                  : themeColors.tint
              }
              style={styles.powerUpIcon}
            />
            <Text
              style={[
                styles.powerUpTitle,
                { color: askTheAIActive ? "#FFD700" : themeColors.text },
              ]}
            >
              Ask Prince
            </Text>
            <Text style={styles.powerUpDescription}>
              {askTheAIActive
                ? "Thinking..."
                : askTheAIUsed
                ? "Used"
                : "Get hint"}
            </Text>
            {askTheAIActive && (
              <View style={styles.powerUpBadge}>
                <Text style={styles.powerUpBadgeText}>?</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
}
