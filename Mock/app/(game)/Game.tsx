// Game.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../components/AuthContext";
import { getGameDetails } from "../../GamesApiCalls";
import { getPracticeAnswers } from "../../CoursesApiCalls";
import Questions from "../../components/Questions";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { StatusBar } from "expo-status-bar";

export default function Game() {
  const { userToken, userInfo } = useAuth();
  const { gameId, gameCode } = useLocalSearchParams();
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
  const [questionDuration, setQuestionDuration] = useState<number>(20000); // Default duration set to 20 seconds
  const webSocket = useRef<WebSocket | null>(null);

  const {
    data: gameDetails,
    error: gameDetailsError,
    refetch: refetchGameDetails,
  } = useQuery<GameDetailsResponse, Error>({
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
          const answersPromises = gameDetails.questions.map(
            (gameQuestion: Question) =>
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

    const questionsWithMultipleCorrect: number[] = [];
    gameQuestions.forEach((question) => {
      const correctAnswersCount = gameAnswers.filter(
        (answer) => answer.question === question.id && answer.isRight
      ).length;
      if (correctAnswersCount > 1) {
        questionsWithMultipleCorrect.push(question.id);
      }
    });
    setQuestionsWithMultipleCorrectAnswers(questionsWithMultipleCorrect);
  }, [gameQuestions, gameAnswers]);

  useEffect(() => {
    if (gameQuestions.length === 0) return;

    const timer = setTimeout(() => {
      if (questionDuration) {
        if (currentQuestion < gameQuestions.length - 1) {
          setCurrentQuestion((prevQuestion) => prevQuestion + 1);
        } else {
          handleSubmit();
        }
      }
    }, questionDuration);

    return () => clearTimeout(timer);
  }, [currentQuestion, questionDuration, gameQuestions]);

  const sendWebSocketMessage = (questionId: number) => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "attempt_question",
        question_id: questionId,
        game_id: gameId,
      };
      webSocket.current.send(JSON.stringify(message));
      console.log("We have sent a message");
    }
  };

  const sendSubmitScoreMessage = (scorePercentage: number) => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "submit_score",
        score: scorePercentage,
        user_id: userInfo?.user.id,
        game_id: gameId,
      };
      webSocket.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    webSocket.current = new WebSocket(
      `wss://learnitor.onrender.com/games/${gameCode}/ws/`
    );

    webSocket.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    webSocket.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    webSocket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    webSocket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (
        message.type === "question.attempted" &&
        message.question_id === gameQuestions[currentQuestion].id
      ) {
        if (currentQuestion < gameQuestions.length - 1) {
          setCurrentQuestion((prevQuestion) => prevQuestion + 1);
        } else {
          handleSubmit();
        }
      } else if (message.type === "all_scores_submitted") {
        const scoresObject = message.scores.reduce((acc, score) => {
          acc[score.user_id] = score.score;
          return acc;
        }, {});
        setAllScores(scoresObject);
        setTimeout(() => {
          router.replace({
            pathname: "Results",
            params: {
              scores: JSON.stringify(scoresObject),
              gameId: gameId,
              practiceQuestions: JSON.stringify(gameQuestions),
              practiceAnswers: JSON.stringify(gameAnswers),
            },
          });
        }, 0);
      }
    };

    return () => {
      if (webSocket.current) {
        webSocket.current.close();
      }
    };
  }, [gameCode, gameQuestions, currentQuestion, userInfo]);

  const handleAnswerSelection = (answerId: number, questionId: number) => {
    setSelectedAnswers((prevSelectedAnswers) => {
      const updatedAnswers = { ...prevSelectedAnswers };

      const correctAnswersCount = gameAnswers.filter(
        (answer) => answer.question === questionId && answer.isRight
      ).length;

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        const selected = updatedAnswers[questionId] || [];
        if (
          !selected.includes(answerId) &&
          selected.length < correctAnswersCount
        ) {
          selected.push(answerId);
          updatedAnswers[questionId] = selected;
          if (selected.length === correctAnswersCount) {
            sendWebSocketMessage(questionId);
          }
        }
      } else {
        updatedAnswers[questionId] = [answerId];
        sendWebSocketMessage(questionId);
      }

      return updatedAnswers;
    });
  };

  const handleSubmit = () => {
    let totalQuestions = gameQuestions.length;
    let correctAnswers = 0;

    const results = gameQuestions.map((question) => {
      const selectedAnswerIds = selectedAnswers[question.id] || [];
      const correctAnswerIds = gameAnswers
        .filter((answer) => answer.question === question.id && answer.isRight)
        .map((answer) => answer.id);

      const isCorrect =
        selectedAnswerIds.length === correctAnswerIds.length &&
        selectedAnswerIds.every((id) => correctAnswerIds.includes(id));

      if (isCorrect) {
        correctAnswers++;
      }

      const allAnswers = gameAnswers
        .filter((answer) => answer.question === question.id)
        .map((answer) => ({
          id: answer.id,
          text: answer.text,
          isSelected: selectedAnswerIds.includes(answer.id),
          isCorrect: answer.isRight,
        }));

      return {
        question: question.text,
        allAnswers,
        isCorrect,
      };
    });

    let scorePercentage = (correctAnswers / totalQuestions) * 100;
    sendSubmitScoreMessage(scorePercentage);
  };

  const isAnswerSelected = (questionId: number, answerId: number) => {
    return (
      selectedAnswers[questionId] &&
      selectedAnswers[questionId].includes(answerId)
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  // if (gameLoading)
  //   return (
  //     <View style={styles.container}>
  //       <Text>Loading...</Text>
  //     </View>
  //   );
  // if (gameError)
  //   return (
  //     <View style={styles.container}>
  //       <Text>Error: {gameError.message}</Text>
  //     </View>
  //   );

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
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
        />
      )}
    </View>
  );
}
