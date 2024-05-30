import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import ThreeDButton from "./ThreeDButton"; // Assuming ThreeDButton is in the same directory
import Colors from "../constants/Colors";
import { Course, Topic } from "./types";

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
      margin: 20,
    },
    timelineItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    timelineConnector: {
      width: 2,
      height: 100,
      backgroundColor: "transparent",
      marginHorizontal: 10,
    },
    timelineContentLeft: {
      flex: 1,
      alignItems: "flex-start",
      marginLeft: 13,
    },
    timelineContentCenter: {
      flex: 1,
      alignItems: "center",
    },
    timelineContentRight: {
      flex: 1,
      alignItems: "flex-end",
      marginRight: 13,
    },
    timelineText: {
      fontSize: 14,
      color: themeColors.text,
      marginTop: 20,
      width: 150,
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
        {/* {cyclePosition % 6 === 3 && <View style={styles.timelineConnector} />} */}
        <View style={contentStyle}>
          <ThreeDButton
            title={
              isQuestion ? (
                <Ionicons name="play-circle-outline" size={30} color="black" />
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
        {/* {cyclePosition % 6 !== 3 && <View style={styles.timelineConnector} />} */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {enrolledTopics.map((topic, index) => (
          <View key={index}>
            {renderTimelineItem(topic, index * 2, false)}
            {renderTimelineItem(topic, index * 2 + 1, true)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CourseRoadmap;
