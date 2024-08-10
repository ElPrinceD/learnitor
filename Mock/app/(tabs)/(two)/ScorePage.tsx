import React, { useState, useRef, useEffect } from "react";
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
import { markTopicAsComplete } from "../../../CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";

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

  const styles = StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(18),
    },
    topContainer: {
      flex: 1,
      padding: rMS(48),
      marginTop: -rMS(48),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rV(18),
      color: themeColors.text,
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
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: rV(18),
    },
    button: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: themeColors.border,
      paddingVertical: rV(13),
      paddingHorizontal: rS(27),
      borderRadius: 10,
      marginHorizontal: rS(10),
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    answersContainer: {
      flex: 1,
      marginTop: rV(20),
      width: "100%",
    },
    card: {
      marginBottom: rV(18),
      padding: rMS(13),
      backgroundColor: themeColors.card,
      borderRadius: 10,
      ...shadow.medium,
    },
    questionText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      marginBottom: rV(8),
      color: themeColors.text,
    },
    answersList: {
      marginLeft: rS(18),
    },
    answerText: {
      fontSize: SIZES.medium,
      marginBottom: rV(3),
      color: themeColors.text,
    },
    correctAnswer: {
      color: "#097969",
    },
    selectedAnswer: {
      fontWeight: "bold",
    },
    bullet: {
      marginRight: rS(11),
      marginLeft: rS(-18),
      color: themeColors.text,
      fontSize: SIZES.large,
      fontWeight: "bold",
    },
    resultText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      marginTop: rV(10),
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
  });

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
        <View style={{ alignItems: "center" }}>
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
            <GameButton style={styles.button} onPress={handleToggleAnswers}>
              <Text style={styles.buttonText}>
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </Text>
            </GameButton>

            <GameButton
              onPress={handleDone}
              title={"Done"}
              style={styles.button}
              disabled={markTopicAsCompletedMutation.isPending}
            >
              {markTopicAsCompletedMutation.isPending && (
                <ActivityIndicator size="small" color={themeColors.text} />
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
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default ScorePage;
