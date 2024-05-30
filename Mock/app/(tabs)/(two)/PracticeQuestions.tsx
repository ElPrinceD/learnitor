import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-root-toast";

import axios from "axios";
import Questions from "../../../components/Questions";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Question, Answer } from "../../../components/types";
import GameButton from "../../../components/GameButton";
import ProgressBar from "../../../components/ProgressBar";
import Colors from "../../../constants/Colors";

const PracticeQuestions: React.FC = () => {
  const { topic, level, course, isTimed, duration } = useLocalSearchParams();
  const { userToken } = useAuth();
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const parsedLevel: string = typeof level === "string" ? level : "";
  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  useEffect(() => {
    fetchData();
  }, [parsedTopic.id]);

  useEffect(() => {
    if (isTimed === "true" && duration) {
      const durationInMinutes = Number(duration);
      setTimeLeft(durationInMinutes * 60); // Convert minutes to seconds
    }
  }, [isTimed, duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            clearInterval(timer);
            handleSubmit(); // Trigger submission when timer reaches zero
            return 0;
          }
          return prevTime! - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer); // Cleanup interval on unmount
  }, [timeLeft]);

  const fetchData = async () => {
    try {
      const questionsResponse = await axios.get(
        `${ApiUrl}:8000/api/course/topic/${parsedTopic.id}/questions/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      const filteredQuestions = questionsResponse.data.filter(
        (question: Question) => question.level === parsedLevel
      );
      setPracticeQuestions(filteredQuestions);

      const answersPromises = filteredQuestions.map(
        async (question: Question) => {
          const answersResponse = await axios.get(
            `${ApiUrl}:8000/api/course/topic/questions/${question.id}/answers`,
            {
              headers: {
                Authorization: `Token ${userToken?.token}`,
              },
            }
          );
          return answersResponse.data;
        }
      );

      const answers = await Promise.all(answersPromises);
      setPracticeAnswers(answers.flat());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const questionsWithMultipleCorrect: number[] = [];
    practiceQuestions.forEach((question) => {
      const correctAnswersCount = practiceAnswers.filter(
        (answer) => answer.question === question.id && answer.isRight
      ).length;
      if (correctAnswersCount > 1) {
        questionsWithMultipleCorrect.push(question.id);
      }
    });
    setQuestionsWithMultipleCorrectAnswers(questionsWithMultipleCorrect);
  }, [practiceQuestions, practiceAnswers]);

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
        if (updatedAnswers[questionId]?.[0] === answerId) {
          updatedAnswers[questionId] = [];
        } else {
          updatedAnswers[questionId] = [answerId];
        }
      }

      return updatedAnswers;
    });
  };

  const handleNextQuestion = () => {
    setCurrentQuestion((prevQuestion) => prevQuestion + 1);
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestion((prevQuestion) => prevQuestion - 1);
  };

  const handleSubmit = () => {
    let totalQuestions = practiceQuestions.length;
    let correctAnswers = 0;

    const results = practiceQuestions.map((question) => {
      const selectedAnswerIds = selectedAnswers[question.id] || [];
      const correctAnswerIds = practiceAnswers
        .filter((answer) => answer.question === question.id && answer.isRight)
        .map((answer) => answer.id);

      const isCorrect =
        selectedAnswerIds.length === correctAnswerIds.length &&
        selectedAnswerIds.every((id) => correctAnswerIds.includes(id));

      if (isCorrect) {
        correctAnswers++;
      }

      const allAnswers = practiceAnswers
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
          practiceQuestions: JSON.stringify(practiceQuestions),
          practiceAnswers: JSON.stringify(practiceAnswers),
          topic: topic,
          course: course,
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

  const allQuestionsAnswered = practiceQuestions.every(
    (question) =>
      selectedAnswers[question.id] && selectedAnswers[question.id].length > 0
  );

  const isSubmitDisabled = !allQuestionsAnswered;

  const handleDisabledSubmitPress = () => {
    if (isSubmitDisabled) {
      Toast.show("Answer all questions", {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        //   backgroundColor: "#fdecd2",
        opacity: 0.8,
      });
    }
  };
  // Calculate progress percentage
  const progress = (currentQuestion + 1) / practiceQuestions.length;

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 50,
      padding: 20,
      elevation: 1,
    },
    questionNumberText: {
      color: themeColors.tint,
      fontSize: 15,
      fontWeight: "bold",
    },
    progressBarContainer: {
      height: 10,
      width: "100%",
      backgroundColor: "#e0e0e0",
      borderRadius: 5,
      overflow: "hidden",
      marginBottom: 20,
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#76c7c0",
    },

    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 30,
    },
    button: {
      backgroundColor: themeColors.buttonBackground,
      padding: 15,
      borderRadius: 5,
      flex: 1,
      marginHorizontal: 10,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
      margin: 10,
    },

    disabledButtonText: {
      backgroundColor: themeColors.buttonDisabled,
      padding: 15,
      borderRadius: 5,
      flex: 1,
      marginHorizontal: 10,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
      opacity: 0.5,
      margin: 10,
    },
    timer: {
      fontSize: 18,
      textAlign: "center",
      color: themeColors.text,
      fontWeight: "bold",
    },
    timerRed: {
      color: "red",
      fontWeight: "bold",
    },
  });

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
    >
      <View style={styles.container}>
        {timeLeft !== null && (
          <Text
            style={[
              styles.timer,
              timeLeft <= 60 && styles.timerRed, // Apply the red color when time is less than or equal to 60 seconds
            ]}
          >
            {Math.floor(timeLeft / 60)}:
            {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
          </Text>
        )}
        <Text style={styles.questionNumberText}>
          Question {currentQuestion + 1} / {practiceQuestions.length}
        </Text>
      </View>
      <Questions
        practiceQuestions={practiceQuestions}
        practiceAnswers={practiceAnswers}
        currentQuestion={currentQuestion}
        questionsWithMultipleCorrectAnswers={
          questionsWithMultipleCorrectAnswers
        }
        isAnswerSelected={isAnswerSelected}
        handleAnswerSelection={handleAnswerSelection}
      />
      <View style={styles.buttonContainer}>
        {currentQuestion > 0 && (
          <GameButton
            onPress={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            style={styles.button}
            title="Previous"
          />
        )}
        {currentQuestion < practiceQuestions.length - 1 && (
          <GameButton
            onPress={handleNextQuestion}
            style={styles.button}
            title="Next"
          />
        )}
        {currentQuestion === practiceQuestions.length - 1 && (
          <GameButton
            onPress={
              isSubmitDisabled ? handleDisabledSubmitPress : handleSubmit
            }
            style={isSubmitDisabled ? styles.disabledButtonText : styles.button}
            title="Submit"
          />
        )}
      </View>
    </ScrollView>
  );
};

export default PracticeQuestions;
