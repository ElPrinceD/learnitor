import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { Topic } from "./types";
import { PlayCircle, X } from "lucide-react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";

interface CourseTopicsProps {
  topics: Topic[];
  onSelectedTopicsChange: (selectedTopics: Topic[]) => void;
  selectedTopics: Topic[];
}

const CourseTopics: React.FC<CourseTopicsProps> = ({
  topics,
  onSelectedTopicsChange,
  selectedTopics,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  useEffect(() => {
    onSelectedTopicsChange(selectedTopics);
  }, [selectedTopics, onSelectedTopicsChange]);

  const toggleTopicSelection = (id: number) => {
    const topic = topics.find((topic) => topic.id === id);
    if (!topic) return;

    const isSelected = selectedTopics.some((t) => t.id === id);

    if (isSelected) {
      const updatedTopics = selectedTopics.filter((t) => t.id !== id);
      onSelectedTopicsChange(updatedTopics);
    } else {
      onSelectedTopicsChange([...selectedTopics, topic]);
    }
  };

  const clearSelection = () => {
    onSelectedTopicsChange([]);
  };

  const showClearButton = selectedTopics.length > 0;

  const styles = StyleSheet.create({
    topicsContainer: {
      backgroundColor: themeColors.background,
      paddingVertical: rV(16),
      paddingHorizontal: rS(14),
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rV(14),
    },
    instructionText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
      flex: 1,
    },
    clearButton: {
      backgroundColor: themeColors.tint + "15",
      borderRadius: rMS(16),
      padding: rMS(6),
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    topicCard: {
      marginBottom: rV(10),
      backgroundColor: themeColors.cardGlass,
      padding: rMS(14),
      borderRadius: rMS(20),
      borderWidth: 1.5,
      borderColor: themeColors.border + "40",
      flexDirection: "row",
      alignItems: "center",
    },
    topicCardSelected: {
      backgroundColor: themeColors.tint + "10",
      borderColor: themeColors.tint + "40",
    },
    iconContainer: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(18),
      backgroundColor: themeColors.tint,
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(12),
    },
    topicContent: {
      flex: 1,
    },
    topicTitle: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.1,
      marginBottom: rV(2),
    },
    topicDescription: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      lineHeight: rMS(16),
      fontWeight: "600",
    },
    orderBadge: {
      width: rMS(24),
      height: rMS(24),
      borderRadius: rMS(12),
      backgroundColor: themeColors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    orderBadgeText: {
      color: "#fff",
      fontSize: rMS(11),
      fontWeight: "900",
    },
    emptyBadge: {
      width: rMS(24),
      height: rMS(24),
      borderRadius: rMS(12),
      borderWidth: 1.5,
      borderColor: themeColors.border,
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.topicsContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.instructionText}>
          Select your topics to learn
        </Text>
        {showClearButton && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSelection}
            activeOpacity={0.7}
          >
            <X size={16} color={themeColors.tint} />
          </TouchableOpacity>
        )}
      </View>

      {topics.map((topic, index) => {
        const isSelected = selectedTopics.some((t) => t.id === topic.id);
        const orderNumber =
          selectedTopics.findIndex((t) => t.id === topic.id) + 1;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.topicCard,
              isSelected && styles.topicCardSelected,
            ]}
            onPress={() => toggleTopicSelection(topic.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <PlayCircle size={18} color="#fff" />
            </View>
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle} numberOfLines={2}>
                {topic.title}
              </Text>
              {topic.description ? (
                <Text style={styles.topicDescription} numberOfLines={2}>
                  {topic.description}
                </Text>
              ) : null}
            </View>
            {isSelected ? (
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{orderNumber}</Text>
              </View>
            ) : (
              <View style={styles.emptyBadge} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CourseTopics;
