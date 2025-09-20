import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import MathJax from "react-native-katex";
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

  // Memoized helper functions for LaTeX rendering
  const isFormula = useCallback((text: string): boolean => {
    const formulaRegex = /(\$\$.*?\$\$|\\\(.+?\\\)|\\\[.+?\\\]|\$.*?\$)/g;
    return formulaRegex.test(text);
  }, []);

  const splitTextWithFormulas = useCallback(
    (text: string): Array<{ text: string; isFormula: boolean }> => {
      const formulaRegex =
        /(\$\$(.*?)\$\$|\\\((.*?)\\\)|\\\[(.*?)\\\]|\$(.*?)\$)/g;
      const parts: Array<{ text: string; isFormula: boolean }> = [];
      let lastIndex = 0;

      let match;
      while ((match = formulaRegex.exec(text)) !== null) {
        const [fullMatch, , p2, p3, p4, p5] = match;
        const index = match.index;

        // Add plain text before the formula
        if (index > lastIndex) {
          parts.push({ text: text.slice(lastIndex, index), isFormula: false });
        }

        // Add the formula content without the delimiters
        const formulaContent = p2 || p3 || p4 || p5;
        parts.push({ text: formulaContent, isFormula: true });

        lastIndex = index + fullMatch.length;
      }

      // Add remaining plain text after the last formula
      if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), isFormula: false });
      }

      // If no parts were found, return the original text as a single part
      if (parts.length === 0) {
        parts.push({ text, isFormula: false });
      }

      return parts;
    },
    []
  );

  // Memoized component to render text with formulas
  const TextWithFormulas = memo(
    ({ text, style }: { text: string; style?: any }) => {
      const parts = useMemo(
        () => splitTextWithFormulas(text),
        [text, splitTextWithFormulas]
      );
      const flat = useMemo(() => StyleSheet.flatten(style) || {}, [style]);

      // Memoize derived values
      const {
        fontSize,
        color,
        fontWeight,
        textAlign,
        fontFamilyCSS,
        latexFontSize,
      } = useMemo(() => {
        const fontSize =
          typeof flat.fontSize === "number"
            ? flat.fontSize
            : flat.fontSize
            ? parseInt(flat.fontSize as any, 10)
            : SIZES.medium;
        const color = flat.color || (themeColors && themeColors.text) || "#000";
        const fontWeight = flat.fontWeight || "normal";
        const textAlign = flat.textAlign || "left";
        const fontFamilyCSS = flat.fontFamily
          ? `font-family: ${flat.fontFamily};`
          : `font-family: -apple-system, Roboto, "Segoe UI", "Helvetica Neue", Arial;`;

        // Determine if this is a question (larger font) or answer (smaller font)
        const isQuestion = fontSize >= SIZES.large; // Questions use SIZES.xLarge, answers use SIZES.medium
        const latexFontSize = isQuestion ? fontSize * 0.8 : fontSize * 1.2; // Different factors for questions vs answers

        return {
          fontSize,
          color,
          fontWeight,
          textAlign,
          fontFamilyCSS,
          latexFontSize,
        };
      }, [flat, themeColors]);

      const inlineCss = useMemo(
        () => `
    /* make the whole HTML background transparent */
    html, body { 
      background-color: transparent !important; 
      margin:0; 
      padding:0; 
      text-align: ${textAlign};
      width: 100%;
      overflow: visible;
    }
    /* primary KaTeX wrapper */
    .katex {
      display: inline-block;
      ${fontFamilyCSS}
      font-size: ${latexFontSize * 3.5}px !important;
      color: ${color} !important;
      background-color: transparent !important;
      line-height: normal !important;
      font-weight: ${fontWeight} !important;
      width: auto !important;
      max-width: none !important;
      overflow: visible !important;
    }
    /* ensure nested elements don't paint white */
    .katex * {
      background-color: transparent !important;
      color: ${color} !important;
    }
    /* KaTeX display mode for full width */
    .katex-display {
      display: block !important;
      width: 100% !important;
      text-align: center !important;
    }
  `,
        [textAlign, fontFamilyCSS, latexFontSize, color, fontWeight]
      );

      return (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {parts.map((part, index) =>
            part.isFormula ? (
              <View
                key={`katex-${index}`}
                style={{
                  flexShrink: 0,
                  maxWidth: "100%",
                  zIndex: 9999,
                  elevation: 9999,
                }}
              >
                <MathJax
                  expression={part.text}
                  inlineStyle={inlineCss}
                  style={{
                    backgroundColor: "transparent",
                    minWidth: "100%",
                    zIndex: 9999,
                    elevation: 9999,
                  }}
                />
              </View>
            ) : (
              <Text key={`txt-${index}`} style={style}>
                {part.text}
              </Text>
            )
          )}
        </View>
      );
    }
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: rMS(20),
          ...externalStyles.container, // Apply external styles if provided
        },
        questionContainer: {
          flex: 1,
          justifyContent: "center",
          paddingBottom: rV(18),
          paddingHorizontal: rS(10),
          ...externalStyles.questionContainer,
        },
        answersContainer: {
          flex: 2,
          marginTop: rV(30),
          alignItems: "center",
          ...externalStyles.answersContainer,
        },
        questionText: {
          fontSize: SIZES.xLarge,
          color: themeColors.text,
          fontWeight: "bold",
          textAlign: "center",
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
      }),
    [themeColors, shadow, externalStyles]
  );

  // Memoize filtered answers to prevent unnecessary re-filtering
  const currentQuestionAnswers = useMemo(() => {
    if (!practiceQuestions[currentQuestion]) return [];
    return practiceAnswers.filter(
      (answer) => answer.question === practiceQuestions[currentQuestion].id
    );
  }, [practiceAnswers, practiceQuestions, currentQuestion]);

  // Memoize answer selection callback
  const handleAnswerPress = useCallback(
    (answerId: number, questionId: number) => {
      handleAnswerSelection(answerId, questionId);
    },
    [handleAnswerSelection]
  );

  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        {practiceQuestions[currentQuestion] && (
          <View key={currentQuestion}>
            {practiceQuestions[currentQuestion].text &&
              (isFormula(practiceQuestions[currentQuestion].text) ? (
                <TextWithFormulas
                  text={practiceQuestions[currentQuestion].text}
                  style={styles.questionText}
                />
              ) : (
                <Text style={styles.questionText}>
                  {practiceQuestions[currentQuestion].text}
                </Text>
              ))}
          </View>
        )}
      </View>
      <View style={styles.answersContainer}>
        {currentQuestionAnswers.map((answer, ansIndex) => {
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
                handleAnswerPress(
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
                    style={[styles.circle, isSelected && styles.selectedCircle]}
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
              {answer &&
                answer.text &&
                (isFormula(answer.text) ? (
                  <TextWithFormulas
                    text={answer.text}
                    style={[
                      styles.answerText,
                      isSelected && styles.selectedAnswerText,
                    ]}
                  />
                ) : (
                  <Text
                    style={[
                      styles.answerText,
                      isSelected && styles.selectedAnswerText,
                    ]}
                  >
                    {answer.text}
                  </Text>
                ))}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default memo(Questions);
