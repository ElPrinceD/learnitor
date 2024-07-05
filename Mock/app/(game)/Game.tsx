import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import axios from "axios";
import { useLocalSearchParams, router } from "expo-router";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { StatusBar } from "expo-status-bar";

import Questions from "../../components/Questions";
import { Question, Answer } from "../../components/types";
import { useWebSocket } from "../../GameWebSocket";

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

  const goToGame = () => {
    // Navigate to game logic
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

  const { sendWebSocketMessage, refetchGameDetails } = useWebSocket(
    gameCode,
    userInfo,
    (newPlayers) => {},
    goToGame,
    gameId,
    userToken,
    setAllScores,
    setCurrentQuestion,
    currentQuestion,
    gameQuestions,
    handleSubmit
  );

  // Function to send WebSocket message when a user attempts a question
  const sendAttemptQuestionMessage = (questionId: number) => {
    const message = {
      type: "attempt_question",
      question_id: questionId,
      game_id: gameId,
    };
    sendWebSocketMessage(message);
  };

  const sendSubmitScoreMessage = (scorePercentage: number) => {
    const message = {
      type: "submit_score",
      score: scorePercentage,
      user_id: userInfo?.user.id,
      game_id: gameId,
    };
    sendWebSocketMessage(message);
  };

  // Fetch game details, including questions, from the server
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get(`${ApiUrl}/games/${gameId}/`, {
          headers: { Authorization: `Token ${userToken?.token}` },
        });

        const gameData = response.data;
        setGameQuestions(gameData.questions || []);
        setQuestionDuration((gameData.duration || 20) * 1000); // Convert duration to milliseconds

        const answersPromises = (gameData.questions || []).map(
          async (gameQuestion: Question) => {
            const answersResponse = await axios.get(
              `${ApiUrl}/api/course/topic/questions/${gameQuestion.id}/answers`,
              {
                headers: { Authorization: `Token ${userToken?.token}` },
              }
            );
            return answersResponse.data;
          }
        );

        const answers = await Promise.all(answersPromises);
        setGameAnswers(answers.flat());
      } catch (error) {
        console.error("Error fetching game details:", error);
      }
    };

    fetchGameDetails();
  }, [gameId, userToken]);

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
            sendAttemptQuestionMessage(questionId);
          }
        }
      } else {
        updatedAnswers[questionId] = [answerId];
        sendAttemptQuestionMessage(questionId);
      }

      return updatedAnswers;
    });
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
