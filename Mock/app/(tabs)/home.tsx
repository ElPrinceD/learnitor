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
import { SIZES, rMS, rS } from "../../constants";
import TaskList from "../../components/TaskList";
import { getTodayPlans, getCategoryNames } from "../../TimelineApiCalls";
import {
  getEnrolledCourses,
  getCourseProgress,
} from "../../CoursesApiCalls";
import { getAnnouncements } from "../../companyApiCalls";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../QueryClient";

import ErrorMessage from "../../components/ErrorMessage";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import ReanimatedCarousel from "../../components/ReanimatedCarousel";

const Home: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Announcements
  const {
    status: announcementsStatus,
    data: announcementsData = [],
    error: announcementsError,
  } = useQuery({
    queryKey: ["announcements", userToken?.token],
    queryFn: () => getAnnouncements(userToken?.token!),
    enabled: !!userToken?.token,
  });

  // Fetch Enrolled Courses
  const {
    status: enrolledStatus,
    data: enrolledCoursesData,
    error: enrolledError,
  } = useQuery({
    queryKey: ["enrolledCourses", userToken?.token],
    queryFn: () => getEnrolledCourses(userInfo?.user?.id!, userToken?.token!),
    enabled: !!userToken?.token && !!userInfo?.user?.id,
  });

  // Fetch Tasks
  const {
    status: tasksStatus,
    data: tasksData = { tasks: [], categories: {} },
    error: tasksError,
  } = useQuery({
    queryKey: ["todayTasks", userToken?.token],
    queryFn: async () => {
      if (!userToken?.token) return { tasks: [], categories: {} };
      const date = new Date();
      return {
        tasks: await getTodayPlans(userToken.token, date, null),
        categories: await getCategoryNames(userToken.token),
      };
    },
    enabled: !!userToken?.token,
  });

  // Fetch Course Progress
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
      return progressArray.reduce(
        (acc, item) => ({ ...acc, [item.courseId]: item.progress }),
        {}
      );
    },
    enabled: !!userToken?.token && !!enrolledCoursesData,
  });

  useEffect(() => {
    if (
      enrolledStatus === "error" ||
      progressStatus === "error" ||
      tasksStatus === "error" ||
      announcementsStatus === "error"
    ) {
      setErrorMessage(
        enrolledError?.message ||
          progressError?.message ||
          tasksError?.message ||
          announcementsError?.message ||
          "An error occurred"
      );
    } else {
      setErrorMessage(null);
    }
  }, [enrolledStatus, progressStatus, tasksStatus, announcementsStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["announcements", userToken?.token] });
      await queryClient.invalidateQueries({ queryKey: ["enrolledCourses", userToken?.token] });
      await queryClient.invalidateQueries({ queryKey: ["progress", userToken?.token, enrolledCoursesData] });
      await queryClient.invalidateQueries({ queryKey: ["todayTasks", userToken?.token] });
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, enrolledCoursesData]);

  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(12),
      flexGrow: 2,
    },
    coursesContainer: {
      flex: 2.5,
    },
    sectionTitle: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
    },
    taskAndCoursesRow: {
      justifyContent: "space-between",
      marginTop: rMS(10),
    },
    tasksContainer: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(5),
      flexDirection: "row",
    },
    taskCountContainer: {
      flex: 1,
      backgroundColor: "#EF643B",
      marginVertical: rMS(10),
      borderRadius: rMS(10),
      alignItems: "flex-end",
      justifyContent: "center",
    },
    taskCountNumber: {
      fontSize: SIZES.xxxLarge,
      color: "white",
      fontWeight: "bold",
      paddingHorizontal: rS(10),
    },
    taskCountText: {
      fontSize: SIZES.small,
      fontWeight: "bold",
      color: "white",
      marginLeft: rMS(40),
      paddingHorizontal: rS(10),
    },
    taskListContainer: {
      flex: 1,
      margin: rMS(10),
    },
  });

  // Transform announcements into carousel items
  const carouselItems = announcementsData.map((announcement) => ({
    title: announcement.title,
    description: announcement.description,
    image: announcement.image, // Ensure this key matches your API response
  }));

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
            <View style={styles.taskAndCoursesRow}>
              <EnrolledCoursesList
                enrolledCoursesData={enrolledCoursesData}
                progressMap={progressMap || {}}
                loading={enrolledStatus === "pending"}
              />
              <View style={styles.tasksContainer}>
                <View style={styles.taskCountContainer}>
                  <Text style={styles.taskCountText}>Tasks Today</Text>
                  <Text style={styles.taskCountNumber}>
                    {tasksData.tasks.length}
                  </Text>
                </View>
                {tasksData.tasks.length > 0 && (
                  <View style={styles.taskListContainer}>
                    <TaskList
                      tasks={tasksData.tasks}
                      categoryNames={tasksData.categories}
                    />
                  </View>
                )}
              </View>
            </View>
          ) : null}
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
