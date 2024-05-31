import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";

const Questions = ({
  practiceQuestions,
  practiceAnswers,
  currentQuestion,
  questionsWithMultipleCorrectAnswers,
  isAnswerSelected,
  handleAnswerSelection,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    questionContainer: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: 20,
    },
    answersContainer: {
      flex: 1,
      paddingTop: 30,
      paddingBottom: 0,
      marginTop: -27,
      alignItems: "center",
    },
    questionText: {
      fontSize: 25,
      color: themeColors.text,
      paddingLeft: 30,
      marginBottom: 5,
      fontWeight: "bold",
    },
    answerTouchable: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 25,
      width: "85%",
      padding: 30,
      borderRadius: 5,
      backgroundColor: themeColors.card,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 5,
      paddingLeft: 40,
    },
    circleContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    circle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#4b4a4a",
      justifyContent: "center",
      alignItems: "center",
    },
    selectedCircle: {
      backgroundColor: "#ffffff",
    },
    innerCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#4b4a4a",
    },
    selectedAnswer: {
      backgroundColor: themeColors.selectedItem,
    },
    answerText: {
      fontSize: 14,
      marginLeft: 10,
      color: themeColors.text,
      flexWrap: "wrap",
      maxWidth: "85%",
    },
    selectedAnswerText: {
      fontSize: 14,
      marginLeft: 10,
      color: "#ccc",
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
      backgroundColor: "#000",
      borderColor: "#fff",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        {practiceQuestions[currentQuestion] && (
          <View key={currentQuestion}>
            {practiceQuestions[currentQuestion].text && (
              <Text style={styles.questionText}>
                {practiceQuestions[currentQuestion].text}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.answersContainer}>
        {practiceQuestions[currentQuestion] &&
          practiceAnswers
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
                {!questionsWithMultipleCorrectAnswers.includes(
                  practiceQuestions[currentQuestion].id
                ) && (
                  <View style={styles.circleContainer}>
                    <View
                      style={[
                        styles.circle,
                        isAnswerSelected(
                          practiceQuestions[currentQuestion].id,
                          answer.id
                        ) && styles.selectedCircle,
                      ]}
                    >
                      {isAnswerSelected(
                        practiceQuestions[currentQuestion].id,
                        answer.id
                      ) && <View style={styles.innerCircle} />}
                    </View>
                  </View>
                )}
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
                  <Text
                    style={[
                      styles.answerText,
                      isAnswerSelected(
                        practiceQuestions[currentQuestion].id,
                        answer.id
                      ) && styles.selectedAnswerText,
                    ]}
                  >
                    {answer.text}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
      </View>
    </View>
  );
};

export default Questions;
