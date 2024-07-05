import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-root-toast";
import { useQuery } from "@tanstack/react-query";
import Questions from "../../../components/Questions";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Question, Answer } from "../../../components/types";
import GameButton from "../../../components/GameButton";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import {
  getPracticeQuestions,
  getPracticeAnswers,
} from "../../../CoursesApiCalls";

const PracticeQuestions: React.FC = () => {
  const { topic, level, isTimed, duration } = useLocalSearchParams();
  const { userToken } = useAuth();
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

  const {
    status: questionsStatus,
    data: practiceQuestions,
    error: questionsError,
  } = useQuery({
    queryKey: ["topicQuestions", parsedTopic.id],
    queryFn: () =>
      getPracticeQuestions(parsedTopic.id, userToken?.token, parsedLevel),
    enabled: !!parsedTopic.id,
  });

  const {
    status: answersStatus,
    data: practiceAnswers,
    error: answersError,
  } = useQuery({
    queryKey: ["questionAnswers", parsedTopic.id],
    queryFn: async () => {
      if (practiceQuestions) {
        const answersPromises = practiceQuestions.map((question: Question) =>
          getPracticeAnswers(question.id, userToken?.token)
        );
        const answers = await Promise.all(answersPromises);
        return answers.flat();
      }
      return [];
    },
    enabled: !!practiceQuestions?.length,
  });

  useEffect(() => {
    if (isTimed === "true" && duration) {
      const durationInMinutes = Number(duration);
      setTimeLeft(durationInMinutes * 60); // Convert minutes to seconds
    }
  }, [isTimed, duration]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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

  useEffect(() => {
    if (practiceQuestions && practiceAnswers) {
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
    }
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
    let totalQuestions = practiceQuestions?.length;
    let correctAnswers = 0;

    const results = practiceQuestions?.map((question) => {
      const selectedAnswerIds = selectedAnswers[question.id] || [];
      const correctAnswerIds = practiceAnswers!
        .filter((answer) => answer.question === question.id && answer.isRight)
        .map((answer) => answer.id);

      const isCorrect =
        selectedAnswerIds.length === correctAnswerIds.length &&
        selectedAnswerIds.every((id) => correctAnswerIds.includes(id));

      if (isCorrect) {
        correctAnswers++;
      }

      const allAnswers = practiceAnswers!
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

    let scorePercentage = (correctAnswers / totalQuestions!) * 100;

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

  const allQuestionsAnswered = practiceQuestions?.every(
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
        opacity: 0.8,
      });
    }
  };

  const progress = (currentQuestion + 1) / (practiceQuestions?.length || 1);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          marginTop: rV(30),
          padding: rMS(20),
          elevation: 1,
        },
        questionNumberText: {
          color: themeColors.tint,
          fontSize: SIZES.medium,
          fontWeight: "bold",
        },
        buttonContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingTop: rV(30),
        },
        button: {
          backgroundColor: themeColors.buttonBackground,
          padding: rMS(15),
          flex: 1,
          marginHorizontal: rS(10),
          borderTopLeftRadius: 20,
          borderBottomRightRadius: 20,
          margin: rMS(10),
        },
        disabledButtonText: {
          backgroundColor: themeColors.buttonDisabled,
          padding: rMS(15),
          flex: 1,
          marginHorizontal: rS(10),
          borderTopLeftRadius: 20,
          borderBottomRightRadius: 20,
          opacity: 0.5,
          margin: rMS(10),
        },
        timer: {
          fontSize: SIZES.medium,
          textAlign: "center",
          color: themeColors.text,
          fontWeight: "bold",
        },
        timerRed: {
          color: "#D22B2B",
          fontWeight: "bold",
        },
      }),
    [themeColors]
  );

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
          Question {currentQuestion + 1} / {practiceQuestions?.length || 0}
        </Text>
      </View>
      {practiceQuestions && practiceAnswers && (
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
      )}
      <View style={styles.buttonContainer}>
        {currentQuestion > 0 && (
          <GameButton
            onPress={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            style={styles.button}
            title="Previous"
          />
        )}
        {currentQuestion < (practiceQuestions?.length || 0) - 1 && (
          <GameButton
            onPress={handleNextQuestion}
            style={styles.button}
            title="Next"
          />
        )}
        {currentQuestion === (practiceQuestions?.length || 0) - 1 && (
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
