import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import axios from "axios";
import CourseRoadmap from "../../../components/CourseRoadmap";
import RoadmapTitle from "../../../components/RoadmapTitle";
import { useLocalSearchParams } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";

const EnrolledCourse: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { course } = useLocalSearchParams();
  const [enrolledTopics, setEnrolledTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/topics/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      setEnrolledTopics(response.data);

      setLoading(false);
    } catch (error) {
      setError("Error fetching data");
      setLoading(false);
    }
  };
  const fetchProgress = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/progress/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      setProgress(response.data.course_progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };
  useEffect(() => {
    fetchProgress();
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RoadmapTitle course={parsedCourse} progress={progress} />

      <CourseRoadmap enrolledTopics={enrolledTopics} course={parsedCourse} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EnrolledCourse;
