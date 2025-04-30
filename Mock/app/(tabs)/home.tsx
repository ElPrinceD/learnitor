import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { getTodayPlans, getCategoryNames } from "../../services/TimelineApiCalls";
import {
  getEnrolledCourses,
  getCourseProgress,
} from "../../services/CoursesApiCalls";
import { getAnnouncements } from "../../services/companyApiCalls";
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

  const token = userToken?.token;
  const userId = userInfo?.user?.id;

  // Announcements
  const {
    data: announcementsData = [],
    error: announcementsError,
    status: announcementsStatus,
  } = useQuery({
    queryKey: ["announcements", token],
    queryFn: () => getAnnouncements(token!),
    enabled: !!token,
  });

  // Enrolled Courses
  const {
    data: enrolledCoursesData,
    error: enrolledError,
    status: enrolledStatus,
  } = useQuery({
    queryKey: ["enrolledCourses", userId, token],
    queryFn: () => getEnrolledCourses(userId!, token!),
    enabled: !!token && !!userId,
  });

  // Tasks and Categories
  const {
    data: tasksData = { tasks: [], categories: {} },
    error: tasksError,
    status: tasksStatus,
  } = useQuery({
    queryKey: ["todayTasks", token],
    queryFn: async () => {
      const date = new Date();
      return {
        
        categories: await getCategoryNames(token!),
        tasks: await getTodayPlans(token!, date,getCategoryNames(token!)),
      };
    },
    enabled: !!token,
  });

  // Course Progress
  const {
    data: progressMap,
    error: progressError,
    status: progressStatus,
  } = useQuery({
    queryKey: ["progress", userId, token, enrolledCoursesData],
    queryFn: async () => {
      const progressArray = await Promise.all(
        enrolledCoursesData!.map(async (course) => {
          const progress = await getCourseProgress(userId!, course.id, token!);
          return { courseId: course.id, progress };
        })
      );
      return progressArray.reduce(
        (acc, { courseId, progress }) => ({ ...acc, [courseId]: progress }),
        {}
      );
    },
    enabled: !!token && !!userId && !!enrolledCoursesData,
  });

  useEffect(() => {
    if (
      enrolledStatus === "error" ||
      progressStatus === "error" ||
      tasksStatus === "error" ||
      announcementsStatus === "error"
    ) {
      setErrorMessage(
        enrolledError?.message?.toString() ||
          progressError?.message?.toString() ||
          tasksError?.message?.toString() ||
          announcementsError?.message?.toString() ||
          "An unknown error occurred"
      );
    } else {
      setErrorMessage(null);
    }
  }, [
    enrolledStatus,
    progressStatus,
    tasksStatus,
    announcementsStatus,
    enrolledError,
    progressError,
    tasksError,
    announcementsError,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["announcements", token] }),
        queryClient.invalidateQueries({ queryKey: ["enrolledCourses", userId, token] }),
        queryClient.invalidateQueries({ queryKey: ["progress", userId, token, enrolledCoursesData] }),
        queryClient.invalidateQueries({ queryKey: ["todayTasks", token] }),
      ]);
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [token, userId, enrolledCoursesData]);

  const themeColors = Colors[colorScheme ?? "light"];

  const carouselItems = useMemo(
    () =>
      (announcementsData?.results || []).map((announcement) => ({
        title: announcement.title,
        description: announcement.description,
        image: announcement.image,
      })),
    [announcementsData]
  );

  return (
    <View style={styles(themeColors).container}>
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
        <View style={styles(themeColors).coursesContainer}>
          {enrolledCoursesData?.length ? (
            <View style={styles(themeColors).taskAndCoursesRow}>
              <EnrolledCoursesList
                enrolledCoursesData={enrolledCoursesData}
                progressMap={progressMap || {}}
                loading={enrolledStatus === "pending"}
              />
              <View style={styles(themeColors).tasksContainer}>
                <View style={styles(themeColors).taskCountContainer}>
                  <Text style={styles(themeColors).taskCountText}>Tasks Today</Text>
                  <Text style={styles(themeColors).taskCountNumber}>
                    {tasksData.tasks.length}
                  </Text>
                </View>
                {tasksData.tasks.length > 0 && (
                  <View style={styles(themeColors).taskListContainer}>
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

const styles = (themeColors: typeof Colors["light"]) =>
  StyleSheet.create({
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
      backgroundColor: "#EF643B",
      marginVertical: rMS(10),
      borderRadius: rMS(10),
      alignItems: "flex-end",
      justifyContent: "center",
      padding: rMS(28),
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

export default Home;