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
import { FontAwesome6 } from "@expo/vector-icons";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}

interface CourseRoadmapProps {
  enrolledTopics: Topic[];
}

const CourseRoadmap: React.FC<CourseRoadmapProps> = ({ enrolledTopics }) => {
  const colorScheme = useColorScheme();

  const handleTopicPress = (topic: Topic) => {
    router.navigate("Topic");
    router.setParams({ topic: JSON.stringify(topic) });
  };

  const handleQuestionPress = (topic: Topic) => {
    router.navigate("Practice");
    router.setParams({ topic: JSON.stringify(topic) });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={styles.column}>
            {enrolledTopics.map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                <TouchableOpacity
                  onPress={() => handleTopicPress(topic)}
                  activeOpacity={0.5}
                >
                  <View style={styles.circle}>
                    <Text
                      style={[
                        styles.topicNumber,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                </TouchableOpacity>
                <Text
                  numberOfLines={3}
                  ellipsizeMode="tail"
                  style={[
                    styles.topicTitle,
                    {
                      color: colorScheme === "dark" ? "#fff" : "#000",
                      width: 100,
                    },
                  ]}
                >
                  {topic.title}
                </Text>
              </View>
            ))}
          </View>
          <View style={(styles.column, { marginTop: 120 })}>
            {enrolledTopics.map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                <TouchableOpacity
                  onPress={() => handleQuestionPress(topic)}
                  activeOpacity={0.5}
                >
                  <View style={styles.questionCircle}>
                    <Text
                      style={[
                        styles.topicNumber,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                    >
                      <FontAwesome6 name="dumbbell" size={24} color="black" />
                    </Text>
                  </View>
                </TouchableOpacity>
                <Text
                  numberOfLines={3}
                  style={[
                    styles.topicTitle,
                    {
                      color: colorScheme === "dark" ? "#fff" : "#000",
                      width: 150,
                    },
                  ]}
                >
                  Practice {topic.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 20,
    marginLeft: -60,
    marginTop: 3,
  },
  roadmap: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
  },
  topicItem: {
    marginBottom: 120, // Add this line
    alignItems: "center",
  },
  circle: {
    width: 100, // Adjusted size of the circle
    height: 100, // Adjusted size of the circle
    borderRadius: 50, // Adjusted border radius
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
    backgroundColor: "grey", // Adjust color as needed
  },
  questionCircle: {
    width: 100, // Adjusted size of the circle
    height: 100, // Adjusted size of the circle
    borderRadius: 50, // Adjusted border radius
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
    backgroundColor: "orange", // Adjust color as needed
  },
  emptyItem: {
    width: 150,
    height: 120,
    // Placeholder for even rows
  },
  topicNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  topicTitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: "center", // Center align the text
  },
});

export default CourseRoadmap;
