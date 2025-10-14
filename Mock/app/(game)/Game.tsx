import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../components/AuthContext";
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

export default function Game() {
  const { userToken, userInfo } = useAuth();
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

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // Animation refs for power-ups
  const doubleDipScale = useRef(new Animated.Value(1)).current;
  const askTheAIScale = useRef(new Animated.Value(1)).current;
  const doubleDipGlow = useRef(new Animated.Value(0)).current;
  const askTheAIGlow = useRef(new Animated.Value(0)).current;

  const webSocket = useRef<WebSocket | null>(null);
  const handleMessageRef = useRef<(event: MessageEvent) => void>(() => {});
  const startTimeRef = useRef<number>(0); // Added startTimeRef
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

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = questionDuration - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
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

  // Reset power-ups when question changes
  useEffect(() => {
    if (gameEnded) return;
    setAiPrediction(null);
    setAskTheAIActive(false);
    setDoubleDipActive(false);
  }, [currentQuestion, gameEnded]);

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

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        if (updated[questionId]?.length === correctCount) return updated;
        if (!updated[questionId]) updated[questionId] = [answerId];
        else if (!updated[questionId].includes(answerId))
          updated[questionId].push(answerId);
        if (updated[questionId].length === correctCount)
          attemptQuestion(questionId);
      } else {
        if (updated[questionId]?.length > 0 && !doubleDipActive) return updated;
        if (doubleDipActive) {
          if (updated[questionId]?.length >= 2) return updated;
          if (!updated[questionId]) updated[questionId] = [answerId];
          else updated[questionId].push(answerId);
          if (updated[questionId].length === 2) {
            setDoubleDipActive(false);
            attemptQuestion(questionId);
          }
        } else {
          updated[questionId] = [answerId];
          attemptQuestion(questionId);
        }
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
      setTimeout(() => {
        setAskTheAIActive(false);
        setAiPrediction(null);
      }, 20000);
      setAskTheAIUsed(true);
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
    aiPredictionTitle: {
      fontSize: rMS(16),
      fontWeight: "bold",
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    aiPredictionText: {
      fontSize: rMS(14),
      color: themeColors.text,
      fontStyle: "italic",
    },
    timerContainer: {
      alignItems: "center",
      marginVertical: rV(16),
    },
    timerText: {
      fontSize: rMS(24),
      fontWeight: "bold",
      color: themeColors.tint,
      textAlign: "center",
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
  });

  // Render UI
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Timer Display */}
      {!gameEnded && gameQuestions.length > 0 && !error && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {`${Math.floor(timeLeft / 60000)
              .toString()
              .padStart(2, "0")}:${Math.floor((timeLeft % 60000) / 1000)
              .toString()
              .padStart(2, "0")}`}
          </Text>
        </View>
      )}

      {/* AI Prediction Display */}
      {askTheAIActive && aiPrediction !== null && (
        <View style={styles.aiPrediction}>
          <Text style={styles.aiPredictionTitle}>🤖 The Prince's Wisdom</Text>
          <Text style={styles.aiPredictionText}>
            "I believe the answer is:{" "}
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
