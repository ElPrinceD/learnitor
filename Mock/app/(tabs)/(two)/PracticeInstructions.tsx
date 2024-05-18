import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";

const PracticeInstructions = () => {
  const colorScheme = useColorScheme();
  const { topic, level, course } = useLocalSearchParams();

  const [isTimed, setIsTimed] = useState(false);
  const [duration, setDuration] = useState(0.3); // Default to 10 minutes

  const handleStartQuiz = () => {
    router.navigate({
      pathname: "PracticeQuestions",
      params: {
        level: level?.toString(), // Ensure level is treated as a string
        topic: topic?.toString(),
        isTimed: isTimed.toString(), // Convert boolean to string
        duration: duration.toString(), // Convert number to string
        course: course?.toString(),
      },
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
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      justifyContent: "space-between",
    },
    timerText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFF" : "#000",
      marginRight: 10,
    },
    pickerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      justifyContent: "space-between",
    },
    picker: {
      height: 50,
      width: 150,
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
            1. This quiz consists of 30 questions.
          </Text>
          <Text style={styles.instruction}>
            2. Each question has multiple-choice options.
          </Text>
          <Text style={styles.instruction}>
            3. Select the correct answer(s) for each question.
          </Text>
          <Text style={styles.instruction}>
            4.Quiz progress will be displayed at the top.
          </Text>
          <Text style={styles.instruction}>
            5. Score will be displayed at the end.
          </Text>
          <Text style={styles.instruction}>
            6. You have the option to set a time limit for completing the quiz.
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Timed Quiz:</Text>
          <Switch value={isTimed} onValueChange={setIsTimed} />
        </View>
        {isTimed && (
          <View style={styles.pickerContainer}>
            <Text style={styles.timerText}>Select Duration:</Text>
            <Picker
              selectedValue={duration}
              style={styles.picker}
              onValueChange={(itemValue) => setDuration(itemValue)}
            >
              <Picker.Item label="10 minutes" value={10} />
              <Picker.Item label="15 minutes" value={15} />
              <Picker.Item label="30 minutes" value={30} />
              <Picker.Item label="45 minutes" value={45} />
            </Picker>
          </View>
        )}
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
