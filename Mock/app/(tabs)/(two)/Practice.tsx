import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import PracticeInformation from "@/components/PracticeInformation";
import PracticeLevel from "@/components/PracticeLevel";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}
interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}
interface Level {
  title: string;
  image: ImageSourcePropType;
}
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

  return (
    <View style={styles.container}>
      <PracticeInformation topic={parsedTopic} />
      <PracticeLevel onPress={handleLevelPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Practice;
