import React from "react";
import { View, Text, StyleSheet, useColorScheme, Image } from "react-native";
import { Course } from "./types";

import ProgressBar from "./ProgressBar";

const RoadmapTitle = ({ course, progress }) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row", // Align items in a row
      justifyContent: "space-between", // Distribute space between elements
      alignItems: "center", // Center items vertically
      paddingVertical: 20,
      paddingHorizontal: 10, // Add horizontal padding
    },
    textContainer: {
      flex: 1,
      alignItems: "flex-start", // Align text items to the start (left)
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "left", // Align text to the left
    },
    subtext: {
      fontSize: 16,
      textAlign: "left",
      width: 300,
    },
    image: {
      width: 80,
      height: 80,
      marginLeft: 10, 
      marginTop: -20,
    },
    progressContainer: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      width: "100%", // Ensure the progress container takes full width
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
        { backgroundColor: colorScheme === "dark" ? "#fdecd2" : "#fdecd2" },
      ]}
    >
      <View style={styles.textContainer}>
        
        <Text style={[styles.title, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
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
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
        <Text style={styles.progressText}>{`${progress.toFixed(2)}% Completed`}</Text>
      </View>
      <Image
        source={{
          uri: course.url,
        }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => console.log("Image error:", error)}
      />
    </View>
    </View>
    </View>
  );
};

export default RoadmapTitle;
