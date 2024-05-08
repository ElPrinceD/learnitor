import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Topic {
  title: string;
  description: string;
  id: string;
}

interface CourseTopicsProps {
  topics: Topic[];
  onSelectedTopicsChange: (selectedTopics: Topic[]) => void;
  selectedTopics: Topic[]; // Define selectedTopics prop
}

const CourseTopics: React.FC<CourseTopicsProps> = ({
  topics,
  onSelectedTopicsChange,
  selectedTopics,
}) => {
  const colorScheme = useColorScheme();

  useEffect(() => {
    onSelectedTopicsChange(selectedTopics);
  }, [selectedTopics, onSelectedTopicsChange]);

  const toggleTopicSelection = (id: string) => {
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
  const styles = StyleSheet.create({
    topicsContainer: {
      paddingVertical: 20,
      paddingHorizontal: 10,
      // backgroundColor: colorScheme === "dark" ? "#080808" : "#F0F0F0",
    },
    topicCard: {
      marginBottom: 15,
      backgroundColor: colorScheme === "dark" ? "#181818" : "#FFFFFF",
      padding: 25,
      margin: 5,
      borderRadius: 40,
      shadowColor: colorScheme === "dark" ? "#696969" : "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 1,
      shadowRadius: 9.84,
      elevation: 1,
      position: "relative",
    },
    topicTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    topicDescription: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#ccc" : "#666",
      marginTop: 10,
    },
    orderNumber: {
      position: "absolute",
      top: 15,
      right: 15,
      fontSize: 16,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#ccc" : "#666",
    },
    // clearButton: {
    //   position: "absolute",
    //   top: 45,
    //   right: 20,
    //   backgroundColor: showClearButton
    //     ? colorScheme === "dark"
    //       ? "#666"
    //       : "#ddd"
    //     : "transparent",
    //   borderRadius: 50,
    //   padding: 1,
    // },
    // clearButtonIcon: {
    //   color: colorScheme === "dark" ? "#fff" : "#333",
    // },
    instructionText: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#333",
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
      {/* {showClearButton && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearSelection}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={27} style={styles.clearButtonIcon} />
        </TouchableOpacity>
      )} */}
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
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CourseTopics;
