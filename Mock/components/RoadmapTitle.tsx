import React from "react";
import { View, Text, StyleSheet, useColorScheme, Image } from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import ProgressBar from "./ProgressBar";
import { Course } from "./types";

interface RoadmapTitleProps {
  course: Course;
  progress: number;
}

const RoadmapTitle: React.FC<RoadmapTitleProps> = ({ course, progress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: rS(16),
      marginTop: rV(12),
      marginBottom: rV(8),
      borderRadius: rMS(24),
      overflow: "hidden",
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      ...shadow.medium,
    },
    inner: {
      backgroundColor: themeColors.tint + "08",
      padding: rMS(18),
      position: "relative",
    },
    // Accent circles (matching Home/Play hero)
    accentStripe: {
      position: "absolute",
      top: -rV(10),
      right: -rS(30),
      width: rS(120),
      height: rS(120),
      borderRadius: rS(60),
      backgroundColor: themeColors.tint + "0C",
      transform: [{ scaleX: 1.5 }],
    },
    accentCircle: {
      position: "absolute",
      bottom: -rV(15),
      left: -rS(15),
      width: rS(60),
      height: rS(60),
      borderRadius: rS(30),
      backgroundColor: themeColors.tint + "10",
    },
    courseInfo: {
      flexDirection: "row",
      zIndex: 1,
    },
    textContainer: {
      flex: 1,
      alignItems: "flex-start",
      marginRight: rS(12),
    },
    title: {
      fontSize: rMS(20),
      fontWeight: "900",
      marginBottom: rV(6),
      textAlign: "left",
      color: themeColors.text,
      letterSpacing: -0.3,
      lineHeight: rMS(24),
    },
    subtext: {
      fontSize: rMS(12),
      textAlign: "left",
      color: themeColors.textSecondary,
      fontWeight: "600",
      lineHeight: rMS(17),
    },
    image: {
      width: rS(70),
      height: rV(70),
      borderRadius: rMS(16),
    },
    progressContainer: {
      marginTop: rV(14),
      zIndex: 1,
    },
    progressRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rV(6),
    },
    progressLabel: {
      fontSize: rMS(10),
      fontWeight: "700",
      color: themeColors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    progressText: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.tint,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Background art */}
        <View style={styles.accentStripe} />
        <View style={styles.accentCircle} />

        <View style={styles.courseInfo}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {course.title}
            </Text>
            <Text style={styles.subtext} numberOfLines={3}>
              {course.description}
            </Text>
          </View>
          <Image
            source={{ uri: course.url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {}}
          />
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressText}>{`${(progress || 0).toFixed(
              1
            )}%`}</Text>
          </View>
          <ProgressBar progress={progress} />
        </View>
      </View>
    </View>
  );
};

export default RoadmapTitle;
