import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import ThreeDButton from "./ThreeDButton";
import Colors from "../constants/Colors";
import { Topic } from "./types";
import { PathA, PathB } from "./SvgComponent";
import { SIZES, rMS, rS, rV } from "../constants";

interface CourseRoadmapProps {
  enrolledTopics: Topic[];
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
      // marginBottom: rV(8),
      // marginTop: rV(-40),
      position: "relative",
      minHeight: rV(80),
    },
    timelineContentLeft: {
      flex: 1,
      alignItems: "flex-start",
      marginLeft: rS(13),
      position: "relative",
      zIndex: 1,
    },
    timelineContentCenter: {
      flex: 1,
      alignItems: "center",
      position: "relative",
      zIndex: 1,
    },
    timelineContentRight: {
      flex: 1,
      alignItems: "flex-end",
      marginRight: rS(13),
      position: "relative",
      zIndex: 1,
    },
    timelineText: {
      fontSize: 15,
      color: themeColors.text,
      marginTop: rV(18),
      maxWidth: "80%",
    },
    backgroundContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      height: "100%",
      width: "100%",
    },
    pathContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      height: "100%",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    topicContainer: {
      position: "relative",
      marginBottom: rV(20),
      minHeight: rV(160),
      paddingVertical: rV(10),
    },
  });

  const renderTimelineItem = (
    topic: Topic,
    index: number,
    isQuestion: boolean
  ) => {
    const cyclePosition = index % 10;
    let contentStyle:
      | { flex: number; alignItems: "flex-start"; marginLeft: number }
      | { flex: number; alignItems: "center" }
      | { flex: number; alignItems: "flex-end"; marginRight: number } =
      styles.timelineContentLeft;

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
      contentStyle.alignItems === "flex-start"
        ? "left"
        : contentStyle.alignItems === "center"
        ? "center"
        : "right";

    const onPress = useCallback(
      () => (isQuestion ? handleQuestionPress(topic) : handleTopicPress(topic)),
      [isQuestion, topic.id, handleTopicPress, handleQuestionPress]
    );

    return (
      <View key={`${topic.id}-${index}`} style={styles.timelineItem}>
        <View style={contentStyle}>
          <ThreeDButton isQuestion={isQuestion} onPress={onPress} />
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[styles.timelineText, { textAlign }]}
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
          <View key={topic.id} style={styles.topicContainer}>
            {renderTimelineItem(topic, index * 2, false)}
            <View style={styles.backgroundContainer}>
              <View style={styles.pathContainer}>
                {(index % 2 === 0) === (Math.floor(index / 5) % 2 === 0) ? (
                  <PathA />
                ) : (
                  <PathB />
                )}
              </View>
            </View>
            {renderTimelineItem(topic, index * 2 + 1, true)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(CourseRoadmap);
