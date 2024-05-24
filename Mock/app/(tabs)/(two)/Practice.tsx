import React from "react";
import { View, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import PracticeInformation from "../../../components/PracticeInformation";
import PracticeLevel from "../../../components/PracticeLevel";
import { Topic, Level } from "../../../components/types";

const Practice: React.FC = () => {
  const { topic, course } = useLocalSearchParams();

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  const handleLevelPress = (level: Level) => {
    router.navigate("PracticeInstructions");
    router.setParams({
      level: level.title,
      topic: JSON.stringify(parsedTopic),
      course: course?.toString(),
    });
    console.log("Level pressed:", level);
  };

  const levels: Level[] = [
    {
      title: "Beginner",
      image: require("../../../assets/images/Beginner.jpg"),
    },
    {
      title: "Intermediate",
      image: require("../../../assets/images/Intermediate.png"),
    },
    {
      title: "Advanced",
      image: require("../../../assets/images/Advanced.jpg"),
    },
    { title: "Master", image: require("../../../assets/images/Master.jpg") },
  ];
  return (
    <View style={styles.container}>
      <PracticeInformation topic={parsedTopic} />
      <PracticeLevel onPress={handleLevelPress} levels={levels} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Practice;
