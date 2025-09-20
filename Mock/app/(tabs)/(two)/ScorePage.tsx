import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import { Course, Topic, Result } from "../../../components/types";
import Colors from "../../../constants/Colors";
import GameButton from "../../../components/GameButton";
import { useNavigation } from "@react-navigation/native";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import { useMutation } from "@tanstack/react-query";
import { markTopicAsComplete } from "../../../services/CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import MathJax from "react-native-katex";

const AnimatedText = Animated.createAnimatedComponent(Text);

const ScorePage: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const {
    topic,
    course,
    score: scoreParam,
    results: resultsParam,
  } = useLocalSearchParams();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [showAnswers, setShowAnswers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

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
          backgroundColor: themeColors.background,
        },
        scrollContainer: {
          paddingHorizontal: rS(16),
          paddingBottom: rV(20),
        },
        topContainer: {
          paddingVertical: rV(30),
          paddingHorizontal: rS(20),
          alignItems: "center",
          backgroundColor: themeColors.background,
        },
        title: {
          fontSize: SIZES.xLarge,
          fontWeight: "bold",
          marginBottom: rV(15),
          color: themeColors.text,
          textAlign: "center",
        },
        scoreHeader: {
          fontSize: SIZES.xLarge,
          fontWeight: "bold",
          color: themeColors.selectedText,
        },
        score: {
          fontSize: SIZES.xxxLarge,
          fontWeight: "bold",
          color: themeColors.selectedText,
          marginBottom: rV(20),
        },
        buttonContainer: {
          flexDirection: "row",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: rS(10),
        },
        button: {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: themeColors.border,
          paddingVertical: rV(12),
          paddingHorizontal: rS(24),
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          minWidth: rS(120),
        },
        buttonText: {
          fontSize: SIZES.medium,
          fontWeight: "bold",
          color: themeColors.text,
        },
        answersContainer: {
          paddingHorizontal: rS(16),
        },
        card: {
          marginBottom: rV(20),
          padding: rMS(16),
          backgroundColor: themeColors.card,
          borderRadius: 12,
          ...shadow.medium,
          width: "100%",
        },
        questionContainer: {
          marginBottom: rV(15),
          paddingHorizontal: rS(8),
        },
        questionText: {
          fontSize: SIZES.large,
          fontWeight: "bold",
          color: themeColors.text,
          lineHeight: SIZES.large * 1.4,
          textAlign: "left",
        },
        answersList: {
          marginLeft: rS(8),
        },
        answerItem: {
          marginBottom: rV(12),
          paddingVertical: rV(8),
          paddingHorizontal: rS(12),
          borderRadius: 8,
          backgroundColor: themeColors.background,
          minHeight: rV(60),
          justifyContent: "flex-start",
        },
        answerText: {
          fontSize: SIZES.medium,
          color: themeColors.text,
          lineHeight: SIZES.medium * 1.3,
        },
        correctAnswer: {
          color: "#097969",
        },
        selectedAnswer: {
          fontWeight: "bold",
        },
        bullet: {
          marginRight: rS(8),
          color: themeColors.text,
          fontSize: SIZES.large,
          fontWeight: "bold",
          lineHeight: SIZES.large * 1.3,
        },
        resultContainer: {
          marginTop: rV(12),
          paddingTop: rV(8),
          borderTopWidth: 1,
          borderTopColor: themeColors.text,
        },
        resultText: {
          fontSize: SIZES.medium,
          fontWeight: "bold",
          textAlign: "center",
        },
        correct: {
          color: "#097969",
        },
        incorrect: {
          color: "#D22B2B",
        },
        headerTitle: {
          fontSize: SIZES.large,
          fontWeight: "bold",
          color: themeColors.text,
        },
        progressContainer: {
          alignItems: "center",
        },
        formulaContainer: {
          width: "100%",
          minHeight: rV(40),
          justifyContent: "center",
          alignItems: "center",
        },
      }),
    [themeColors, shadow]
  );

  const score = typeof scoreParam === "string" ? scoreParam : "0";
  const results: Result[] =
    typeof resultsParam === "string" ? JSON.parse(resultsParam) : [];
  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;
  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  const handleToggleAnswers = () => {
    setShowAnswers((prevShowAnswers) => !prevShowAnswers);
  };

  const markTopicAsCompletedMutation = useMutation<any, any, any, any>({
    mutationFn: async ({ userId, courseId, topicId, token }) => {
      await markTopicAsComplete(userId, courseId, topicId, token);
    },
    onSuccess: () => {
      router.dismiss(2);
      setErrorMessage(null);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Error marking topic as completed");
    },
  });

  const handleDone = () => {
    markTopicAsCompletedMutation.mutate({
      userId: userInfo?.user?.id,
      courseId: parsedCourse?.id,
      topicId: parsedTopic.id,
      token: userToken?.token,
    });
  };

  // Animation for the header title and score
  const originalTitleOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const originalTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [100, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [100, 200],
    outputRange: [-20, 0],
    extrapolate: "clamp",
  });

  const scoreOpacity = scrollY.interpolate({
    inputRange: [100, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const scoreTranslateY = scrollY.interpolate({
    inputRange: [100, 200],
    outputRange: [-20, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: "center", paddingVertical: rV(10) }}>
          <AnimatedText
            style={[
              styles.headerTitle,
              {
                opacity: originalTitleOpacity,
                transform: [{ translateY: originalTitleTranslateY }],
                textAlign: "center",
                position: "absolute",
                top: rV(15),
                width: rS(300),
              },
            ]}
          >
            How'd you do?
          </AnimatedText>
          <AnimatedText
            style={[
              styles.headerTitle,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
                textAlign: "center",
              },
            ]}
          >
            Your Score
          </AnimatedText>
          <Animated.View
            style={[
              styles.progressContainer,
              {
                opacity: scoreOpacity,
                transform: [{ translateY: scoreTranslateY }],

                alignItems: "center",
              },
            ]}
          >
            <AnimatedText style={styles.scoreHeader}>{score}%</AnimatedText>
          </Animated.View>
        </View>
      ),
      headerShown: true,
      headerTitleStyle: {
        fontWeight: "bold",
      },
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: themeColors.background,
      },
      headerShadowVisible: false,
      headerTitleAlign: "center",
    });
  }, [
    navigation,
    originalTitleOpacity,
    originalTitleTranslateY,
    titleOpacity,
    titleTranslateY,
    scoreOpacity,
    scoreTranslateY,
  ]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.topContainer}>
          <Text style={styles.title}>Your Score</Text>
          <Text style={styles.score}>{score}%</Text>
          <View style={styles.buttonContainer}>
            <GameButton style={styles.button} onPress={handleToggleAnswers}>
              <Text style={styles.buttonText}>
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </Text>
            </GameButton>

            <GameButton
              onPress={handleDone}
              style={styles.button}
              disabled={markTopicAsCompletedMutation.isPending}
            >
              {markTopicAsCompletedMutation.isPending ? (
                <ActivityIndicator size="small" color={themeColors.text} />
              ) : (
                <Text style={styles.buttonText}>Done</Text>
              )}
            </GameButton>
          </View>
        </View>

        {showAnswers && (
          <View style={styles.answersContainer}>
            {results.map((result, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.questionContainer}>
                  {(() => {
                    const hasFormula = isFormula(result.question);
                    console.log(
                      "Question has formula:",
                      hasFormula,
                      result.question
                    );
                    return hasFormula ? (
                      <TextWithFormulas
                        text={result.question}
                        style={styles.questionText}
                      />
                    ) : (
                      <Text style={styles.questionText}>{result.question}</Text>
                    );
                  })()}
                </View>

                <View style={styles.answersList}>
                  {result.allAnswers.map((answer, i) => {
                    const answerStyle = [
                      styles.answerText,
                      answer.isCorrect && styles.correctAnswer,
                      answer.isSelected && styles.selectedAnswer,
                      answer.isSelected && {
                        textDecorationLine: "underline" as const,
                        color: result.isCorrect
                          ? styles.correct.color
                          : styles.incorrect.color,
                      },
                    ];

                    return (
                      <View key={i} style={styles.answerItem}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            width: "100%",
                            minHeight: rV(50),
                          }}
                        >
                          {answer.isSelected && (
                            <Text style={styles.bullet}>•</Text>
                          )}
                          <View
                            style={{
                              flex: 1,
                              width: "100%",
                              minHeight: rV(50),
                              justifyContent: "flex-start",
                            }}
                          >
                            {(() => {
                              const hasFormula = isFormula(answer.text);
                              console.log(
                                `Answer ${i} has formula:`,
                                hasFormula,
                                answer.text
                              );
                              return hasFormula ? (
                                <TextWithFormulas
                                  text={answer.text}
                                  style={StyleSheet.flatten(answerStyle)}
                                />
                              ) : (
                                <Text style={answerStyle}>{answer.text}</Text>
                              );
                            })()}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.resultContainer}>
                  <Text
                    style={[
                      styles.resultText,
                      result.isCorrect ? styles.correct : styles.incorrect,
                    ]}
                  >
                    {result.isCorrect ? "You're right!" : "Incorrect"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default ScorePage;
