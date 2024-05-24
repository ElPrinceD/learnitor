import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import ProgressBar from "./ProgressBar";

const RoadmapTitle = ({ course, progress }) => {
  const colorScheme = useColorScheme();

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
    progressContainer: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: "#ccc",
      borderRadius: 5,
      marginRight: 10,
      marginLeft: 10,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colorScheme === "dark" ? "#fff" : "#000",
      borderRadius: 5,
    },
    progressText: {
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
  });

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
        {course.title}
      </Text>

      <Text
        style={[
          styles.subtext,
          { color: colorScheme === "dark" ? "#ccc" : "#666" },
        ]}
      >
        {course.description}
      </Text>

      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
        <Text style={styles.progressText}>{`${progress.toFixed(
          2
        )}% Completed`}</Text>
      </View>
    </View>
  );
};

export default RoadmapTitle;
