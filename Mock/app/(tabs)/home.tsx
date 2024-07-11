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
  getEnrolledCourses,
  getCourseProgress,
  getRecommendedCourses,
  getCourseTopics,
  getPracticeQuestions,
} from "../../CoursesApiCalls";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../QueryClient";

import ErrorMessage from "../../components/ErrorMessage";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import ReanimatedCarousel from "../../components/ReanimatedCarousel";

const Home: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendedCoursesWithDetails = async (token: string) => {
    const courses = await getRecommendedCourses(token);
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const topics = await getCourseTopics(course.id, token);
        const questionsCount = (
          await Promise.all(
            topics.map(async (topic) => {
              const questions = await getPracticeQuestions(topic.id, token);
              return questions.length;
            })
          )
        ).reduce((acc, count) => acc + count, 0);

        return {
          ...course,
          topicsCount: topics.length,
          questionsCount,
        };
      })
    );
    return coursesWithDetails;
  };

  const {
    status: recommendedStatus,
    data: coursesData = [],
    error: recommendedError,
  } = useQuery({
    queryKey: ["coursesWithDetails", userToken?.token],
    queryFn: () => fetchRecommendedCoursesWithDetails(userToken?.token!),
    enabled: !!userToken?.token,
  });

  const {
    status: enrolledStatus,
    data: enrolledCoursesData,
    error: enrolledError,
  } = useQuery({
    queryKey: ["enrolledCourses", userToken?.token],
    queryFn: () => getEnrolledCourses(userInfo?.user?.id!, userToken?.token!),
    enabled: !!userToken?.token && !!userInfo?.user?.id,
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
          userInfo?.user?.id!,
          course.id,
          userToken?.token!
        );
        return { courseId: course.id, progress };
      });

      const progressArray = await Promise.all(progressPromises);
      const progressMap: { [key: string]: number } = {};
      progressArray.forEach((item) => {
        progressMap[item.courseId] = item.progress;
      });

      return progressMap;
    },
    enabled: !!userToken?.token && !!enrolledCoursesData,
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
        queryKey: ["coursesWithDetails", userToken?.token],
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

  const carouselItems = [
    {
      title: "Arranged Timeline",
      description: "All your schedules and tasks in one place",
      image:
        "https://img.freepik.com/free-photo/clipboard-with-checklist-paper-note-icon-symbol-purple-background-3d-rendering_56104-1491.jpg?t=st=1720695928~exp=1720699528~hmac=c01f700d3fb1485935bcaea8c8f58e3138e0e1926932e00a354e64b942b7759f&w=740",
    },
    {
      title: "Tailored Courses",
      description:
        "Our platform curates a unique selection of courses based on your interests",
      image:
        "https://images.unsplash.com/photo-1526170160160-1a5eb242ab58?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "",
      description: "",
      image:
        "https://img.freepik.com/free-vector/quote-blog-banner-template-editable-inspirational-message-everyday-is-fresh-start-vector_53876-146703.jpg?t=st=1720698178~exp=1720701778~hmac=6fdc12b09cfa7c01741c595f934cdc6b6c20e63350fe0f1c3b1a6c1c4bdc3517&w=900",
    },
  ];

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
        <ReanimatedCarousel data={carouselItems} />
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
