import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}

interface TopicProps {
  topic: Topic[];
}

const Topic: React.FC<TopicProps> = () => {
  const { topic } = useLocalSearchParams();
  console.log("That topic:", topic);

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  return <View>{<Text>{parsedTopic.title}</Text>}</View>;
};

export default Topic;
