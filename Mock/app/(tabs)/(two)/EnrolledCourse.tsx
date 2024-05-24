import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import axios from "axios";
import CourseRoadmap from "../../../components/CourseRoadmap";
import RoadmapTitle from "../../../components/RoadmapTitle";
import { Stack, useLocalSearchParams } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import { useNavigation } from "@react-navigation/native";

const EnrolledCourse: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { course } = useLocalSearchParams();
  const navigation = useNavigation();
  const [enrolledTopics, setEnrolledTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
    fetchProgress();
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

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Animated.Text
          style={[
            styles.headerTitle,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
          ]}
        >
          {parsedCourse.title}
        </Animated.Text>
      ),
      headerShown: true,
      headerTitleStyle: {
        fontWeight: "bold",
      },
      headerBackTitle: "",
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: "#fdecd2", // Add this line
      },
      headerShadowVisible: false,
    });
  }, [navigation, titleOpacity, titleTranslateY]);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.container}>
          <RoadmapTitle course={parsedCourse} progress={progress} />
          <CourseRoadmap enrolledTopics={enrolledTopics} course={parsedCourse} />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EnrolledCourse;
