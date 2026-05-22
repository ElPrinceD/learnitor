import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { submitPracticeSession } from "../../../services/UserStatsApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import { useAdManager } from "../../../components/ads/AdManager";

const AnimatedText = Animated.createAnimatedComponent(Text);

const ScorePage: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const {
    topic,
    course,
    score: scoreParam,
    results: resultsParam,
    level: levelParam,
  } = useLocalSearchParams();
  const { showAnswerViewingAd } = useAdManager();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [showAnswers, setShowAnswers] = useState(false);
  const [hasWatchedAd, setHasWatchedAd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const styles = StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(16),
    },
    topContainer: {
      flex: 1,
      width: "110%",
      padding: rMS(40),
      marginTop: -rMS(40),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: rMS(16),
      fontWeight: "800",
      marginBottom: rV(8),
      color: themeColors.textSecondary,
      letterSpacing: -0.2,
      textTransform: "uppercase",
    },
    scoreHeader: {
      fontSize: rMS(18),
      fontWeight: "900",
      color: themeColors.tint,
    },
    score: {
      fontSize: rMS(48),
      fontWeight: "900",
      color: themeColors.tint,
      letterSpacing: -1,
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: rV(20),
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: rS(2),
      gap: rS(10),
    },
    button: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: themeColors.border,
      paddingVertical: rV(12),
      paddingHorizontal: rS(8),
      borderRadius: rMS(24),
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      minHeight: rV(40),
    },
    doneButton: {
      backgroundColor: themeColors.tint,
      borderWidth: 0,
      paddingVertical: rV(12),
      paddingHorizontal: rS(8),
      borderRadius: rMS(24),
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      minHeight: rV(40),
    },
    buttonText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
    },
    doneButtonText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: "#fff",
    },
    answersContainer: {
      flex: 1,
      marginTop: rV(16),
      width: "100%",
    },
    card: {
      marginBottom: rV(12),
      padding: rMS(16),
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    questionText: {
      fontSize: rMS(14),
      fontWeight: "800",
      marginBottom: rV(8),
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    answersList: {
      marginLeft: rS(14),
    },
    answerText: {
      fontSize: rMS(12),
      marginBottom: rV(4),
      color: themeColors.text,
      fontWeight: "600",
      lineHeight: rMS(18),
    },
    correctAnswer: {
      color: "#097969",
    },
    selectedAnswer: {
      fontWeight: "800",
    },
    bullet: {
      marginRight: rS(8),
      marginLeft: -rS(14),
      color: themeColors.text,
      fontSize: rMS(14),
      fontWeight: "800",
    },
    resultText: {
      fontSize: rMS(12),
      fontWeight: "800",
      marginTop: rV(10),
    },
    correct: {
      color: "#097969",
    },
    incorrect: {
      color: "#D22B2B",
    },
    headerTitle: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    progressContainer: {
      alignItems: "center",
    },
  });

  const score = typeof scoreParam === "string" ? scoreParam : "0";
  const results: Result[] =
    typeof resultsParam === "string" ? JSON.parse(resultsParam) : [];
  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;
  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  const practiceLevel =
    typeof levelParam === "string" && levelParam.trim() !== ""
      ? levelParam
      : "Beginner";

  const practiceStats = useMemo(() => {
    const questionsCount = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    return { questionsCount, correctCount };
  }, [results]);

  const practiceSessionSubmitted = useRef(false);

  useEffect(() => {
    if (practiceSessionSubmitted.current) return;
    if (!userToken?.token || !parsedTopic?.id || !parsedCourse?.id) return;
    if (practiceStats.questionsCount < 1) return;

    practiceSessionSubmitted.current = true;

    const courseId = Number(parsedCourse.id);
    if (Number.isNaN(courseId)) return;

    submitPracticeSession(userToken.token, {
      topic_id: parsedTopic.id,
      course_id: courseId,
      level: practiceLevel,
      questions_count: practiceStats.questionsCount,
      correct_count: practiceStats.correctCount,
    }).catch(() => {
      // Stats are non-critical; allow retry on remount if needed
      practiceSessionSubmitted.current = false;
    });
  }, [
    userToken?.token,
    parsedTopic?.id,
    parsedCourse?.id,
    practiceLevel,
    practiceStats.questionsCount,
    practiceStats.correctCount,
  ]);

  const handleToggleAnswers = () => {
    if (!showAnswers) {
      // Show rewarded ad before revealing answers
      showAnswerViewingAd(() => {
        setShowAnswers(true);
        setHasWatchedAd(true);
      });
    }
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
    <View>
      <ScrollView
        contentContainerStyle={styles.container}
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
            {!showAnswers && (
              <GameButton style={styles.button} onPress={handleToggleAnswers}>
                <Text style={styles.buttonText}>View answers (watch ad)</Text>
              </GameButton>
            )}

            <GameButton
              onPress={handleDone}
              style={styles.doneButton}
              disabled={markTopicAsCompletedMutation.isPending}
            >
              <Text style={styles.doneButtonText}>Done</Text>
              {markTopicAsCompletedMutation.isPending && (
                <ActivityIndicator size="small" color="#fff" />
              )}
            </GameButton>
          </View>
        </View>
        {showAnswers && (
          <View style={styles.answersContainer}>
            {results.map((result, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.questionText}>{result.question}</Text>
                <View style={styles.answersList}>
                  {result.allAnswers.map((answer, i) => (
                    <View
                      key={i}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {answer.isSelected && (
                        <Text style={styles.bullet}>•</Text>
                      )}
                      <Text
                        style={[
                          styles.answerText,
                          answer.isCorrect && styles.correctAnswer,
                          answer.isSelected && styles.selectedAnswer,
                          answer.isSelected && {
                            textDecorationLine: "underline",
                            color: result.isCorrect
                              ? styles.correct.color
                              : styles.incorrect.color,
                          },
                        ]}
                      >
                        {answer.text}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={[
                    styles.resultText,
                    result.isCorrect ? styles.correct : styles.incorrect,
                  ]}
                >
                  {result.isCorrect ? "You're right!" : "Incorrect"}
                </Text>
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
