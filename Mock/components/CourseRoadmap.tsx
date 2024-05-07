import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}

interface CourseRoadmapProps {
  selectedTopics: Topic[];
}

const CourseRoadmap: React.FC<CourseRoadmapProps> = ({ selectedTopics }) => {
  const colorScheme = useColorScheme();

  return (
    <ScrollView
      style={[
        styles.container,
        // { backgroundColor: colorScheme === "dark" ? "#000" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.heading,
          { color: colorScheme === "dark" ? "#fff" : "#000" },
        ]}
      >
        Roadmap
      </Text>
      <View style={styles.roadmap}>
        {selectedTopics.map((topic: Topic, index: number) => (
          <View
            key={index}
            style={[styles.topicItem, index % 2 === 0 && styles.zigzag]}
          >
            {topic.completed ? (
              <TouchableOpacity
                onPress={() => {
                  // Handle press if needed
                }}
                activeOpacity={0.8} // Adjust the opacity if needed
              >
                <View style={styles.topicNumberContainer}>
                  <View
                    style={[
                      styles.completedCircle,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#333" : "#fff",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.completedIcon,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      ✓
                    </Text>
                    <Text
                      style={[
                        styles.topicTitle,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      {topic.title}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  router.navigate("Topic");
                  router.setParams({ topic: JSON.stringify(topic) });
                }}
                activeOpacity={0.5} // Adjust the opacity if needed
              >
                <View style={styles.topicNumberContainer}>
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#333" : "#fff",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.topicNumber,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      {index + 1}
                    </Text>
                    <Text
                      style={[
                        styles.topicTitle,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      {topic.title}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  roadmap: {
    flexDirection: "column",
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  zigzag: {
    flexDirection: "row-reverse",
  },
  topicNumberContainer: {
    marginRight: 10,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  topicNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  completedCircle: {
    width: 150,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 5,
  },
  completedIcon: {
    fontSize: 16,
    fontWeight: "bold",
  },
  circle: {
    width: 150,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 1,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default CourseRoadmap;
