import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Course, Topic, Result } from "../../../components/types";
import Colors from "../../../constants/Colors";
import GameButton from "../../../components/GameButton";
import { useNavigation } from "@react-navigation/native";

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
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [showAnswers, setShowAnswers] = useState(false);

  const styles = StyleSheet.create({
    container: {
      // flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    topContainer: {
      flex: 1,
      padding: 50,
      marginTop: -50,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: themeColors.text,
    },
    score: {
      fontSize: 40,
      fontWeight: "bold",
      color: themeColors.selectedText,
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: 20,
    },
    button: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: themeColors.border,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 10,
      marginHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    answersContainer: {
      flex: 1,
      marginTop: 20,
      width: "100%",
    },
    card: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: themeColors.card,
      borderRadius: 10,
      shadowColor: themeColors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    questionText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: themeColors.text,
    },
    answersList: {
      marginLeft: 20,
    },
    answerText: {
      fontSize: 16,
      marginBottom: 5,
      color: themeColors.text,
    },
    correctAnswer: {
      color: "#097969",
    },
    selectedAnswer: {
      fontWeight: "bold",
    },
    bullet: {
      marginRight: 13,
      marginLeft: -20,
      color: themeColors.text,
      fontSize: 20,
      fontWeight: "bold",
    },
    resultText: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 10,
    },
    correct: {
      color: "#097969",
    },
    incorrect: {
      color: "red",
    },
    headerTitle: {
      fontSize: 18,
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

  const handleDone = async () => {
    try {
      await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/topic/${parsedTopic.id}/mark-completed/`,
        {},
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      router.dismiss(2);
    } catch (error) {
      console.error("Error marking topic as completed:", error);
    }
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
                top: 15,
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
            <AnimatedText style={styles.score}>{score}%</AnimatedText>
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
    <ScrollView
      contentContainerStyle={styles.container}
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

          <TouchableOpacity onPress={handleDone} style={styles.button}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
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
                    {answer.isSelected && <Text style={styles.bullet}>•</Text>}
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
  );
};

export default ScorePage;
