import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const PracticeInstructions = () => {
  const colorScheme = useColorScheme();
  const { topic, level } = useLocalSearchParams();

  const handleStartQuiz = () => {
    router.navigate("PracticeQuestions");
    router.setParams({
      level: level?.toString(), // Ensure level is treated as a string
      topic: topic?.toString(),
    });
  };

  // Determine styles based on color scheme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: colorScheme === "dark" ? "#181818" : "#fff",
      borderRadius: 20,
      padding: 20,
      width: "80%", // Adjust the width as needed
      elevation: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: colorScheme === "dark" ? "#FFF" : "#000",
    },
    instructions: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
      color: colorScheme === "dark" ? "#FFF" : "#000",
    },
    instructionContainer: {
      marginBottom: 20,
    },
    instruction: {
      fontSize: 16,
      marginBottom: 10,
      color: colorScheme === "dark" ? "#FFF" : "#000",
    },
    startButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#FFF" : "#000",
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 40,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      width: 300,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#FFF" : "#000",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Instructions</Text>
        <Text style={styles.instructions}>
          Please read the following instructions carefully before starting the
          quiz:
        </Text>
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            1. This quiz consists of 10 questions.
          </Text>
          <Text style={styles.instruction}>
            2. Each question has multiple-choice options.
          </Text>
          <Text style={styles.instruction}>
            3. Select the correct answer for each question.
          </Text>
          <Text style={styles.instruction}>
            4. You have a limited time to complete the quiz.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartQuiz} // Call handleStartQuiz function onPress
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PracticeInstructions;
