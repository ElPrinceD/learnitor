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
  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [questionsWithMultipleCorrectAnswers, setQuestionsWithMultipleCorrectAnswers] = useState<number[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [allScores, setAllScores] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(20000);
  const webSocket = useRef<WebSocket | null>(null);
  const [doubleDipActive, setDoubleDipActive] = useState(false);
  const [askTheAIActive, setAskTheAIActive] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [doubleDipUsed, setDoubleDipUsed] = useState(false);
  const [askTheAIUsed, setAskTheAIUsed] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { data: gameDetails } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  useEffect(() => {
    if (gameDetails) {
      setGameQuestions(gameDetails.questions || []);
      setQuestionDuration((gameDetails.duration || 20) * 1000);
      if (gameDetails?.questions) {
        const fetchAllAnswers = async () => {
          const answersPromises = gameDetails.questions.map((gameQuestion: Question) =>
            getPracticeAnswers(gameQuestion.id, userToken?.token)
          );
          const answers = await Promise.all(answersPromises);
          setGameAnswers(answers.flat());
        };
        fetchAllAnswers();
      }
    }
  }, [gameDetails, userToken]);

  useEffect(() => {
    if (gameQuestions.length === 0 || gameAnswers.length === 0) return;
    const multiCorrect: number[] = [];
    gameQuestions.forEach((question) => {
      const count = gameAnswers.filter(
        (answer) => answer.question === question.id && answer.isRight
      ).length;
      if (count > 1) multiCorrect.push(question.id);
    });
    setQuestionsWithMultipleCorrectAnswers(multiCorrect);
  }, [gameQuestions, gameAnswers]);

  useEffect(() => {
    if (gameQuestions.length === 0) return;
    const timer = setTimeout(() => {
      if (questionDuration) {
        if (currentQuestion < gameQuestions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          handleSubmit();
        }
      }
    }, questionDuration);
    return () => clearTimeout(timer);
  }, [currentQuestion, questionDuration, gameQuestions]);

  useEffect(() => {
    setAiPrediction(null);
    setAskTheAIActive(false);
    setDoubleDipActive(false);
  }, [currentQuestion]);

  const sendWebSocketMessage = (message: object) => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open, message not sent:", message);
    }
  };

  const attemptQuestion = (questionId: number) => {
    sendWebSocketMessage({
      type: "attempt_question",
      question_id: questionId,
      game_id: gameId,
    });
    console.log("Sent attempt_question for question", questionId);
  };

  const submitScore = (scorePercentage: number) => {
    sendWebSocketMessage({
      type: "submit_score",
      score: scorePercentage,
      user_id: userInfo?.user.id,
      game_id: gameId,
    });
    console.log("Sent submit_score:", scorePercentage);
  };

  useEffect(() => {
    if (!gameCode || webSocket.current) return;

    webSocket.current = new WebSocket(`${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken?.token}`);

    webSocket.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    webSocket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setTimeout(() => {
        if (!webSocket.current || webSocket.current.readyState === WebSocket.CLOSED) {
          webSocket.current = new WebSocket(`${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken?.token}`);
        }
      }, 5000);
    };

    webSocket.current.onmessage = (event) => {
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
        setTimeout(() => {
          router.replace({
            pathname: "Results",
            params: {
              scores: JSON.stringify(scoresObject),
              gameId,
              practiceQuestions: JSON.stringify(gameQuestions),
              practiceAnswers: JSON.stringify(gameAnswers),
            },
          });
        }, 0);
      }
    };

    webSocket.current.onclose = () => {
      console.log("WebSocket connection closed");
      webSocket.current = null;
    };

    return () => {
      if (webSocket.current) {
        webSocket.current.close();
      }
    };
  }, [gameCode, gameQuestions, currentQuestion, userInfo, gameId]);

  const handleAnswerSelection = (answerId: number, questionId: number) => {
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      const correctCount = gameAnswers.filter(
        (answer) => answer.question === questionId && answer.isRight
      ).length;

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

  const handleSubmit = () => {
    const total = gameQuestions.length;
    let correct = 0;
    gameQuestions.forEach((question) => {
      const selectedIds = selectedAnswers[question.id] || [];
      const correctIds = gameAnswers
        .filter((ans) => ans.question === question.id && ans.isRight)
        .map((ans) => ans.id);
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));
      if (isCorrect) correct++;
    });
    const scorePercentage = (correct / total) * 100;
    submitScore(scorePercentage);
  };

  const isAnswerSelected = (questionId: number, answerId: number) =>
    selectedAnswers[questionId]?.includes(answerId);

  const activateDoubleDip = () => {
    if (!doubleDipUsed && !askTheAIActive && !doubleDipActive) {
      setDoubleDipActive(true);
      setDoubleDipUsed(true);
    }
  };

  const activateAskTheAI = () => {
    if (!askTheAIUsed && !doubleDipActive && !askTheAIActive) {
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

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <View style={styles.powerUpContainer}>
          <GameButton
            title="Double Dip"
            onPress={activateDoubleDip}
            disabled={doubleDipUsed || doubleDipActive || askTheAIActive}
          />
          <GameButton
            title="Ask The Prince"
            onPress={activateAskTheAI}
            disabled={askTheAIUsed || askTheAIActive || doubleDipActive}
          />
        </View>
        {askTheAIActive && aiPrediction !== null && (
          <View style={styles.aiPrediction}>
            <Text>The Prince thinks the correct answer is:</Text>
            <Text>{gameAnswers.find((ans) => ans.id === aiPrediction)?.text}</Text>
          </View>
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