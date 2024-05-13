// TopicInformation.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Topic {
  title: string;
  description: string;
  id: string;
}

interface TopicInformationProps {
  topic: Topic;
}

const TopicInformation: React.FC<TopicInformationProps> = ({ topic }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{topic.title}</Text>
      <Text style={styles.description}>{topic.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
  },
});

export default TopicInformation;
