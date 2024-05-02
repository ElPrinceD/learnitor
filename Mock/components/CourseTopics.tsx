import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

interface Topic {
  title: string;
  description: string;
  id: string;
}

const CourseTopics: React.FC<{ topics: Topic[] }> = ({ topics }) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    topicsContainer: {
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    topicContainer: {
      marginBottom: 20,
      padding: 10,
      backgroundColor: "transparent",
      borderRadius: 5,
    },
    topicTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 5,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    topicDescription: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#ccc" : "#666",
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.topicsContainer}>
      {topics.map((topic, index) => (
        <View key={index} style={styles.topicContainer}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicDescription}>{topic.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default CourseTopics;
