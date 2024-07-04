import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  useColorScheme,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Text, View } from "../../components/Themed";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS } from "../../constants";
import {
  getRecommendedCourses,
  getEnrolledCourses,
  getCourseProgress,
} from "../../CoursesApiCalls";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../QueryClient";

import ErrorMessage from "../../components/ErrorMessage";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";

const Home = () => {
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    status: recommendedStatus,
    data: coursesData,
    error: recommendedError,
  } = useQuery({
    queryKey: ["courses", userToken?.token],
    queryFn: () => getRecommendedCourses(userToken?.token),
  });

  const {
    status: enrolledStatus,
    data: enrolledCoursesData,
    error: enrolledError,
  } = useQuery({
    queryKey: ["enrolledCourses", userToken?.token],
    queryFn: () => getEnrolledCourses(userInfo?.user?.id, userToken?.token),
  });

  const {
    status: progressStatus,
    data: progressMap,
    error: progressError,
  } = useQuery({
    queryKey: ["progress", userToken?.token, enrolledCoursesData],
    queryFn: async () => {
      if (!enrolledCoursesData) return {};

      const progressPromises = enrolledCoursesData.map(async (course) => {
        const progress = await getCourseProgress(
          userInfo?.user?.id,
          course.id,
          userToken?.token
        );
        return { courseId: course.id, progress };
      });

      const progressArray = await Promise.all(progressPromises);
      const progressMap = {};
      progressArray.forEach((item) => {
        progressMap[item.courseId] = item.progress;
      });

      return progressMap;
    },
    enabled: !!enrolledCoursesData,
  });

  useEffect(() => {
    if (
      recommendedStatus === "error" ||
      enrolledStatus === "error" ||
      progressStatus === "error"
    ) {
      setErrorMessage(
        recommendedError?.message ||
          enrolledError?.message ||
          progressError?.message ||
          "An error occurred"
      );
    }
  }, [recommendedStatus, enrolledStatus, progressStatus]);

  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(12),
      flexGrow: 2,
    },
    cardContainer: {
      flex: 1,
    },
    coursesContainer: {
      flex: 2.5,
    },
    sectionTitle: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      marginBottom: rMS(5),
      marginTop: rMS(15),
      alignSelf: "flex-start",
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      await queryClient.invalidateQueries({
        queryKey: ["enrolledCourses", userToken?.token],
      });
      await queryClient.invalidateQueries({
        queryKey: ["progress", userToken?.token, enrolledCoursesData],
      });
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, enrolledCoursesData]);

  return (
    <View style={styles.container}>
      <ScrollView
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
        <View style={styles.coursesContainer}>
          <Text style={styles.sectionTitle}>Enrolled Courses</Text>
          <EnrolledCoursesList
            enrolledCoursesData={enrolledCoursesData}
            progressMap={progressMap || {}}
            loading={enrolledStatus === "pending"}
          />
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <RecommendedCoursesList
            RecommendedCoursesData={coursesData}
            loading={recommendedStatus === "pending"}
          />
        </View>
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default Home;
