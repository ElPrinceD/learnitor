import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import axios from "axios";
import { useLocalSearchParams, router } from "expo-router";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";

import Questions from "../../components/Questions";
import { Question, Answer } from "../../components/types";

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

  // Function to send WebSocket message when a user attempts a question

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

  // Establish WebSocket connection
  useEffect(() => {
    webSocket.current = new WebSocket(
      `ws://192.168.48.198:8000/games/${gameCode}/ws/`
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
        console.log("We have a message");
        if (currentQuestion < gameQuestions.length - 1) {
          console.log("We're here");
          setCurrentQuestion((prevQuestion) => prevQuestion + 1);
        } else {
          handleSubmit();
        }
      } else if (message.type === "all_scores_submitted") {
        console.log(message.scores);
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

              practiceQuestions: JSON.stringify(gameQuestions), // Corrected parameter name
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

  // Fetch game details, including questions, from the server
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get(`${ApiUrl}:8000/games/${gameId}/`, {
          headers: { Authorization: `Token ${userToken?.token}` },
        });

        const gameData = response.data;
        // Debugging

        setGameQuestions(gameData.questions || []);

        setQuestionDuration((gameData.duration || 20) * 1000); // Convert duration to milliseconds

        const answersPromises = (gameData.questions || []).map(
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

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        const selected = updatedAnswers[questionId] || [];
        const index = selected.indexOf(answerId);
        if (index !== -1) {
          // If the answer is already selected, deselect it
          selected.splice(index, 1);
        } else {
          // If the answer is not selected, select it
          selected.push(answerId);
        }
        updatedAnswers[questionId] = selected;

        // Check if the correct number of answers has been selected
        if (
          selected.length ===
          gameAnswers.filter(
            (answer) => answer.question === questionId && answer.isRight
          ).length
        ) {
          // If the correct number of answers is selected, send WebSocket message
          sendWebSocketMessage(questionId);
        }
      } else {
        // For questions with single correct answers, replace the selected answer with the new one
        updatedAnswers[questionId] = [answerId];

        // Send WebSocket message immediately for questions with single correct answers
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

    // Defer the navigation call to avoid potential re-renders
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
