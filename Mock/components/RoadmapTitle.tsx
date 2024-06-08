import React from "react";
import { View, Text, StyleSheet, useColorScheme, Image } from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";

import ProgressBar from "./ProgressBar";

const RoadmapTitle = ({ course, progress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(18),
      paddingHorizontal: rS(10),
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
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rV(10),
      textAlign: "left",
      color: themeColors.text,
    },
    subtext: {
      fontSize: SIZES.medium,
      textAlign: "left",
      width: rS(270),
      color: themeColors.textSecondary,
    },
    image: {
      width: rV(70),
      height: rS(70),
    },
    progressContainer: {
      marginTop: rV(18),
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
