import React from "react";
import { View, StyleSheet } from "react-native";
import CourseRoadmap from "../../../components/CourseRoadmap";
import RoadmapTitle from "@/components/RoadmapTitle";
import { useLocalSearchParams } from "expo-router";

interface Topic {
  title: string;
  description: string;
  id: string;
}

const EnrolledCourse: React.FC = () => {
  const { enrolledTopics } = useLocalSearchParams();
  // Provide a default empty string if enrolledTopics is undefined
  const parsedTopics: Topic[] = Array.isArray(enrolledTopics)
    ? enrolledTopics
    : JSON.parse(enrolledTopics || "[]");

  return (
    <View style={styles.container}>
      <RoadmapTitle />

      <CourseRoadmap enrolledTopics={parsedTopics} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EnrolledCourse;
