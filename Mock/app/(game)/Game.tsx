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
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { getGameDetails, submitGameResult } from "../../services/GamesApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import Questions from "../../components/Questions";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES } from "../../constants/index.js";
import WsUrl from "../../configWs";
import ErrorMessage from "../../components/ErrorMessage";
import { useQueryClient } from "@tanstack/react-query";
import QuizGlassHeader from "../../components/game/QuizGlassHeader";
import GameQuestionsScroll from "../../components/game/GameQuestionsScroll";
import PowerUpStrip from "../../components/game/PowerUpStrip";
import PrinceWisdomBanner from "../../components/game/PrinceWisdomBanner";
import { PRINCE_WISDOM_PREFIXES } from "../../components/game/princeWisdom";

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
  const queryClient = useQueryClient();

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFastAnswerCue, setShowFastAnswerCue] = useState(false);

  // Fast answer cue animation
  const fastCueOpacity = useRef(new Animated.Value(0)).current;
  const fastCueScale = useRef(new Animated.Value(0.8)).current;

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // Stable callbacks for the (memoized) QuizGlassHeader. Without these,
  // every re-render of Game.tsx would hand new function identities to the
  // header and defeat its memoization.
  const onToggleMusic = useCallback(
    () => setMusicMuted(!musicMuted),
    [musicMuted, setMusicMuted]
  );
  const onToggleSound = useCallback(
    () => setSoundMuted(!soundMuted),
    [soundMuted, setSoundMuted]
  );

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
    queryFn: () => getGameDetails(gameId as string, userToken?.token),
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
      if (!gameEnded && !showFastAnswerCue) {
        // Time ran out
        setSelectedAnswers((prev) => {
          const currentId = gameQuestions[currentQuestion]?.id;
          if (!prev[currentId] || prev[currentId].length === 0) {
            attemptQuestion(currentId);
            return {
              ...prev,
              [currentId]: [],
            };
          }
          return prev;
        });
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
              pathname: "/(game)/Results",
              params: { scores: JSON.stringify(scoresObject), gameId },
            });
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
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
        pathname: "/(game)/Results",
        params: { scores: JSON.stringify(allScores), gameId },
      });
      if (webSocket.current) webSocket.current.close();
    }
  }, [gameEnded, allScores, gameId, redirected]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!gameCode || !userToken?.token || gameEnded) return;

    const ws = new WebSocket(
      `${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken.token}`
    );
    webSocket.current = ws;

    ws.onopen = () => {
      // console.log(`WebSocket opened for Player ${userInfo?.user.id}`);
      setWsConnected(true);
      setWsError("");
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for Player ${userInfo?.user.id}:`, error);
      setWsConnected(false);
    };

    ws.onmessage = (event) => handleMessageRef.current(event);

    ws.onclose = () => {
      // console.log(`WebSocket closed for Player ${userInfo?.user.id}`);
      setWsConnected(false);
      webSocket.current = null;
    };

    return () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
    };
  }, [gameCode, userToken?.token, gameEnded, userInfo]);

  // Send WebSocket message helper
  const sendWebSocketMessage = (message: object) => {
    if (gameEnded) return;
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify(message));
    } else {
      console.warn(`WebSocket not open for Player ${userInfo?.user.id}:`, message);
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

  // Submit player's score.
  //
  // Primary path is the WebSocket message — it's what unlocks the game's
  // "all_scores_submitted" handshake and the navigation to Results.
  //
  // We ALSO POST to /api/games/results/submit so the score lands on the
  // ranking side even if the WS dies before the server processes the
  // submit_score frame. The backend is idempotent on
  // (gameId, userId, gameMode) per Mock/BACKEND_RANKING_UPDATES.md Section 1,
  // so this dual-write converges safely with the WS path.
  const submitScore = (scorePercentage: number) => {
    if (gameEnded) return;
    sendWebSocketMessage({
      type: "submit_score",
      score: scorePercentage,
      user_id: userInfo?.user.id,
      game_id: gameId,
    });

    submitGameResult(userToken?.token, {
      gameId: String(gameId),
      gameMode: "multiplayer",
      finalScore: Math.round(scorePercentage),
    }).then(() => {
      // Invalidate leaderboard caches so scores appear immediately.
      queryClient.invalidateQueries({ queryKey: ["rankingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails"] });
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    }).catch((err) => {
      console.log("Multiplayer REST submit fallback failed:", err);
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
          else if (!updated[questionId].includes(answerId)) updated[questionId].push(answerId);
          
          const isThisAnswerCorrect = correctIds.includes(answerId);
          
          if (isThisAnswerCorrect) {
            queueMicrotask(() => setDoubleDipActive(false));
            didSubmit = true;
            isCorrect = true;
            attemptQuestion(questionId);
          } else if (updated[questionId].length === 2) {
            queueMicrotask(() => setDoubleDipActive(false));
            didSubmit = true;
            isCorrect = false;
            attemptQuestion(questionId);
          } else {
            didSubmit = false;
            isCorrect = false;
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
        const fastThreshold = questionDuration * 2;
        if (isCorrect && elapsed < fastThreshold) {
          setTimeout(() => {
            setShowFastAnswerCue(true);
            fastCueOpacity.setValue(1);
            fastCueScale.setValue(1);
            Animated.parallel([
              Animated.timing(fastCueOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.spring(fastCueScale, { toValue: 1, friction: 6, useNativeDriver: true }),
            ]).start();
          }, 0);
          setTimeout(() => {
            Animated.timing(fastCueOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
              setShowFastAnswerCue(false);
            });
          }, 1200);
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
      const isCorrect = correctIds.length > 1
        ? selectedIds.length === correctIds.length && selectedIds.every((id) => correctIds.includes(id))
        : selectedIds.some((id) => correctIds.includes(id));
        
      if (isCorrect) {
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
      const isCorrect = correctIds.length > 1
        ? selectedIds.length === correctIds.length && selectedIds.every((id) => correctIds.includes(id))
        : selectedIds.some((id) => correctIds.includes(id));
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    // Background blur shapes for glassmorphism
    blob1: {
      position: "absolute",
      top: -rV(100),
      left: -rS(50),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      top: rV(300),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#6366F118",
    },
    // Styles meant for Questions.tsx overrides (passed via the `styles` prop).
    questionContainer: {
      backgroundColor:
        colorScheme === "dark" ? themeColors.cardGlass : "transparent",
      borderRadius: rMS(36),
      padding: rMS(24),
      marginHorizontal: rS(16),
      marginTop: rV(100), // Below fixed header
      marginBottom: rV(24),
      borderWidth: colorScheme === "dark" ? 1 : 0,
      borderColor: themeColors.border + "60",
      minHeight: rV(140),
    },
    questionText: {
      fontSize: rMS(20),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      lineHeight: rMS(28),
    },
    answersContainer: {
      paddingHorizontal: rS(16),
    },
    errorMessage: {
      alignSelf: "center",
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginVertical: rV(16),
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
    // Multiplayer-only fast-answer cue (banner that briefly flashes when
    // the user answers correctly under 2× question duration).
    fastAnswerCue: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      backgroundColor:
        colorScheme === "dark"
          ? "rgba(15,17,23,0.96)"
          : "rgba(245,246,250,0.96)",
      borderBottomLeftRadius: rMS(24),
      borderBottomRightRadius: rMS(24),
      paddingTop: Math.max(rV(20), insets.top + rV(10)),
      paddingBottom: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      borderBottomWidth: 2,
      borderBottomColor: themeColors.tint + "40",
    },
    fastAnswerCueText: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.tint,
      letterSpacing: 0.3,
    },
  });

  // Render UI
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Timer and Question Counter Row as Glass Header */}
      {!gameEnded && gameQuestions.length > 0 && !error && (
        <QuizGlassHeader
          currentQuestionIndex={currentQuestion}
          totalQuestions={gameQuestions.length}
          currentStreak={currentStreak}
          timeLeft={timeLeft}
          progressBarWidth={progressBarWidth}
          progressBarPulse={progressBarPulse}
          questionCounterPulse={questionCounterPulse}
          musicMuted={musicMuted}
          soundMuted={soundMuted}
          onToggleMusic={onToggleMusic}
          onToggleSound={onToggleSound}
        />
      )}

      {/* Multiplayer-only fast-answer cue — kept inline because it's not
          shared with single-player or weekly exam. */}
      {showFastAnswerCue && (
        <Animated.View style={[styles.fastAnswerCue, {
          opacity: fastCueOpacity,
          transform: [{ scale: fastCueScale }],
        }]}>
          <Text style={{ fontSize: rMS(18) }}>⚡</Text>
          <Text style={styles.fastAnswerCueText}>Quick thinking!</Text>
        </Animated.View>
      )}

      {/* AI Prediction Display */}
      <PrinceWisdomBanner
        visible={askTheAIActive && aiPrediction !== null}
        wisdomPrefix={aiWisdomPrefix}
        predictionText={
          gameAnswers.find((ans) => ans.id === aiPrediction)?.text
        }
      />

      {/* Questions Section */}
      {!error && (
        <GameQuestionsScroll>
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
        </GameQuestionsScroll>
      )}

      {/* Power-ups Section - Fixed at Bottom */}
      <PowerUpStrip
        doubleDipActive={doubleDipActive}
        doubleDipUsed={doubleDipUsed}
        askTheAIActive={askTheAIActive}
        askTheAIUsed={askTheAIUsed}
        onDoubleDip={activateDoubleDip}
        onAskPrince={activateAskTheAI}
        doubleDipScale={doubleDipScale}
        doubleDipGlow={doubleDipGlow}
        askTheAIScale={askTheAIScale}
        askTheAIGlow={askTheAIGlow}
        disabled={gameEnded}
      />

      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
}
