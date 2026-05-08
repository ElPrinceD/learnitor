import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  useColorScheme,
  RefreshControl,
  ScrollView,
  Dimensions,
  StatusBar,
  View as RNView,
  Text as RNText,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Animated, { FadeInDown } from "react-native-reanimated";
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
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // One-time animation flag
  const hasAnimated = useRef(false);
  useEffect(() => {
    hasAnimated.current = true;
  }, []);
  const enterAnim = (delay: number) =>
    hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay);

  const token = userToken?.token;
  const userId = userInfo?.user?.id;

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

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
    const month = today.toLocaleDateString("en-US", { month: "long" });
    const year = today.getFullYear();
    return { dayOfWeek, dayOfMonth, month, year };
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(20), insets.top + rV(12)),
      paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
    },

    // Greeting hero card — matches Play's scoreCardOuter pattern
    heroOuter: {
      borderRadius: rMS(24),
      overflow: "hidden",
      marginBottom: rV(16),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      ...shadow.medium,
    },
    heroInner: {
      backgroundColor: themeColors.tint + "08",
      padding: rMS(22),
      paddingBottom: rMS(18),
      position: "relative",
    },
    heroStripe: {
      position: "absolute",
      top: -rV(10),
      right: -rS(40),
      width: rS(200),
      height: rS(200),
      borderRadius: rS(100),
      backgroundColor: themeColors.tint + "0C",
      transform: [{ scaleX: 1.5 }],
    },
    heroAccent: {
      position: "absolute",
      bottom: -rV(20),
      left: -rS(20),
      width: rS(80),
      height: rS(80),
      borderRadius: rS(40),
      backgroundColor: themeColors.tint + "10",
    },
    heroGreeting: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      letterSpacing: 0.5,
      marginBottom: rV(6),
    },
    heroName: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.5,
      lineHeight: rMS(34),
    },
    heroDateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: rV(14),
    },
    heroDate: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: themeColors.textSecondary,
    },
    heroQuote: {
      fontSize: rMS(11),
      fontWeight: "600",
      color: themeColors.textSecondary + "BB",
      fontStyle: "italic",
      maxWidth: "60%",
      textAlign: "right",
    },

    // Section spacing
    sectionContainer: {
      marginBottom: rV(20),
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(14),
    },
    sectionTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    sectionSeeAll: {
      fontSize: SIZES.small,
      color: themeColors.tint,
      fontWeight: "700",
    },

    // Tasks section wrapper
    tasksSection: {
      marginBottom: rV(16),
    },
    tasksSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(14),
    },
    taskCountBadge: {
      backgroundColor: themeColors.tint + "15",
      paddingHorizontal: rMS(10),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    taskCountText: {
      fontSize: rMS(11),
      fontWeight: "800",
      color: themeColors.tint,
    },

    // Carousel loading state
    loadingContainer: {
      height: 230,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },

    // Quote card for empty tasks
    quoteCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      alignItems: "center",
    },
    quoteText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      fontStyle: "italic",
      lineHeight: rMS(20),
      fontWeight: "600",
    },
  });

  return (
    <RNView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
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
        {/* Greeting Hero Card */}
        <Animated.View entering={enterAnim(50)}>
          <RNView style={styles.heroOuter}>
            <RNView style={styles.heroInner}>
              {/* Background art */}
              <RNView style={styles.heroStripe} />
              <RNView style={styles.heroAccent} />

              <RNText style={styles.heroGreeting}>
                {greeting} 👋
              </RNText>
              <RNText style={styles.heroName}>
                {userInfo?.user?.first_name || "Learner"}
              </RNText>

              <RNView style={styles.heroDateRow}>
                <RNText style={styles.heroDate}>
                  {todayDate.dayOfWeek}, {todayDate.dayOfMonth} {todayDate.month}
                </RNText>
                <RNText style={styles.heroQuote} numberOfLines={4}>
                  "{randomQuote}"
                </RNText>
              </RNView>
            </RNView>
          </RNView>
        </Animated.View>

        {/* Announcements Carousel */}
        {announcementsLoading ? (
          <Animated.View entering={enterAnim(100)}>
            <RNView style={styles.loadingContainer} />
          </Animated.View>
        ) : carouselItems.length > 0 ? (
          <Animated.View entering={enterAnim(100)}>
            <ReanimatedCarouselWithAds data={carouselItems} />
          </Animated.View>
        ) : null}

        {/* Courses Section */}
        <Animated.View entering={enterAnim(200)} style={styles.sectionContainer}>
          {enrolledCoursesData?.length ? (
            <EnrolledCoursesList
              enrolledCoursesData={enrolledCoursesData}
              progressMap={progressMap || {}}
              loading={enrolledLoading}
            />
          ) : (
            <EnrolledCoursesList
              enrolledCoursesData={recommendedCourses}
              progressMap={{}}
              loading={coursesLoading}
              isRecommended={true}
            />
          )}
        </Animated.View>

        {/* Tasks Section */}
        <Animated.View entering={enterAnim(300)} style={styles.tasksSection}>
          <RNView style={styles.tasksSectionHeader}>
            <RNText style={styles.sectionTitle}>Today's Tasks</RNText>
            <RNView style={styles.taskCountBadge}>
              <RNText style={styles.taskCountText}>
                {tasksData.tasks.length} {tasksData.tasks.length === 1 ? "task" : "tasks"}
              </RNText>
            </RNView>
          </RNView>

          {tasksData.tasks.length > 0 ? (
            <TaskList
              tasks={tasksData.tasks}
              categoryNames={tasksData.categories}
            />
          ) : (
            <TaskList
              tasks={[]}
              categoryNames={{}}
            />
          )}
        </Animated.View>
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={useCallback(() => setErrorMessage(null), [])}
      />
    </RNView>
  );
};

export default Home;
