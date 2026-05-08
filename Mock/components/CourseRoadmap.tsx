import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { BookX } from "lucide-react-native";
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
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.text,
      marginTop: rV(18),
      maxWidth: "80%",
      letterSpacing: -0.1,
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
    // Empty state — glassmorphic, matches Play's squadEmpty
    emptyContainer: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(24),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      margin: rMS(18),
    },
    emptyText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(8),
      fontWeight: "600",
      lineHeight: rMS(18),
    },
  });

  // Early return if no topics
  if (!enrolledTopics || enrolledTopics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <BookX size={28} color={themeColors.textSecondary} />
        <Text style={styles.emptyText}>
          No topics available yet
        </Text>
      </View>
    );
  }

  // Create stable callback functions outside of render
  const createTopicPressHandler = useCallback(
    (topic: Topic) => () => handleTopicPress(topic),
    [handleTopicPress]
  );

  const createQuestionPressHandler = useCallback(
    (topic: Topic) => () => handleQuestionPress(topic),
    [handleQuestionPress]
  );

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

    // Use the stable callback functions instead of useCallback inside render
    const onPress = isQuestion
      ? createQuestionPressHandler(topic)
      : createTopicPressHandler(topic);

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
            {renderTimelineItem(topic, index * 2 + 1, true)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(CourseRoadmap);
