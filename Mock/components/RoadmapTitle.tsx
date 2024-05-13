import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";

const RoadmapTitle = () => {
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
        ROADMAP
      </Text>
      <Text
        style={[
          styles.subtext,
          { color: colorScheme === "dark" ? "#ccc" : "#666" },
        ]}
      >
        Your road to success!
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
  subtext: {
    fontSize: 16,
  },
});

export default RoadmapTitle;
