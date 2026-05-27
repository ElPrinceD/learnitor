import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import { useColorScheme } from "../../../components/useColorScheme";
import { router, useLocalSearchParams } from "expo-router";
import Colors from "../../../constants/Colors";
import GameButton from "../../../components/GameButton";
import CustomPicker from "../../../components/CustomPicker";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";

const PracticeInstructions = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const { topic, level, course } = useLocalSearchParams();

  const [isTimed, setIsTimed] = useState(false);
  const [duration, setDuration] = useState("10");

  const durationOptions = ["10", "15", "30", "45"];

  const handleStartQuiz = () => {
    router.navigate({
      pathname: "/(tabs)/(two)/PracticeQuestions",
      params: {
        level: level?.toString(),
        topic: topic?.toString(),
        isTimed: isTimed.toString(),
        duration: duration,
        course: course?.toString(),
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.background,
      padding: rMS(16),
    },
    card: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(22),
      width: "90%",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.medium,
    },
    title: {
      fontSize: rMS(20),
      fontWeight: "900",
      marginBottom: rV(14),
      textAlign: "center",
      color: themeColors.text,
      letterSpacing: -0.3,
    },
    instructions: {
      fontSize: rMS(13),
      marginBottom: rV(16),
      textAlign: "center",
      color: themeColors.textSecondary,
      fontWeight: "600",
      lineHeight: rMS(19),
    },
    instructionContainer: {
      marginBottom: rV(14),
      backgroundColor: themeColors.tint + "08",
      borderRadius: rMS(16),
      padding: rMS(14),
    },
    instruction: {
      fontSize: rMS(12),
      marginBottom: rV(6),
      color: themeColors.text,
      fontWeight: "600",
      lineHeight: rMS(18),
    },
    startButton: {
      backgroundColor: themeColors.tint,
      paddingVertical: rV(14),
      borderRadius: rMS(24),
      alignSelf: "center",
      width: "100%",
      marginTop: rV(16),
    },
    startButtonText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: "#fff",
    },
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.tint + "08",
      borderRadius: rMS(16),
      padding: rMS(14),
    },
    timerText: {
      fontSize: rMS(13),
      color: themeColors.text,
      fontWeight: "700",
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
            4. Quiz progress will be displayed at the top.
          </Text>
          <Text style={styles.instruction}>
            5. Score will be displayed at the end.
          </Text>
          <Text style={styles.instruction}>
            6. You have the option to set a time limit.
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Timed Quiz</Text>
          <Switch
            value={isTimed}
            onValueChange={setIsTimed}
            trackColor={{
              false: themeColors.border,
              true: themeColors.tint + "80",
            }}
            thumbColor={isTimed ? themeColors.tint : themeColors.textSecondary}
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
          title="Start Quiz"
          onPress={handleStartQuiz}
          style={styles.startButton}
          textStyle={styles.startButtonText}
        />
      </View>
    </ScrollView>
  );
};

export default PracticeInstructions;
