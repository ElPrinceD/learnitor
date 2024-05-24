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
import { Course, Topic, Question, Answer } from "./types";

interface QuestionProps {
  practiceQuestions: Question[];
  practiceAnswers: Answer[];
  topic: Topic;
  course: Course;
}

const Questions: React.FC<QuestionProps> = ({
  practiceQuestions,
  practiceAnswers,
  topic,
  course,
}) => {
  const colorScheme = useColorScheme();
  const { isTimed, duration } = useLocalSearchParams();
  let totalQuestions = practiceQuestions.length;
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
          topic: JSON.stringify(topic),
          course: JSON.stringify(course),
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
       //marginTop: "-50%",
      //padding: 20,
      backgroundColor: 'transparent',
      padding: 0,
      borderRadius: 10,
      elevation: 1,
      marginBottom: 20,
      //backgroundColor: colorScheme === "dark" ? "transparent" : "transparent",
    },
    topSection: {
      flex: 1,
      backgroundColor: "#fdecd2", // Light blue color for the top section
      paddingHorizontal: 20,
      paddingVertical: 40,
      marginTop: -250,
    },
    orange:{
      color: "#674119",
      fontSize: 22,
      
      marginTop: -10,
      paddingBottom: 10,
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
      fontSize: 35,
      marginBottom: 15,
      paddingBottom: 10,
      flexWrap: 'wrap',
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
      padding: 20,
      margin: 20,
      borderRadius: 5,
    },
    selectedAnswer: {
      backgroundColor: colorScheme === "dark" ? "#F08080" : "#F08080",
      color: "#fff"
    },
    answerText: {
      fontSize: 20,
      color: colorScheme === "dark" ? "#fff" : "#444",
      marginLeft: 10,
    },
    checkBox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: "#888",
      borderRadius: 30,
      marginRight: 10,
    },
    checkedBox: {
      backgroundColor: "#888",
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center', // Center buttons horizontally
      alignItems: 'center', // Center buttons vertically
      backgroundColor: 'red', // Set background color to red
      paddingVertical: 20, // Add some padding to the container
      paddingHorizontal: 20, // Add some padding to the container
    },
    buttonText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#7d1c1c" : "#337ab7",
    },
    disabledButtonText: {
      color: "#ccc",
    },
    timer: {
      fontSize: 18,
      textAlign: "center",
      marginVertical: 10,
    },
    timerRed: {
      color: "red",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style= {styles.orange}>
          Question {currentQuestion + 1}/{totalQuestions}
        </Text>
        {timeLeft !== null && (
          <Text
            style={[
              styles.timer,
              timeLeft <= 60 && styles.timerRed, // Apply the red color when time is less than or equal to 60 seconds
            ]}
          >
            Time Left: {Math.floor(timeLeft / 60)}:
            {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60} minutes
          </Text>
        )}
        <Text style={styles.questionText}>
          {practiceQuestions[currentQuestion]?.text}
        </Text>
        {/* <View style={styles.progressBarContainer}>
          <View style={styles.progressBar} />
        </View> */}
      </View>

      <ScrollView>
        <View style={styles.answersContainer}>
          {practiceAnswers
            .filter(
              (answer) =>
                answer.question === practiceQuestions[currentQuestion]?.id
            )
            .map((answer) => (
              <TouchableOpacity
                key={answer.id}
                style={[
                  styles.answerTouchable,
                  isAnswerSelected(practiceQuestions[currentQuestion].id, answer.id) &&
                    styles.selectedAnswer,
                ]}
                onPress={() =>
                  handleAnswerSelection(
                    answer.id,
                    practiceQuestions[currentQuestion].id
                  )
                }
              >
                <View
                  style={[
                    styles.checkBox,
                    isAnswerSelected(practiceQuestions[currentQuestion].id, answer.id) &&
                      styles.checkedBox,
                  ]}
                />
                <Text style={styles.answerText}>{answer.text}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          disabled={currentQuestion === 0}
          onPress={handlePreviousQuestion}
        >
          <Text
            style={[
              styles.buttonText,
              currentQuestion === 0 && styles.disabledButtonText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>
        {currentQuestion < totalQuestions - 1 ? (
          <TouchableOpacity onPress={handleNextQuestion}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
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
  );
};

export default Questions;
