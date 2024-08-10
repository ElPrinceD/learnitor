import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  useColorScheme,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Text, View } from "../../components/Themed";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS } from "../../constants";
import TaskList from "../../components/TaskList";
import { getTodayPlans, getCategoryNames } from "../../TimelineApiCalls";
import {
  getEnrolledCourses,
  getCourseProgress,
  getRecommendedCourses,
  getCourseTopics,
  getPracticeQuestions,
} from "../../CoursesApiCalls";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../QueryClient";
import { FontAwesome6 } from "@expo/vector-icons"; // Replace this line

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

  const fetchTasks = async () => {
    if (!userToken?.token) return { tasks: [], categories: {} };

    const date = new Date();
    const selectedCategory = null; // Adjust this if you have a category filter

    const tasks = await getTodayPlans(userToken.token, date, selectedCategory);
    const categories = await getCategoryNames(userToken.token);

    return { tasks, categories };
  };

  const {
    status: tasksStatus,
    data: tasksData = { tasks: [], categories: {} },
    error: tasksError,
  } = useQuery({
    queryKey: ["todayTasks", userToken?.token],
    queryFn: fetchTasks,
    enabled: !!userToken?.token,
  });

  useEffect(() => {
    if (tasksStatus === "error") {
      setErrorMessage(tasksError?.message || "An error occurred");
    } else {
      setErrorMessage(null);
    }
  }, [tasksStatus]);

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
    } else {
      setErrorMessage(null);
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
    sectionTitleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rMS(5),
      marginTop: rMS(15),
    },
    sectionTitle: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      alignSelf: "flex-start",
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    seeAllText: {
      fontSize: SIZES.medium,
      color: themeColors.tint,
      marginRight: rMS(1),
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
        "https://img.freepik.com/free-photo/flat-lay-wall-clock-still-life_23-2150417219.jpg?t=st=1721731839~exp=1721735439~hmac=06ab143336c02017b48d2c0e3d9f8a823700c56e4221af57f651987c6b08325a&w=826",
    },
    {
      title: "Tailored Courses",
      description:
        "Enroll to your courses and topics",
      image:
        "https://img.freepik.com/free-photo/colorful-books-with-pink-background_23-2148898315.jpg?t=st=1721738186~exp=1721741786~hmac=e8a0b87e317cf9191688af050934850e9ced4db90d9d39a03f78bbdb566fb991&w=826",
    },
    {
      title: "Gaming Centre",
      description: "Enjoy breathe-taking study games with your pals",
      image:
        "https://img.freepik.com/free-photo/target-board-with-arrow-red-background-copy-space-challenge-setup-business-achievement-goal-objective-target-concept-by-3d-render_616485-105.jpg?t=st=1721738864~exp=1721742464~hmac=98b1e9d066411242f7b0ab9854d6100217fac99729d8b45173de54464d24e210&w=900",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
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
        <ReanimatedCarousel data={carouselItems} />
        <View style={styles.coursesContainer}>
          {enrolledCoursesData?.length ? (
            <>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Enrolled Courses</Text>
              </View>
              <EnrolledCoursesList
                enrolledCoursesData={enrolledCoursesData}
                progressMap={progressMap || {}}
                loading={enrolledStatus === "pending"}
              />
            </>
          ) : (
            <>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Recommended for you</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                  <FontAwesome6 name="arrow-right" size={SIZES.medium} color={themeColors.tint} />
                </TouchableOpacity>
              </View>
              <RecommendedCoursesList
                RecommendedCoursesData={coursesData}
                loading={recommendedStatus === "pending"}
              />
            </>
          )}
          {tasksData.tasks.length > 0 && (
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
                <FontAwesome6 name="arrow-right" size={SIZES.medium} color={themeColors.tint} />  
              </TouchableOpacity>
            </View>
          )}
          {tasksData.tasks.length > 0 && (
            <TaskList
              tasks={tasksData.tasks}
              categoryNames={tasksData.categories}
              getCategoryColor={(category) => themeColors[category]}
            />
          )}
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
