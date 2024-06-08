import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

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
  const shadow = useShadows();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(20),
    },
    questionContainer: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: rV(18),
    },
    answersContainer: {
      flex: 2,
      alignItems: "center",
    },
    questionText: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
    },
    answerTouchable: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(22),
      width: "85%",
      padding: rMS(27),
      borderRadius: 5,
      backgroundColor: themeColors.card,
      ...shadow.small,
    },
    circleContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: rS(8),
    },
    circle: {
      width: rS(18),
      height: rV(17),
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
      width: rS(8),
      height: rV(8),
      borderRadius: 5,
      backgroundColor: "#4b4a4a",
    },
    selectedAnswer: {
      backgroundColor: themeColors.selectedItem,
    },
    answerText: {
      fontSize: SIZES.medium,
      marginLeft: rS(8),
      color: themeColors.text,
      flexWrap: "wrap",
      maxWidth: "85%",
    },
    selectedAnswerText: {
      fontSize: SIZES.medium,
      marginLeft: rS(8),
      color: "#ccc",
    },
    checkBox: {
      width: rS(18),
      height: rV(17),
      borderWidth: 2,
      borderColor: "#888",
      borderRadius: 3,
      marginRight: rS(8),
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
