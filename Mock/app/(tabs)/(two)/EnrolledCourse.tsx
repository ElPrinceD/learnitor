import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  useColorScheme,
} from "react-native";
import axios from "axios";
import CourseRoadmap from "../../../components/CourseRoadmap";
import RoadmapTitle from "../../../components/RoadmapTitle";
import { Stack, useLocalSearchParams, router } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../../constants/Colors";
import ProgressBar from "../../../components/ProgressBar";

const EnrolledCourse: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { course } = useLocalSearchParams();
  const navigation = useNavigation();
  const [enrolledTopics, setEnrolledTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: "clamp",
  });

  const progressOpacity = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [-3, 1],
    extrapolate: "clamp",
  });

  const progressTranslateY = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [10, 0],
    extrapolate: "clamp",
  });

  const handleTopicPress = (topic: Topic) => {
    router.push({
      pathname: "VideoMaterials",
      params: { topic: JSON.stringify(topic) },
    });
  };

  const handleQuestionPress = (topic: Topic) => {
    router.push({
      pathname: "Practice",
      params: {
        topic: JSON.stringify(topic),
        course: course,
      },
    });
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
      fontWeight: "bold",
      color: themeColors.text,
      alignContent: "center",
      marginVertical: 10,
    },
    progressContainer: {
      marginTop: 5, // Add some margin to separate the progress bar from the title
      width: "100%",
      alignItems: "center", // Center align the progress bar
      marginVertical: 10,
    },
    progressText: {
      color: themeColors.textSecondary,
      marginLeft: 10,
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Animated.Text
            style={[
              styles.headerTitle,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
                textAlign: "center",
              },
            ]}
          >
            {parsedCourse.title}
          </Animated.Text>
          <Animated.View
            style={[
              styles.progressContainer,
              {
                opacity: progressOpacity,
                transform: [{ translateY: progressTranslateY }],
              },
            ]}
          >
            <ProgressBar
              progress={progress}
              containerStyle={{
                backgroundColor: themeColors.text,
                height: 10,
                width: 250, // Make sure the progress bar takes the full width
              }}
              fillStyle={{ backgroundColor: themeColors.icon }}
            />
          </Animated.View>
        </View>
      ),
      headerShown: true,
      headerTitleStyle: {
        fontWeight: "bold",
      },
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: themeColors.background,
      },
      headerShadowVisible: false,
      headerTitleAlign: "center",
    });
  }, [
    navigation,
    titleOpacity,
    titleTranslateY,
    progressOpacity,
    progressTranslateY,
  ]);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <RoadmapTitle course={parsedCourse} progress={progress} />
          <CourseRoadmap
            enrolledTopics={enrolledTopics}
            course={parsedCourse}
            handleTopicPress={handleTopicPress}
            handleQuestionPress={handleQuestionPress}
          />
        </View>
      </ScrollView>
    </>
  );
};

export default EnrolledCourse;
