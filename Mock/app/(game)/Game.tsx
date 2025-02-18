import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Button, Text, useColorScheme } from "react-native";
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
  const [doubleDipActive, setDoubleDipActive] = useState(false);
  const [askTheAIActive, setAskTheAIActive] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [doubleDipUsed, setDoubleDipUsed] = useState(false); // Track if Double Dip power-up has been used
  const [askTheAIUsed, setAskTheAIUsed] = useState(false); // Track if Ask the AI power-up has been used

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  useEffect(() => {
    // Clear AI prediction and reset power-up states when the question changes
    setAiPrediction(null);
    setAskTheAIActive(false);
    setDoubleDipActive(false);
  }, [currentQuestion]);

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
        if (selected.includes(answerId)) {
          // Deselect the answer if it is already selected
          updatedAnswers[questionId] = selected.filter((id) => id !== answerId);
        } else if (selected.length < correctAnswersCount) {
          // Add the answer if it is not already selected and under the limit
          selected.push(answerId);
          updatedAnswers[questionId] = selected;
          if (selected.length === correctAnswersCount) {
            sendWebSocketMessage(questionId);
          }
        }
      } else {
        // For questions with a single correct answer, allow changing the answer if double dip is active
        if (doubleDipActive) {
          if (
            updatedAnswers[questionId] &&
            updatedAnswers[questionId].includes(answerId)
          ) {
            return updatedAnswers;
          }
          const isCorrect = gameAnswers.find(
            (answer) => answer.id === answerId
          )?.isRight;
          if (!isCorrect) {
            updatedAnswers[questionId] = [
              ...(updatedAnswers[questionId] || []),
              answerId,
            ];
            if ((updatedAnswers[questionId].length = 2)) {
              setDoubleDipActive(false); // Deactivate double dip after two attempts
            }
          } else {
            updatedAnswers[questionId] = [answerId]; // If correct, reset to single correct answer
            setDoubleDipActive(false); // Deactivate double dip
            sendWebSocketMessage(questionId);
          }
        } else {
          updatedAnswers[questionId] = [answerId];
          sendWebSocketMessage(questionId);
        }
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

  const activateDoubleDip = () => {
    if (!doubleDipUsed && !askTheAIActive && !doubleDipActive) {
      setDoubleDipActive(true);
      setDoubleDipUsed(true); // Mark Double Dip as used
    }
  };

  const activateAskTheAI = () => {
    if (!askTheAIUsed && !doubleDipActive && !askTheAIActive) {
      setAskTheAIActive(true);
      const currentQuestionId = gameQuestions[currentQuestion].id;

      // Simulate AI prediction (in a real scenario, this would involve calling an AI service)
      const correctAnswerIds = gameAnswers
        .filter(
          (answer) => answer.question === currentQuestionId && answer.isRight
        )
        .map((answer) => answer.id);
      const aiGuess =
        correctAnswerIds[Math.floor(Math.random() * correctAnswerIds.length)];
      setAiPrediction(aiGuess);

      // Deactivate after a short period (e.g., 10 seconds)
      setTimeout(() => {
        setAskTheAIActive(false);
        setAiPrediction(null);
      }, 20000);

      setAskTheAIUsed(true); // Mark Ask The AI as used
    }
  };

  const answerLabels = ["A", "B", "C", "D"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
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
    correctAnswer: {
      backgroundColor: "#097969",
    },
    wrongAnswer: {
      backgroundColor: "#D22B2B",
    },
  });

  return (
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
          <Text>
            {gameAnswers.find((answer) => answer.id === aiPrediction)?.text}
          </Text>
        </View>
      )}
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
    </View>
  );
}