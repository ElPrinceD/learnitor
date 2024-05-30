import { View, Text, StyleSheet, useColorScheme } from "react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import PracticeLevel from "../../components/PracticeLevel";
import { Level } from "../../components/types";
import Colors from "../../constants/Colors";

const GameLevel: React.FC = () => {
  const { topics, topic, course } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleLevelPress = (level: Level) => {
    router.navigate("GameWaiting");
    router.setParams({
      level: level.title,
      topics: topics?.toString(),
      topic: topic?.toString(),
      course: course?.toString(),
      isCreator: "true", // Convert boolean to string
    });
    console.log("Level pressed:", level);
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
      padding: 10,
      marginTop: 50,
    },
    header: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: 40,
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
