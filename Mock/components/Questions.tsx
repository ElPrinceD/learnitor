import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

type QuestionProps = {
  practiceQuestions: any[];
  practiceAnswers: any[];
  currentQuestion: number;
  questionsWithMultipleCorrectAnswers: number[];
  isAnswerSelected: (questionId: number, answerId: number) => boolean;
  handleAnswerSelection: (answerId: number, questionId: number) => void;
  styles?: {
    container?: object;
    questionContainer?: object;
    answersContainer?: object;
    questionText?: object;
    answerTouchable?: object;
    circleContainer?: object;
    circle?: object;
    selectedCircle?: object;
    innerCircle?: object;
    selectedAnswer?: object;
    correctAnswer?: object;
    wrongAnswer?: object;
    answerText?: object;
    selectedAnswerText?: object;
    checkBox?: object;
    checkedBox?: object;
  };
};

const Questions: React.FC<QuestionProps> = ({
  practiceQuestions,
  practiceAnswers,
  currentQuestion,
  questionsWithMultipleCorrectAnswers,
  isAnswerSelected,
  handleAnswerSelection,
  styles: externalStyles = {},
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(20),
      ...externalStyles.container, // Apply external styles if provided
    },
    questionContainer: {
      flex: 1,
      justifyContent: "center",
      paddingBottom: rV(18),
      ...externalStyles.questionContainer,
    },
    answersContainer: {
      flex: 2,
      alignItems: "center",
      ...externalStyles.answersContainer,
    },
    questionText: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      ...externalStyles.questionText,
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
      ...externalStyles.answerTouchable,
    },
    circleContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: rS(8),
      ...externalStyles.circleContainer,
    },
    circle: {
      width: rS(18),
      height: rV(17),
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#4b4a4a",
      justifyContent: "center",
      alignItems: "center",
      ...externalStyles.circle,
    },
    selectedCircle: {
      backgroundColor: "#ffffff",
      ...externalStyles.selectedCircle,
    },
    innerCircle: {
      width: rS(8),
      height: rV(8),
      borderRadius: 5,
      backgroundColor: "#4b4a4a",
      ...externalStyles.innerCircle,
    },
    selectedAnswer: {
      ...externalStyles.selectedAnswer,
    },
    correctAnswer: {
      ...externalStyles.correctAnswer,
    },
    wrongAnswer: {
      ...externalStyles.wrongAnswer,
    },
    answerText: {
      fontSize: SIZES.medium,
      marginLeft: rS(8),
      color: themeColors.text,
      flexWrap: "wrap",
      maxWidth: "85%",
      ...externalStyles.answerText,
    },
    selectedAnswerText: {
      fontSize: SIZES.medium,
      marginLeft: rS(8),
      color: "#ccc",
      ...externalStyles.selectedAnswerText,
    },
    checkBox: {
      width: rS(18),
      height: rV(17),
      borderWidth: 2,
      borderColor: "#888",
      borderRadius: 3,
      marginRight: rS(8),
      ...externalStyles.checkBox,
    },
    checkedBox: {
      backgroundColor: "#000",
      borderColor: "#fff",
      ...externalStyles.checkedBox,
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
            .map((answer, ansIndex) => {
              const isSelected = isAnswerSelected(
                practiceQuestions[currentQuestion].id,
                answer.id
              );
              const isCorrect = answer.isRight;
             
              const answerStyle = isSelected
                ? isCorrect
                  ? [styles.answerTouchable, styles.correctAnswer]
                  : [styles.answerTouchable, styles.wrongAnswer]
                : styles.answerTouchable;

              return (
                <TouchableOpacity
                  key={ansIndex}
                  style={[answerStyle, isSelected && styles.selectedAnswer]}
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
                          isSelected && styles.selectedCircle,
                        ]}
                      >
                        {isSelected && <View style={styles.innerCircle} />}
                      </View>
                    </View>
                  )}
                  {questionsWithMultipleCorrectAnswers.includes(
                    practiceQuestions[currentQuestion].id
                  ) && (
                    <View
                      style={[styles.checkBox, isSelected && styles.checkedBox]}
                    />
                  )}
                  {answer && answer.text && (
                    <Text
                      style={[
                        styles.answerText,
                        isSelected && styles.selectedAnswerText,
                      ]}
                    >
                      {answer.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
      </View>
    </View>
  );
};

export default memo(Questions);
