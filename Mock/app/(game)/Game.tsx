import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, useColorScheme, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../components/AuthContext";
import { getGameDetails } from "../../GamesApiCalls";
import { getPracticeAnswers } from "../../CoursesApiCalls";
import Questions from "../../components/Questions";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { rMS, rV, SIZES } from "../../constants";
import GameButton from "../../components/GameButton";
import WsUrl from "../../configWs";

export default function Game() {
  const { userToken, userInfo } = useAuth();
  const { gameId, gameCode } = useLocalSearchParams();

  // Game state variables
  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [questionsWithMultipleCorrectAnswers, setQuestionsWithMultipleCorrectAnswers] = useState<number[]>([]);
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

  const webSocket = useRef<WebSocket | null>(null);
  const handleMessageRef = useRef<(event: MessageEvent) => void>(() => {});
  const startTimeRef = useRef<number>(0); // Added startTimeRef
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Fetch game details from the backend
  const { data: gameDetails } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  // Initialize game state when gameDetails is loaded
  useEffect(() => {
    if (gameDetails) {
      setGameQuestions(gameDetails.questions || []);
      setQuestionDuration((gameDetails.duration || 20) * 1000);
      if (gameDetails.ended) setGameEnded(true);
      if (gameDetails.questions) {
        const fetchAllAnswers = async () => {
          const answersPromises = gameDetails.questions.map((question: Question) =>
            getPracticeAnswers(question.id, userToken?.token)
          );
          const answers = await Promise.all(answersPromises);
          setGameAnswers(answers.flat());
        };
        fetchAllAnswers();
      }
    }
  }, [gameDetails, userToken]);

  // Identify questions with multiple correct answers
  useEffect(() => {
    if (gameQuestions.length === 0 || gameAnswers.length === 0) return;
    const multiCorrect = gameQuestions
      .filter((q) => gameAnswers.filter((a) => a.question === q.id && a.isRight).length > 1)
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
      const message = JSON.parse(event.data);
      console.log(`Player ${userInfo?.user.id} received:`, message);

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
          console.log("WebSocket closed due to game end.");
        }
        if (!redirected) {
          setRedirected(true);
          router.replace({
            pathname: "Results",
            params: { scores: JSON.stringify(scoresObject), gameId },
          });
        }
      }
    };
  }, [currentQuestion, gameQuestions, gameId, gameEnded, userInfo, redirected]);

  // Fallback navigation if game ends with scores
  useEffect(() => {
    if (gameEnded && Object.keys(allScores).length > 0 && !redirected) {
      setRedirected(true);
      if (webSocket.current) {
        console.log("Closing websocket");
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

    const ws = new WebSocket(`${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken.token}`);
    webSocket.current = ws;

    ws.onopen = () => console.log(`WebSocket opened for Player ${userInfo?.user.id}`);
    ws.onerror = (error) => console.error(`WebSocket error for Player ${userInfo?.user.id}:`, error);
    ws.onmessage = (event) => handleMessageRef.current(event);
    ws.onclose = () => {
      console.log(`WebSocket closed for Player ${userInfo?.user.id}`);
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
      const correctCount = gameAnswers.filter((a) => a.question === questionId && a.isRight).length;

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        if (updated[questionId]?.length === correctCount) return updated;
        if (!updated[questionId]) updated[questionId] = [answerId];
        else if (!updated[questionId].includes(answerId)) updated[questionId].push(answerId);
        if (updated[questionId].length === correctCount) attemptQuestion(questionId);
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
      setDoubleDipActive(true);
      setDoubleDipUsed(true);
    }
  };

  // Power-up: Ask The AI
  const activateAskTheAI = () => {
    if (!askTheAIUsed && !doubleDipActive && !askTheAIActive && !gameEnded) {
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
    container: { flex: 1 },
    powerUpContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      margin: rMS(10),
    },
    aiPrediction: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      textAlign: "center",
      alignSelf: "center",
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
  });

  // Render UI
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <View style={styles.powerUpContainer}>
          <GameButton
            title="Double Dip"
            onPress={activateDoubleDip}
            disabled={doubleDipUsed || doubleDipActive || askTheAIActive || gameEnded}
          />
          <GameButton
            title="Ask The Prince"
            onPress={activateAskTheAI}
            disabled={askTheAIUsed || askTheAIActive || doubleDipActive || gameEnded}
          />
        </View>
        {askTheAIActive && aiPrediction !== null && (
          <View style={styles.aiPrediction}>
            <Text>The Prince thinks the correct answer is:</Text>
            <Text>{gameAnswers.find((ans) => ans.id === aiPrediction)?.text}</Text>
          </View>
        )}
        {!gameEnded && gameQuestions.length > 0 && (
          <Text style={{ fontSize: SIZES.large, color: themeColors.text, textAlign: 'center', marginVertical: rV(10) }}>
             {Math.ceil(timeLeft / 1000)} seconds
          </Text>
        )}
        {gameQuestions.length > 0 && (
          <Questions
            practiceQuestions={gameQuestions}
            practiceAnswers={gameAnswers}
            currentQuestion={currentQuestion}
            questionsWithMultipleCorrectAnswers={questionsWithMultipleCorrectAnswers}
            isAnswerSelected={isAnswerSelected}
            handleAnswerSelection={handleAnswerSelection}
            styles={styles}
          />
        )}
      </View>
    </ScrollView>
  );
}