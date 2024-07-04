import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  useColorScheme,
  RefreshControl,
} from "react-native";
import CourseRoadmap from "../../../components/CourseRoadmap";
import RoadmapTitle from "../../../components/RoadmapTitle";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../../constants/Colors";
import ProgressBar from "../../../components/ProgressBar";
import { SIZES, rS, rV } from "../../../constants";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../QueryClient";
import {
  getCourseProgress,
  getEnrolledCourseTopics,
} from "../../../CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";

const EnrolledCourse: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { course } = useLocalSearchParams();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message
  const [progress, setProgress] = useState<number>(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const scrollY = useRef(new Animated.Value(0)).current;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  const {
    status: enrolledTopicsStatus,
    data: enrolledTopics,
    error: enrolledTopicsError,
    refetch: refetchTopics,
  } = useQuery({
    queryKey: ["enrolledCourseTopics", parsedCourse?.id, userToken?.token],
    queryFn: () =>
      getEnrolledCourseTopics(
        userInfo?.user.id,
        parsedCourse?.id,
        userToken?.token
      ),
    enabled: !!parsedCourse?.id,
  });

  const {
    status: progressStatus,
    data: courseProgress,
    error: progressError,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
    queryFn: () => {
      // Check if user is enrolled before fetching progress
      if (parsedCourse?.id && userInfo?.user?.id && userToken?.token) {
        return getCourseProgress(
          userInfo.user.id,
          parsedCourse.id,
          userToken.token
        );
      } else {
        // Return a promise that resolves to a placeholder value when not enrolled
        return Promise.resolve(null); // or any other suitable placeholder
      }
    },
    enabled: !!parsedCourse?.id, // Enable query only if enrolled and course ID exists
  });

  useEffect(() => {
    if (progressError) {
      setErrorMessage(progressError.message || "An error occurred");
    } else if (courseProgress) {
      setProgress(courseProgress);
    }
  }, [courseProgress, progressError]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["enrolledCourseTopics", parsedCourse?.id, userToken?.token],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
      });
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userInfo?.user.id, parsedCourse.id]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    headerTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      alignContent: "center",
      marginVertical: rV(5),
    },
    progressContainer: {
      width: "100%",
      alignItems: "center", // Center align the progress bar
      alignSelf: "center",
      marginBottom: rV(10),
    },
    progressText: {
      color: themeColors.textSecondary,
      marginLeft: rS(10),
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
                color: themeColors.tint,
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
                height: rV(5),
                width: rS(220), // Make sure the progress bar takes the full width
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint, themeColors.text]}
            progressBackgroundColor={themeColors.background}
          />
        }
      >
        <View style={styles.container}>
          <RoadmapTitle course={parsedCourse} progress={progress} />
          {enrolledTopics && (
            <CourseRoadmap
              enrolledTopics={enrolledTopics}
              course={parsedCourse}
              handleTopicPress={handleTopicPress}
              handleQuestionPress={handleQuestionPress}
            />
          )}
        </View>
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage} // Control visibility based on errorMessage state
        onDismiss={() => setErrorMessage(null)} // Clear error message when dismissed
      />
    </>
  );
};

export default EnrolledCourse;
