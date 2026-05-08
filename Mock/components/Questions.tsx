import React, { memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
} from "react-native";
import { Check, X, CheckCircle2, XCircle } from "lucide-react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

const ANSWER_LETTERS = ["A", "B", "C", "D", "E", "F"];

const AnimatedAnswerRow: React.FC<{
  answer: { id: number; text: string };
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  questionsWithMultipleCorrectAnswers: number[];
  questionId: number;
  handleAnswerSelection: (answerId: number, questionId: number) => void;
  styles: any;
  showImmediateFeedback: boolean;
  themeColors: any;
}> = ({
  answer,
  index,
  isSelected,
  isCorrect,
  questionsWithMultipleCorrectAnswers,
  questionId,
  handleAnswerSelection,
  styles: s,
  showImmediateFeedback,
  themeColors,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showImmediateFeedback && isSelected) {
      if (!isCorrect) {
        // Shake animation for wrong answer
        shakeAnim.setValue(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      } else {
        // Subtle scale pop for correct answer
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      }

      // Glow border pulse
      Animated.sequence([
        Animated.timing(borderGlowAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(borderGlowAnim, { toValue: 0.5, duration: 600, useNativeDriver: false }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      borderGlowAnim.setValue(0);
    }
  }, [showImmediateFeedback, isSelected, isCorrect]);

  const translateX = shakeAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, 8, -8, 8, 0],
  });

  const isMultiCorrect = questionsWithMultipleCorrectAnswers.includes(questionId);
  const showFeedback = showImmediateFeedback && isSelected;
  const feedbackColor = showFeedback
    ? isCorrect ? "#22C55E" : "#EF4444"
    : "transparent";

  // Interpolate border width for glow
  const borderWidth = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2.5],
  });

  // Determine the letter badge background
  const letterBg = showFeedback
    ? isCorrect ? "#22C55E" : "#EF4444"
    : isSelected
    ? themeColors.tint
    : themeColors.textSecondary + "20";

  const letterColor = showFeedback || isSelected ? "#fff" : themeColors.textSecondary;

  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateX: showFeedback && !isCorrect ? translateX : 0 },
            { scale: scaleAnim },
          ],
        },
        { marginBottom: rV(10) },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleAnswerSelection(answer.id, questionId)}
        style={[
          s.answerCard,
          isSelected && !showFeedback && s.answerCardSelected,
          showFeedback && isCorrect && s.answerCardCorrect,
          showFeedback && !isCorrect && s.answerCardWrong,
        ]}
      >
        {/* Letter badge / checkbox */}
        <Animated.View style={[
          isMultiCorrect ? s.checkBox : s.letterBadge,
          {
            backgroundColor: letterBg,
            borderColor: showFeedback ? feedbackColor : isSelected ? themeColors.tint : themeColors.border + "60",
          },
          showFeedback && { borderWidth },
        ]}>
          {isMultiCorrect ? (
            isSelected ? (
              showFeedback ? (
                isCorrect ? <Check size={14} color={letterColor} /> : <X size={14} color={letterColor} />
              ) : <Check size={14} color={letterColor} />
            ) : null
          ) : (
            showFeedback ? (
              isCorrect ? <Check size={16} color="#fff" /> : <X size={16} color="#fff" />
            ) : (
              <Text style={[s.letterText, { color: letterColor }]}>
                {ANSWER_LETTERS[index] || "·"}
              </Text>
            )
          )}
        </Animated.View>

        {/* Answer text */}
        {answer?.text && (
          <Text
            style={[
              s.answerText,
              isSelected && !showFeedback && { color: themeColors.text },
              showFeedback && isCorrect && { color: "#22C55E" },
              showFeedback && !isCorrect && { color: "#EF4444" },
            ]}
          >
            {answer.text}
          </Text>
        )}

        {/* Trailing icon for feedback */}
        {showFeedback && (
          isCorrect ? (
            <CheckCircle2
              size={22}
              color="#22C55E"
              style={{ marginLeft: "auto", paddingLeft: rS(8) }}
            />
          ) : (
            <XCircle
              size={22}
              color="#EF4444"
              style={{ marginLeft: "auto", paddingLeft: rS(8) }}
            />
          )
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
  styles?: any;
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
      ...externalStyles.container,
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
      lineHeight: SIZES.xLarge * 1.35,
      ...externalStyles.questionText,
    },

    // --- Premium answer card ---
    answerCard: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingVertical: rV(16),
      paddingHorizontal: rS(16),
      borderRadius: rMS(18),
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: themeColors.border + "50",
    },
    answerCardSelected: {
      borderColor: themeColors.tint + "80",
      backgroundColor: themeColors.tint + "08",
    },
    answerCardCorrect: {
      borderColor: "#22C55E60",
      backgroundColor: "#22C55E10",
    },
    answerCardWrong: {
      borderColor: "#EF444460",
      backgroundColor: "#EF444410",
    },

    // Letter badge (single-select)
    letterBadge: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(10),
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(12),
      borderWidth: 1.5,
    },
    letterText: {
      fontSize: rMS(14),
      fontWeight: "800",
    },

    // Checkbox (multi-select)
    checkBox: {
      width: rMS(28),
      height: rMS(28),
      borderRadius: rMS(8),
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(12),
    },

    answerText: {
      fontSize: rMS(15),
      color: themeColors.text,
      flexWrap: "wrap",
      flex: 1,
      textAlign: "left",
      fontWeight: "500",
      lineHeight: rMS(15) * 1.4,
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
                  index={ansIndex}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  questionsWithMultipleCorrectAnswers={
                    questionsWithMultipleCorrectAnswers
                  }
                  questionId={practiceQuestions[currentQuestion].id}
                  handleAnswerSelection={handleAnswerSelection}
                  showImmediateFeedback={showImmediateFeedback}
                  themeColors={themeColors}
                  styles={{
                    answerCard: styles.answerCard,
                    answerCardSelected: styles.answerCardSelected,
                    answerCardCorrect: styles.answerCardCorrect,
                    answerCardWrong: styles.answerCardWrong,
                    letterBadge: styles.letterBadge,
                    letterText: styles.letterText,
                    checkBox: styles.checkBox,
                    answerText: styles.answerText,
                  }}
                />
              );
            })}
      </View>
    </View>
  );
};

export default memo(Questions);
