import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Switch,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Colors from "../../../constants/Colors";
import GameButton from "../../../components/GameButton";
import CustomPicker from "../../../components/CustomPicker";
import { SIZES, rMS, rS, rV } from "../../../constants";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";

const PracticeInstructions = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { topic, level, course } = useLocalSearchParams();

  const [isTimed, setIsTimed] = useState(false);
  const [duration, setDuration] = useState("10"); // Default to 10 minutes

  // Duration options for the picker
  const durationOptions = ["10", "15", "30", "45"];

  const handleStartQuiz = () => {
    router.navigate({
      pathname: "/(tabs)/(two)/PracticeQuestions",
      params: {
        level: level?.toString(), // Ensure level is treated as a string
        topic: topic?.toString(),
        isTimed: isTimed.toString(), // Convert boolean to string
        duration: duration, // duration is already a string
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
      backgroundColor: themeColors.card,
      borderRadius: 10,
      padding: rMS(18),
      width: "80%", // Adjust the width as needed
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rV(18),
      textAlign: "center",
      color: themeColors.text,
    },
    instructions: {
      fontSize: SIZES.large,
      marginBottom: rV(18),
      textAlign: "center",
      color: themeColors.text,
    },
    instructionContainer: {
      marginBottom: rV(18),
    },
    instruction: {
      fontSize: SIZES.medium,
      marginBottom: rV(8),
      color: themeColors.text,
    },
    startButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingVertical: rV(8),
      borderRadius: 10,
      alignSelf: "center",
      width: "90%",
      marginTop: rV(15),
    },
    startButtonText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    timerText: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      marginRight: rS(8),
    },
    durationContainer: {
      marginTop: rV(10),
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Instructions</Text>
        <Text style={styles.instructions}>
          Please read the following instructions carefully before starting the
          quiz:
        </Text>
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            1. This quiz consists of 20 questions.
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
          <Switch
            value={isTimed}
            onValueChange={setIsTimed}
            trackColor={{
              false: themeColors.text,
              true: themeColors.buttonBackground,
            }}
            thumbColor={themeColors.icon}
          />
        </View>
        {isTimed && (
          <Animated.View
            entering={FadeInLeft.delay(200)
              .randomDelay()
              .reduceMotion(ReduceMotion.Never)}
            style={styles.durationContainer}
          >
            <CustomPicker
              label="Select Duration:"
              options={durationOptions.map((option) => `${option} minutes`)}
              selectedValue={duration}
              onValueChange={(value) => setDuration(value.split(" ")[0])}
              placeholder="Choose duration"
            />
          </Animated.View>
        )}

        <GameButton
          title="Start"
          onPress={handleStartQuiz}
          style={styles.startButton}
          textStyle={styles.startButtonText}
        />
      </View>
    </ScrollView>
  );
};

export default PracticeInstructions;
