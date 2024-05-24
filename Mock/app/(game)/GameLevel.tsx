import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import PracticeLevel from "../../components/PracticeLevel";
import { Level } from "../../components/types";

const GameLevel: React.FC = () => {
  const { topic, course } = useLocalSearchParams();

  const handleLevelPress = (level: Level) => {
    router.navigate("GameWaiting");
    router.setParams({
      level: level.title,
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
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Level</Text>
      <PracticeLevel onPress={handleLevelPress} levels={levels} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 10,
    textAlign: "center",
  },
});
export default GameLevel;
