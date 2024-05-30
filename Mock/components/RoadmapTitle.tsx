import React from "react";
import { View, Text, StyleSheet, useColorScheme, Image } from "react-native";
import { Course } from "./types";
import Colors from "../constants/Colors";

import ProgressBar from "./ProgressBar";

const RoadmapTitle = ({ course, progress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 10,
      backgroundColor: themeColors.background,
    },
    courseInfo: {
      flexDirection: "row",
    },
    textContainer: {
      flex: 1,
      alignItems: "flex-start",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "left",
      color: themeColors.text,
    },
    subtext: {
      fontSize: 16,
      textAlign: "left",
      width: 300,
      color: themeColors.textSecondary,
    },
    image: {
      width: 80,
      height: 80,
      // marginLeft: 10,
      // marginTop: -20,
    },
    progressContainer: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    progressText: {
      color: themeColors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.courseInfo}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.subtext}>{course.description}</Text>
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
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          containerStyle={{
            backgroundColor: themeColors.text,
            height: 10,
          }}
          fillStyle={{ backgroundColor: themeColors.icon }}
        />
        <Text style={styles.progressText}>{`${progress.toFixed(
          2
        )}% Completed`}</Text>
      </View>
    </View>
  );
};

export default RoadmapTitle;
