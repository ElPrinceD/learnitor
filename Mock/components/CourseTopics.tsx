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
  const shadows = useShadows();

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
      paddingVertical: rV(20),
      paddingHorizontal: rS(10),
    },
    topicCard: {
      marginBottom: rV(15),
      backgroundColor: themeColors.card,
      padding: rMS(10),
      margin: rMS(5),
      borderRadius: 10,
      ...shadows.small,
      position: "relative",
    },
    icon: {
      backgroundColor: themeColors.tint,
      padding: rMS(5),
      borderRadius: 50,
      ...shadows.small,
    },
    topicTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      paddingLeft: rS(8),
      flexWrap: "wrap",
      maxWidth: rMS(250),
      color: themeColors.text,
    },
    topicDescription: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      marginLeft: rS(36),
    },
    orderNumber: {
      position: "absolute",
      top: rV(15),
      right: rS(15),
      fontSize: SIZES.small,
      fontWeight: "bold",
      color: themeColors.textSecondary,
    },
    instructionText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: rV(8),
      color: themeColors.text,
    },
    clearButton: {
      alignSelf: "flex-end",
      backgroundColor: "#fff",
      borderRadius: 50,
      padding: rMS(1),
      marginTop: -rV(10),
      marginRight: rS(10),
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
          <Ionicons
            name="close"
            size={SIZES.xLarge}
            style={styles.clearButtonIcon}
          />
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
              <View>
                <Ionicons
                  name="play-circle"
                  size={SIZES.large}
                  color={"white"}
                  style={styles.icon}
                />
              </View>
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
