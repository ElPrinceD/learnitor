import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import axios from "axios";
import { useLocalSearchParams, router } from "expo-router";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";

import Questions from "../../components/Questions";
import { Question, Answer } from "../../components/types";

export default function Game() {
  const { userToken } = useAuth();
  const { gameId } = useLocalSearchParams();
  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);

  // Fetch game details, including questions, from the server
  useEffect(() => {
    console.log(gameId)
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get(`${ApiUrl}:8000/games/${gameId}/`, {
          headers: { Authorization: `Token ${userToken?.token}` },
        });

        const gameData = response.data;
        setGameQuestions(gameData.questions);

        const answersPromises = gameData.questions.map(
          async (gameQuestion: Question) => {
            const answersResponse = await axios.get(
              `${ApiUrl}:8000/api/course/topic/questions/${gameQuestion.id}/answers`,
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
    const timer = setTimeout(() => {
      setCurrentQuestion((prevQuestion) => (prevQuestion + 1) % gameQuestions.length);
    }, 10000);

    return () => clearTimeout(timer);
  }, [currentQuestion, gameQuestions]);

  const handleAnswerSelection = (answerId: number, questionId: number) => {
    setSelectedAnswers((prevSelectedAnswers) => {
      const updatedAnswers = { ...prevSelectedAnswers };

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        const selected = updatedAnswers[questionId] || [];
        const index = selected.indexOf(answerId);
        if (index !== -1) {
          selected.splice(index, 1);
        } else {
          selected.push(answerId);
        }
        updatedAnswers[questionId] = selected;
      } else {
        updatedAnswers[questionId] = [answerId];
      }

      return updatedAnswers;
    });

    // Move to the next question if not the last one
    if (currentQuestion < gameQuestions.length - 1) {
      setCurrentQuestion((prevQuestion) => prevQuestion + 1);
    } else {
      handleSubmit();
    }
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

    // Defer the navigation call to avoid potential re-renders
    setTimeout(() => {
      router.replace({
        pathname: "ScorePage",
        params: {
          score: scorePercentage.toFixed(2),
          results: JSON.stringify(results),
          practiceQuestions: JSON.stringify(gameQuestions), // Corrected parameter name
          practiceAnswers: JSON.stringify(gameAnswers),
        },
      });
    }, 0);
  };

  const isAnswerSelected = (questionId: number, answerId: number) => {
    return (
      selectedAnswers[questionId] &&
      selectedAnswers[questionId].includes(answerId)
    );
  };

  useEffect(() => {
    console.log(gameQuestions);
  }, [gameQuestions]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
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
