import { View, Text, StyleSheet, useColorScheme } from "react-native";
import React, { useState, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import PracticeLevel from "../../components/PracticeLevel";
import { Level } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ErrorMessage from "../../components/ErrorMessage";

import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rV } from "../../constants";
import Colors from "../../constants/Colors";

const GameLevel: React.FC = () => {
  const { topics, topic, course } = useLocalSearchParams();
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const handleLevelPress = async (level: Level) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);

      let parsedTopics: number[] = [];

      // Parse topics if it is a string
      if (typeof topics === "string") {
        parsedTopics = JSON.parse(topics).map((t: any) => t.id);
      } else if (Array.isArray(topics)) {
        parsedTopics = topics.map((t: any) => t.id);
      }

      // Ensure the topic is a string and parse it, then add to parsedTopics
      if (typeof topic === "string") {
        const parsedTopic = JSON.parse(topic);
        parsedTopics.push(parsedTopic.id);
      }

      // Validate that we have topics to create a game with
      if (parsedTopics.length === 0) {
        setErrorMessage("Please select at least one topic to create a game.");
        return;
      }

      // Create a new game by making a POST request to the backend
      const response = await axios.post(
        `${ApiUrl}/games/`,
        {
          level: level.title,
          topics: parsedTopics,
        },
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      // Extract the game code from the response
      const gameCode = response.data.code;
      const gameId = response.data.id;

      // Navigate to the GameWaiting screen with the necessary parameters
      router.navigate({
        pathname: "GameWaiting",
        params: {
          level: level.title,
          topics: JSON.stringify(parsedTopics),
          course: course?.toString(),
          isCreator: "true", // Convert boolean to string
          code: gameCode,
          gameId: gameId,
        },
      });
    } catch (error) {
      // Let ErrorMessage component handle the user-friendly conversion
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "An unexpected error occurred while creating the game."
        );
      }
    }
  };

  const levels: Level[] = [
    {
      title: "Beginner",
      image: require("../../assets/images/Beginner.jpg"),
    },
    {
      title: "Intermediate",
      image: require("../../assets/images/Intermediate.png"),
    },
    {
      title: "Advanced",
      image: require("../../assets/images/Advanced.jpg"),
    },
    { title: "Master", image: require("../../assets/images/Master.jpg") },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(10),
      marginTop: rV(50),
    },
    header: {
      color: themeColors.text,
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginTop: rV(8),
      marginBottom: rV(10),
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Level</Text>
      <PracticeLevel onPress={handleLevelPress} levels={levels} />
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default GameLevel;
