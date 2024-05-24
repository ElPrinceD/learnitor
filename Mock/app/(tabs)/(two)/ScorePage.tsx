import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Course, Topic, Result } from "../../../components/types";

const ScorePage: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { topic, course } = useLocalSearchParams();

  const colorScheme = useColorScheme();
  const [showAnswers, setShowAnswers] = useState(false);

  const styles = StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    score: {
      fontSize: 40,
      fontWeight: "bold",
      color: "#337ab7",
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: 20,
    },
    button: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#FFF" : "#000",
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 40,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      width: 180,
      marginHorizontal: 10,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#FFF" : "#000",
    },
    answersContainer: {
      marginTop: 20,
      width: "100%",
    },
    card: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: colorScheme === "dark" ? "#181818" : "#fff",
      borderRadius: 10,
      shadowColor: "#000",
      elevation: 1,
    },
    questionText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    answersList: {
      marginLeft: 20,
    },
    answerText: {
      fontSize: 16,
      marginBottom: 5,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    correctAnswer: {
      color: "green",
    },
    selectedAnswer: {
      fontWeight: "bold",
    },
    resultText: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 10,
    },
    correct: {
      color: "green",
    },
    incorrect: {
      color: "red",
    },
  });

  const params = useLocalSearchParams();
  const score = typeof params.score === "string" ? params.score : "0";
  const results: Result[] =
    typeof params.results === "string" ? JSON.parse(params.results) : [];

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  console.log("Parsed Topic:", parsedTopic.id);

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
    } catch (error) {
      console.error("Error marking topic as completed:", error);
    }
    router.dismiss(2);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Score</Text>
      <Text style={styles.score}>{score}%</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleToggleAnswers} style={styles.button}>
          <Text style={styles.buttonText}>
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDone} style={styles.button}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
      {showAnswers && (
        <View style={styles.answersContainer}>
          {results.map((result, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.questionText}>{result.question}</Text>
              <View style={styles.answersList}>
                {result.allAnswers.map((answer, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.answerText,
                      answer.isCorrect && styles.correctAnswer,
                      answer.isSelected && styles.selectedAnswer,
                    ]}
                  >
                    {answer.text}
                  </Text>
                ))}
              </View>
              <Text
                style={[
                  styles.resultText,
                  result.isCorrect ? styles.correct : styles.incorrect,
                ]}
              >
                {result.isCorrect ? "Correct!" : "Wrong!"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ScorePage;
