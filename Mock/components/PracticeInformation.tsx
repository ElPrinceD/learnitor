import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";

interface Topic {
  title: string;
  description: string;
  id: string;
}

interface PracticeInformationProps {
  topic: Topic;
}

const PracticeInformation: React.FC<PracticeInformationProps> = ({ topic }) => {
  const colorScheme = useColorScheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#000" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colorScheme === "dark" ? "#fff" : "#000" },
        ]}
      >
        {topic.title}{" "}
      </Text>
      <Text
        style={[
          styles.description,
          { color: colorScheme === "dark" ? "#ccc" : "#666" },
        ]}
      >
        {topic.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
  },
});

export default PracticeInformation;
