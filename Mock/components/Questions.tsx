import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const Questions = ({
  practiceQuestions,
  practiceAnswers,
  currentQuestion,
  selectedAnswers,
  questionsWithMultipleCorrectAnswers,
  isAnswerSelected,
  handleAnswerSelection,
}) => {
  return (
    <View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  questionText: {
    fontSize: 16,
    marginBottom: 5,
  },
  answersContainer: {
    marginTop: 5,
  },
  answerTouchable: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    padding: 10,
    borderRadius: 5,
  },
  selectedAnswer: {
    backgroundColor: "#ccc",
  },
  answerText: {
    fontSize: 14,
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
});

export default Questions;
