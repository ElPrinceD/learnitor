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
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

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
      paddingVertical: 20,
      borderTopColor: themeColors.border,
      paddingHorizontal: 10,
    },
    topicCard: {
      marginBottom: 15,
      backgroundColor: themeColors.card,
      padding: 10,
      margin: 5,
      borderRadius: 10,
      shadowColor: themeColors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.4,
      shadowRadius: 9.84,
      elevation: 1,
      position: "relative",
    },
    icon: {
      backgroundColor: themeColors.tint,
      padding: 5,
      borderRadius: 50,
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 2,
    },
    topicTitle: {
      fontSize: 17,
      fontWeight: "bold",
      paddingLeft: 10,
      color: themeColors.text,
    },
    topicDescription: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginTop: -10,
      marginLeft: 40,
    },
    orderNumber: {
      position: "absolute",
      top: 15,
      right: 15,
      fontSize: 16,
      fontWeight: "bold",
      color: themeColors.textSecondary,
    },
    instructionText: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
      color: themeColors.text,
    },
    clearButton: {
      alignSelf: "flex-end",
      backgroundColor: "#fff",
      borderRadius: 50,
      padding: 1,
      marginTop: -10,
      marginRight: 10,
    },
    clearButtonIcon: {
      color: themeColors.buttonBackground,
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.topicsContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.instructionText}>
        Select your topics in the order in which you want to learn them.
      </Text>
      {showClearButton && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearSelection}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={27} style={styles.clearButtonIcon} />
        </TouchableOpacity>
      )}
      {topics.map((topic, index) => {
        const isSelected = selectedTopics.some((t) => t.id === topic.id);
        const orderNumber =
          selectedTopics.findIndex((t) => t.id === topic.id) + 1;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.topicCard,
              isSelected && {
                backgroundColor: colorScheme === "dark" ? "#666" : "#ddd",
              },
            ]}
            onPress={() => toggleTopicSelection(topic.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.orderNumber}>
              {isSelected ? orderNumber : ""}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Ionicons
                name="play-circle"
                size={20}
                color={"white"}
                style={styles.icon}
              />
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </View>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CourseTopics;
