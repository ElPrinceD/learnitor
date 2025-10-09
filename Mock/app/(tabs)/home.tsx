import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  useColorScheme,
  RefreshControl,
  ScrollView,
  Dimensions,
} from "react-native";
import { Text, View } from "../../components/Themed";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import TaskList from "../../components/TaskList";
import {
  getTodayPlans,
  getCategoryNames,
} from "../../services/TimelineApiCalls";
import {
  getEnrolledCourses,
  getCourseProgress,
  getCourses,
} from "../../services/CoursesApiCalls";
import { getAnnouncements } from "../../services/companyApiCalls";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../QueryClient";

import ErrorMessage from "../../components/ErrorMessage";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import ReanimatedCarouselWithAds from "../../components/ReanimatedCarouselWithAds";

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
    isLoading: announcementsLoading,
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
    isLoading: enrolledLoading,
  } = useQuery({
    queryKey: ["enrolledCourses", userId, token],
    queryFn: () => getEnrolledCourses(userId!, token!),
    enabled: !!token && !!userId,
  });

  // Recommended Courses (for first-time users)
  const {
    data: allCoursesData,
    error: coursesError,
    status: coursesStatus,
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ["allCourses", token],
    queryFn: () => getCourses(token!),
    enabled: !!token,
  });

  // Today's Tasks
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
        tasks: await getTodayPlans(token!, date, null),
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
          const progress = await getCourseProgress(
            userId!,
            Number(course.id),
            token!
          );
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
      announcementsStatus === "error" ||
      coursesStatus === "error"
    ) {
      setErrorMessage(
        enrolledError?.message?.toString() ||
          progressError?.message?.toString() ||
          tasksError?.message?.toString() ||
          announcementsError?.message?.toString() ||
          coursesError?.message?.toString() ||
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
    coursesStatus,
    enrolledError,
    progressError,
    tasksError,
    announcementsError,
    coursesError,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["announcements", token] }),
        queryClient.invalidateQueries({
          queryKey: ["enrolledCourses", userId, token],
        }),
        queryClient.invalidateQueries({
          queryKey: ["progress", userId, token, enrolledCoursesData],
        }),
        queryClient.invalidateQueries({ queryKey: ["todayTasks", token] }),
        queryClient.invalidateQueries({ queryKey: ["allCourses", token] }),
      ]);
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [token, userId, enrolledCoursesData]);

  const themeColors = Colors[colorScheme ?? "light"];

  const carouselItems = useMemo(() => {
    // The data is directly an array, not wrapped in a results property
    const items = (announcementsData || []).map((announcement) => ({
      title: announcement.title,
      description: announcement.description,
      image: announcement.image,
    }));

    return items;
  }, [announcementsData]);

  // Get 6 random recommended courses for first-time users
  const recommendedCourses = useMemo(() => {
    if (!allCoursesData || allCoursesData.length === 0) return [];

    // Shuffle array and take first 6
    const shuffled = [...allCoursesData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }, [allCoursesData]);

  // Learning quotes
  const learningQuotes = [
    "The expert in anything was once a beginner.",
    "Learning never exhausts the mind.",
    "Education is the passport to the future.",
    "The capacity to learn is a gift.",
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    "Learning is a treasure that will follow its owner everywhere.",
    "The more that you read, the more things you will know.",
    "Invest in yourself. Your career is the engine of your wealth.",
    "Knowledge is power, but enthusiasm pulls the switch.",
    "Learning is the only thing the mind never exhausts, never fears, and never regrets.",
  ];

  const randomQuote = useMemo(() => {
    return learningQuotes[Math.floor(Math.random() * learningQuotes.length)];
  }, []);

  // Get today's date in the same format as TaskList
  const todayDate = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
    const dayOfMonth = today.getDate();
    const month = today.toLocaleDateString("en-US", { month: "short" });
    return { dayOfWeek, dayOfMonth, month };
  }, []);

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
        {announcementsLoading ? (
          <View style={styles(themeColors).loadingContainer}>
            <Text style={styles(themeColors).loadingText}></Text>
          </View>
        ) : carouselItems.length > 0 ? (
          <ReanimatedCarouselWithAds data={carouselItems} />
        ) : null}
        <View style={styles(themeColors).coursesContainer}>
          {enrolledCoursesData?.length ? (
            <View style={styles(themeColors).taskAndCoursesRow}>
              <EnrolledCoursesList
                enrolledCoursesData={enrolledCoursesData}
                progressMap={progressMap || {}}
                loading={enrolledLoading}
              />
            </View>
          ) : (
            <View style={styles(themeColors).taskAndCoursesRow}>
              <EnrolledCoursesList
                enrolledCoursesData={recommendedCourses}
                progressMap={{}}
                loading={coursesLoading}
                isRecommended={true}
              />
            </View>
          )}
        </View>

        {/* Tasks Section */}
        <View style={styles(themeColors).tasksContainer}>
          <View style={styles(themeColors).taskCountContainer}>
            <Text style={styles(themeColors).taskCountText}>Tasks Today</Text>
            <Text style={styles(themeColors).taskCountNumber}>
              {tasksData.tasks.length}
            </Text>
          </View>
          <View style={styles(themeColors).taskListContainer}>
            {tasksData.tasks.length > 0 ? (
              <TaskList
                tasks={tasksData.tasks}
                categoryNames={tasksData.categories}
              />
            ) : (
              <View style={styles(themeColors).taskListContainer}>
                <View style={styles(themeColors).header}>
                  <View style={styles(themeColors).dateContainer}>
                    <Text style={styles(themeColors).dateText}>
                      {todayDate.dayOfWeek}
                    </Text>
                    <Text style={styles(themeColors).dayText}>
                      {todayDate.dayOfMonth} {todayDate.month}
                    </Text>
                  </View>
                </View>
                <View style={styles(themeColors).emptyState}>
                  <Text style={styles(themeColors).emptyText}>
                    "{randomQuote}"
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={useCallback(() => setErrorMessage(null), [])}
      />
    </View>
  );
};

const styles = (themeColors: (typeof Colors)["light"]) => {
  return StyleSheet.create({
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
      padding: rMS(16),
      marginTop: rMS(16),
      flexDirection: "row",
      alignItems: "stretch",
    },
    taskCountContainer: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#EF643B",
      borderRadius: rMS(12),
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(20),
      marginRight: rMS(16),
      width: "35%",
      flex: 0,
    },
    taskCountNumber: {
      fontSize: SIZES.xxxLarge,
      color: "#EF643B",
      fontWeight: "bold",
    },
    taskCountText: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: "#EF643B",
      marginTop: rV(4),
    },
    taskListContainer: {
      flex: 1,
      width: "65%",
      justifyContent: "flex-start",
    },
    loadingContainer: {
      height: Dimensions.get("window").width * 0.5,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.background,
      borderRadius: 10,
      marginVertical: 10,
    },
    loadingText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rMS(8),
    },
    dateContainer: {
      backgroundColor: themeColors.card,
      paddingHorizontal: rMS(12),
      paddingVertical: rMS(8),
      borderRadius: rMS(8),
      marginRight: rMS(12),
    },
    dateText: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: themeColors.text,
    },
    dayText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
      marginTop: rV(2),
    },
    emptyState: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(12),
      padding: rMS(10),
      flexDirection: "row",
      alignItems: "stretch",
      marginRight: rS(-40),
    },
    emptyText: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
      fontStyle: "italic",
    },
  });
};

export default Home;
