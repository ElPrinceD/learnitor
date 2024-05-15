import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

interface Question {
  text: string;
  id: number;
  level: string;
}

interface Answer {
  text: string;
  id: number;
  isRight: boolean;
  question: number;
}

interface QuestionProps {
  practiceQuestions: Question[];
  practiceAnswers: Answer[];
}

const Questions: React.FC<QuestionProps> = ({
  practiceQuestions,
  practiceAnswers,
}) => {
  const colorScheme = useColorScheme();
  const { isTimed, duration } = useLocalSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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

  // Calculate progress percentage
  const progress = (currentQuestion + 1) / practiceQuestions.length;

  const styles = StyleSheet.create({
    container: {
      marginTop: "50%",
      padding: 20,
      borderRadius: 10,
      elevation: 1,
      backgroundColor: colorScheme === "dark" ? "#181818" : "#fff",
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
      width: `${progress * 100}%`,
    },
    questionText: {
      fontSize: 16,
      marginBottom: 5,
      color: colorScheme === "dark" ? "#fff" : "#555",
    },
    answersContainer: {
      marginTop: 5,
      color: colorScheme === "dark" ? "#fff" : "#181818",
    },
    answerTouchable: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
      backgroundColor: colorScheme === "dark" ? "#333" : "#f0f0f0",
      padding: 10,
      borderRadius: 5,
    },
    selectedAnswer: {
      backgroundColor: colorScheme === "dark" ? "#555" : "#ccc",
    },
    answerText: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#fff" : "#444",
      marginLeft: 10,
    },
    checkBox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: "#888",
      borderRadius: 3,
      marginRight: 10,
    },
    checkedBox: {
      backgroundColor: "#888",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    buttonText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#bbb" : "#337ab7",
    },
    disabledButtonText: {
      color: "#ccc",
    },
    timer: {
      fontSize: 18,
      textAlign: "center",
      marginVertical: 10,
    },
  });

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar} />
        </View>
        {timeLeft !== null && (
          <Text style={styles.timer}>
            Time Left: {Math.floor(timeLeft / 60)}:
            {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
          </Text>
        )}
        {practiceQuestions.length > 0 && (
          <View key={currentQuestion}>
            {practiceQuestions[currentQuestion] &&
              practiceQuestions[currentQuestion].text && (
                <Text style={styles.questionText}>
                  {`${currentQuestion + 1}. ${
                    practiceQuestions[currentQuestion].text
                  }`}
                </Text>
              )}
            <View style={styles.answersContainer}>
              {practiceAnswers
                .filter(
                  (answer) =>
                    answer.question === practiceQuestions[currentQuestion].id
                )
                .map((answer, ansIndex) => (
                  <TouchableOpacity
                    key={ansIndex}
                    style={[
                      styles.answerTouchable,
                      isAnswerSelected(
                        practiceQuestions[currentQuestion].id,
                        answer.id
                      ) && styles.selectedAnswer,
                    ]}
                    onPress={() =>
                      handleAnswerSelection(
                        answer.id,
                        practiceQuestions[currentQuestion].id
                      )
                    }
                  >
                    {questionsWithMultipleCorrectAnswers.includes(
                      practiceQuestions[currentQuestion].id
                    ) && (
                      <View
                        style={[
                          styles.checkBox,
                          isAnswerSelected(
                            practiceQuestions[currentQuestion].id,
                            answer.id
                          ) && styles.checkedBox,
                        ]}
                      />
                    )}
                    {answer && answer.text && (
                      <Text style={styles.answerText}>{answer.text}</Text>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
        <View style={styles.buttonContainer}>
          {currentQuestion > 0 && (
            <TouchableOpacity
              onPress={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
          )}
          {currentQuestion < practiceQuestions.length - 1 && (
            <TouchableOpacity onPress={handleNextQuestion}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
          {currentQuestion === practiceQuestions.length - 1 && (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
            >
              <Text
                style={[
                  styles.buttonText,
                  isSubmitDisabled && styles.disabledButtonText,
                ]}
              >
                Submit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Questions;
