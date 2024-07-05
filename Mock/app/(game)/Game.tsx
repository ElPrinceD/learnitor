import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import axios from "axios";
import { useLocalSearchParams, router } from "expo-router";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { StatusBar } from "expo-status-bar";
import Questions from "../../components/Questions";
import { Question, Answer } from "../../components/types";
import Pusher from 'pusher-js/react-native';

export default function Game() {
  const { userToken, userInfo } = useAuth();
  const { gameId, gameCode } = useLocalSearchParams();
  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [questionsWithMultipleCorrectAnswers, setQuestionsWithMultipleCorrectAnswers] = useState<number[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [allScores, setAllScores] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(20000); // Default duration set to 20 seconds

  // Initialize Pusher
  const pusher = useRef(new Pusher('22084425c1dbb10259f9', {
    cluster: 'eu',
  }));

  // Establish Pusher channel subscription
  useEffect(() => {
    const channel = pusher.current.subscribe(`games-${gameCode}`);

    channel.bind('question.attempted', (data) => {
      if (data.question_id === gameQuestions[currentQuestion].id) {
        console.log("We have a message");
        if (currentQuestion < gameQuestions.length - 1) {
          console.log("We're here");
          setCurrentQuestion((prevQuestion) => prevQuestion + 1);
        } else {
          handleSubmit();
        }
      }
    });

    channel.bind('all_scores_submitted', (data) => {
      console.log(data.scores);
      const scoresObject = data.scores.reduce((acc, score) => {
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
    });

    return () => {
      pusher.current.unsubscribe(`games-${gameCode}`);
    };
  }, [gameCode, gameQuestions, currentQuestion, userInfo]);

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

      console.log(
        "Correct answers count for question",
        questionId,
        ":",
        correctAnswersCount
      );

      // If question allows multiple correct answers
      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        const selected = updatedAnswers[questionId] || [];

        if (
          !selected.includes(answerId) &&
          selected.length < correctAnswersCount
        ) {
          selected.push(answerId);
          updatedAnswers[questionId] = selected;
          console.log("selected", selected.length);

          // Send Pusher message if the correct number of answers is selected
          if (selected.length === correctAnswersCount) {
            axios.post(`${ApiUrl}/trigger-question-attempt/`, {
              question_id: questionId,
              game_id: gameId,
            }, {
              headers: { Authorization: `Token ${userToken?.token}` },
            });
          }
        }
      } else {
        // For single correct answer questions
        updatedAnswers[questionId] = [answerId];
        axios.post(`${ApiUrl}/trigger-question-attempt/`, {
          question_id: questionId,
          game_id: gameId,
        }, {
          headers: { Authorization: `Token ${userToken?.token}` },
        });
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

    axios.post(`${ApiUrl}/trigger-submit-score/`, {
      score: scorePercentage,
      user_id: userInfo?.user.id,
      game_id: gameId,
    }, {
      headers: { Authorization: `Token ${userToken?.token}` },
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
          questionsWithMultipleCorrectAnswers={questionsWithMultipleCorrectAnswers}
          isAnswerSelected={isAnswerSelected}
          handleAnswerSelection={handleAnswerSelection}
        />
      )}
    </View>
  );
}
