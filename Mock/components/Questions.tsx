import React, { memo, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
} from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

const CORRECT_MESSAGES = ["Nice!", "Got it!", "Correct!", "Yes!", "Boom!"];
const WRONG_MESSAGES = ["Wrong", "Not quite", "Almost!", "Nope", "Not this time"];

const AnimatedAnswerRow: React.FC<{
  answer: { id: number; text: string };
  isSelected: boolean;
  isCorrect: boolean;
  questionsWithMultipleCorrectAnswers: number[];
  questionId: number;
  handleAnswerSelection: (answerId: number, questionId: number) => void;
  styles: any;
  showImmediateFeedback: boolean;
}> = ({
  answer,
  isSelected,
  isCorrect,
  questionsWithMultipleCorrectAnswers,
  questionId,
  handleAnswerSelection,
  styles: s,
  showImmediateFeedback,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showImmediateFeedback && isSelected && !isCorrect) {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [showImmediateFeedback, isSelected, isCorrect]);

  const translateX = shakeAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, 8, -8, 8, 0],
  });

  const answerStyle =
    showImmediateFeedback && isSelected
      ? isCorrect
        ? [s.answerTouchable, s.correctAnswer]
        : [s.answerTouchable, s.wrongAnswer]
      : s.answerTouchable;

  const feedbackMsg = useMemo(() => {
    if (!showImmediateFeedback || !isSelected) return null;
    return isCorrect
      ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
      : WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
  }, [showImmediateFeedback, isSelected, isCorrect]);

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              translateX:
                showImmediateFeedback && isSelected && !isCorrect
                  ? translateX
                  : 0,
            },
          ],
        },
        { marginBottom: rV(10) },
      ]}
    >
      <TouchableOpacity
        style={[answerStyle, isSelected && s.selectedAnswer]}
        onPress={() => handleAnswerSelection(answer.id, questionId)}
      >
        {!questionsWithMultipleCorrectAnswers.includes(questionId) && (
          <View style={s.circleContainer}>
            <View style={[s.circle, isSelected && s.selectedCircle]}>
              {isSelected && <View style={s.innerCircle} />}
            </View>
          </View>
        )}
        {questionsWithMultipleCorrectAnswers.includes(questionId) && (
          <View style={[s.checkBox, isSelected && s.checkedBox]} />
        )}
        {answer?.text && (
          <Text
            style={[s.answerText, isSelected && s.selectedAnswerText]}
          >
            {answer.text}
          </Text>
        )}
        {feedbackMsg && (
          <Text
            style={[
              s.feedbackText,
              isCorrect ? s.feedbackCorrect : s.feedbackWrong,
            ]}
          >
            {feedbackMsg}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

type QuestionProps = {
  practiceQuestions: any[];
  practiceAnswers: any[];
  currentQuestion: number;
  questionsWithMultipleCorrectAnswers: number[];
  isAnswerSelected: (questionId: number, answerId: number) => boolean;
  handleAnswerSelection: (answerId: number, questionId: number) => void;
  showImmediateFeedback?: boolean;
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
  showImmediateFeedback = true,
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
      alignItems: "stretch",
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
      alignItems: "flex-start",
      marginBottom: rV(10),
      width: "100%",
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
      flex: 1,
      textAlign: "left",
      ...externalStyles.answerText,
    },
    selectedAnswerText: {
      fontSize: SIZES.medium,
      marginLeft: rS(8),
      color: "#ccc",
      flex: 1,
      textAlign: "left",
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
    feedbackText: {
      fontSize: rMS(12),
      fontWeight: "600",
      marginTop: rV(4),
      marginLeft: rS(8),
    },
    feedbackCorrect: {
      color: "#097969",
    },
    feedbackWrong: {
      color: "#D22B2B",
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
              return (
                <AnimatedAnswerRow
                  key={ansIndex}
                  answer={answer}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  questionsWithMultipleCorrectAnswers={
                    questionsWithMultipleCorrectAnswers
                  }
                  questionId={practiceQuestions[currentQuestion].id}
                  handleAnswerSelection={handleAnswerSelection}
                  showImmediateFeedback={showImmediateFeedback}
                  styles={{
                    answerTouchable: styles.answerTouchable,
                    correctAnswer: styles.correctAnswer,
                    wrongAnswer: styles.wrongAnswer,
                    selectedAnswer: styles.selectedAnswer,
                    circleContainer: styles.circleContainer,
                    circle: styles.circle,
                    selectedCircle: styles.selectedCircle,
                    innerCircle: styles.innerCircle,
                    checkBox: styles.checkBox,
                    checkedBox: styles.checkedBox,
                    answerText: styles.answerText,
                    selectedAnswerText: styles.selectedAnswerText,
                    feedbackText: styles.feedbackText,
                    feedbackCorrect: styles.feedbackCorrect,
                    feedbackWrong: styles.feedbackWrong,
                  }}
                />
              );
            })}
      </View>
    </View>
  );
};

export default memo(Questions);
