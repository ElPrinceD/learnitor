// CourseRoadmap.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThreeDButton from "./ThreeDButton"; // Assuming ThreeDButton is in the same directory
import Colors from "../constants/Colors";
import { Course, Topic } from "./types";
import SvgComponent from "./SvgComponent"; // Importing the SvgComponent

import { SIZES, rMS, rS, rV, images } from "../constants";

interface CourseRoadmapProps {
  enrolledTopics: Topic[];
  course: Course;
  handleTopicPress: (topic: Topic) => void;
  handleQuestionPress: (topic: Topic) => void;
}

const CourseRoadmap: React.FC<CourseRoadmapProps> = ({
  enrolledTopics,
  handleTopicPress,
  handleQuestionPress,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      margin: rMS(18),
    },
    timelineItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(8),
    },
    timelineContentLeft: {
      flex: 1,
      alignItems: "flex-start",
      marginLeft: rS(11),
    },
    timelineContentCenter: {
      flex: 1,
      alignItems: "center",
    },
    timelineContentRight: {
      flex: 1,
      alignItems: "flex-end",
      marginRight: rS(13),
    },
    timelineText: {
      fontSize: rMS(12),
      color: themeColors.text,
      marginTop: rV(18),
      width: rS(120),
    },
    backgroundContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1, // Ensure the background is behind other elements
    },
    backgroundSVG: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      elevation: 0,
    },
  });

  const renderTimelineItem = (
    topic: Topic,
    index: number,
    isQuestion: boolean
  ) => {
    const cyclePosition = index % 10; // Determine the position in the cycle

    let contentStyle: {
      flex: number;
      alignItems: "flex-start" | "center" | "flex-end";
    } = styles.timelineContentLeft;
    if (
      cyclePosition === 0 ||
      cyclePosition === 2 ||
      cyclePosition === 4 ||
      cyclePosition === 6 ||
      cyclePosition === 8
    ) {
      contentStyle = styles.timelineContentCenter;
    } else if (cyclePosition === 3 || cyclePosition === 7) {
      contentStyle = styles.timelineContentRight;
    }

    const textAlign =
      contentStyle === styles.timelineContentLeft
        ? "left"
        : contentStyle === styles.timelineContentCenter
        ? "center"
        : "right";

    return (
      <View key={index} style={styles.timelineItem}>
        <View style={contentStyle}>
          <ThreeDButton
            title={
              isQuestion ? (
                <Ionicons
                  name="play-circle-outline"
                  size={SIZES.xxLarge}
                  color="black"
                />
              ) : (
                ""
              )
            }
            onPress={() =>
              isQuestion ? handleQuestionPress(topic) : handleTopicPress(topic)
            }
          />
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[
              styles.timelineText,
              {
                textAlign,
              },
            ]}
          >
            {isQuestion ? `Practice ${topic.title}` : topic.title}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {enrolledTopics.map((topic, index) => (
          <View key={index}>
            {renderTimelineItem(topic, index * 2, false)}
            <View style={[styles.backgroundContainer]}>
              <SvgComponent
                paths={[
                  "M128.743 42.3268C150 50 200 120 250 150",
                  "M250 150C300 200 350 150 400 200",
                  "M400 200C450 250 500 200 550 250",

                  "M550 250C600 300 650 250 700 300",

                  "M10.3635 198.539C150 50 200 50 50 10",
                  "M10.3635 198.539C150 50 200 400 250 150",
                  ...(index === enrolledTopics.length - 1
                    ? []
                    : ["M10.3635 198.539L143.35 322.052"]),
                ]}
              />
            </View>
            {renderTimelineItem(topic, index * 2 + 1, true)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CourseRoadmap;
