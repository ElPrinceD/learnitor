import { View, Text, StyleSheet, useColorScheme } from "react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import PracticeLevel from "../../components/PracticeLevel";
import { Level } from "../../components/types";
import { useAuth } from "../../components/AuthContext";

import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rV } from "../../constants";
import Colors from "../../constants/Colors";

const GameLevel: React.FC = () => {
  const { topics, topic, course } = useLocalSearchParams();
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleLevelPress = async (level: Level) => {
    try {
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
        console.log(parsedTopic.id);
      }

      // Create a new game by making a POST request to the backend
      const response = await axios.post(
        `${ApiUrl}:8000/games/`,
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

      console.log("Game code:", gameCode);
    } catch (error) {
      console.error("Error creating game:", error);
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
    </View>
  );
};

export default GameLevel;
