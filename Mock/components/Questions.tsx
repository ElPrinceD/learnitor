import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);

  useEffect(() => {
    // Determine questions with multiple correct answers
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
        // If the question allows multiple correct answers
        const selected = updatedAnswers[questionId] || [];
        const index = selected.indexOf(answerId);
        if (index !== -1) {
          selected.splice(index, 1);
        } else {
          selected.push(answerId);
        }
        updatedAnswers[questionId] = selected;
      } else {
        // If the question allows only single selection
        if (updatedAnswers[questionId]?.[0] === answerId) {
          // Deselect if already selected
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
    // Calculate score
    let totalQuestions = practiceQuestions.length;
    let correctAnswers = 0;

    practiceQuestions.forEach((question) => {
      const selectedAnswerIds = selectedAnswers[question.id] || [];
      const correctAnswerIds = practiceAnswers
        .filter((answer) => answer.question === question.id && answer.isRight)
        .map((answer) => answer.id);

      if (
        selectedAnswerIds.length === correctAnswerIds.length &&
        selectedAnswerIds.every((id) => correctAnswerIds.includes(id))
      ) {
        correctAnswers++;
      }
    });

    // Calculate score percentage
    let scorePercentage = (correctAnswers / totalQuestions) * 100;

    // Navigate to Score Page
    router.navigate("ScorePage");
    router.setParams({
      score: scorePercentage.toFixed(2) + "%",
      practiceQuestions: JSON.stringify(practiceQuestions),
      practiceAnswers: JSON.stringify(practiceAnswers),
    });
  };

  const isAnswerSelected = (questionId: number, answerId: number) => {
    return (
      selectedAnswers[questionId] &&
      selectedAnswers[questionId].includes(answerId)
    );
  };

  // Check if all questions are answered
  const allQuestionsAnswered = practiceQuestions.every(
    (question) =>
      selectedAnswers[question.id] && selectedAnswers[question.id].length > 0
  );

  const isSubmitDisabled = !allQuestionsAnswered;

  return (
    <ScrollView>
      <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    marginTop: "50%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  answersContainer: {
    marginTop: 5,
  },
  answerTouchable: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  selectedAnswer: {
    backgroundColor: "#ccc",
  },
  answerText: {
    fontSize: 14,
    color: "#444",
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
    color: "#337ab7",
  },
  disabledButtonText: {
    color: "#ccc",
  },
});

export default Questions;
