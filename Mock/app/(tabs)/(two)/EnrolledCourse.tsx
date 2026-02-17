import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  useColorScheme,
  RefreshControl,
  BackHandler,
  Text,
  ActivityIndicator,
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
} from "../../../services/CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";

const EnrolledCourse: React.FC = () => {
  const { userToken, userInfo } = useAuth();
  const { course } = useLocalSearchParams();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message
  const [progress, setProgress] = useState<number>(0);
  const [componentError, setComponentError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // Add error boundary for the component
  useEffect(() => {
    const handleError = (error: Error) => {
      console.error("Component error:", error);
      setComponentError(error.message);
    };

    // Add global error handler for this component
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0]?.toString().includes("EnrolledCourse")) {
        handleError(new Error(args[0].toString()));
      }
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Debug logs removed - issue was React Hooks violation in CourseRoadmap

  const parsedCourse: Course | null = useMemo(() => {
    try {
      if (!course) {
        return null;
      }
      const parsed = typeof course === "string" ? JSON.parse(course) : course;

      // Validate that the parsed course has required properties
      if (!parsed || typeof parsed !== "object") {
        console.error("Invalid course object:", parsed);
        return null;
      }

      if (!parsed.id) {
        console.error("Course missing ID:", parsed);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing course:", error);
      console.error("Course value that failed to parse:", course);
      return null;
    }
  }, [course]);

  // Handle back navigation - go back to course list
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back(); // This will go back to the course list
        return true; // Prevent default back action
      }
    );
    return () => backHandler.remove();
  }, []);

  // Early return if no course data
  if (!parsedCourse) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <ErrorMessage
          message="Course data not found. Please try again."
          visible={true}
          onDismiss={() => router.back()}
        />
      </View>
    );
  }

  // Early return if user info or token is missing
  if (!userInfo?.user?.id || !userToken?.token) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <ErrorMessage
          message="Authentication required. Please log in again."
          visible={true}
          onDismiss={() => router.back()}
        />
      </View>
    );
  }

  // Show loading state while course is being parsed
  if (!parsedCourse) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  const {
    status: enrolledTopicsStatus,
    data: enrolledTopics,
    error: enrolledTopicsError,
    refetch: refetchTopics,
  } = useQuery({
    queryKey: ["enrolledCourseTopics", parsedCourse?.id, userToken?.token],
    queryFn: () =>
      getEnrolledCourseTopics(
        Number(userInfo?.user.id) || 0,
        Number(parsedCourse?.id) || 0,
        userToken?.token
      ),
    enabled: !!parsedCourse?.id && !!userInfo?.user?.id && !!userToken?.token,
    retry: (failureCount, error) => {
      // Don't retry if user is not enrolled (404 or similar)
      if ((error as any)?.status === 404 || (error as any)?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Early return if user is not enrolled (404/403 error)
  if (
    enrolledTopicsError &&
    ((enrolledTopicsError as any)?.status === 404 ||
      (enrolledTopicsError as any)?.status === 403)
  ) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <ErrorMessage
          message="You are not enrolled in this course. Please enroll first."
          visible={true}
          onDismiss={() => router.back()}
        />
      </View>
    );
  }

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
          Number(userInfo.user.id),
          Number(parsedCourse.id),
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

  useEffect(() => {
    if (enrolledTopicsError) {
      // Handle specific error cases
      if (
        (enrolledTopicsError as any)?.status === 404 ||
        (enrolledTopicsError as any)?.status === 403
      ) {
        setErrorMessage(
          "You are not enrolled in this course. Please enroll first."
        );
      } else {
        setErrorMessage(
          enrolledTopicsError.message || "Failed to load enrolled topics"
        );
      }
    }
  }, [enrolledTopicsError]);

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
      pathname: "PracticeInstructions",
      params: {
        topic: JSON.stringify(topic),
        course: course,
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "enrolledCourseTopics",
            parsedCourse?.id,
            userToken?.token,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
        }),
      ]);
    } catch (error) {
      console.error("Error during refresh:", error);
      setErrorMessage("Failed to refresh data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, userInfo?.user.id, parsedCourse.id, userToken?.token]);

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
  const containerStyle = useMemo(
    () => ({ backgroundColor: themeColors.text, height: 7 }),
    []
  );
  const fillStyle = useMemo(() => ({ backgroundColor: themeColors.icon }), []);

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
              containerStyle={containerStyle}
              fillStyle={fillStyle}
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

  // Show component error if any
  if (componentError) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <ErrorMessage
          message={`Component Error: ${componentError}`}
          visible={true}
          onDismiss={() => {
            setComponentError(null);
            router.back();
          }}
        />
      </View>
    );
  }

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
          {enrolledTopicsStatus === "pending" ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <ActivityIndicator size="large" color={themeColors.tint} />
            </View>
          ) : enrolledTopicsError ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                Failed to load topics. Pull to refresh.
              </Text>
            </View>
          ) : enrolledTopics && enrolledTopics.length > 0 ? (
            <CourseRoadmap
              enrolledTopics={enrolledTopics}
              // course={parsedCourse}
              handleTopicPress={handleTopicPress}
              handleQuestionPress={handleQuestionPress}
            />
          ) : enrolledTopics && enrolledTopics.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                No topics enrolled yet. Please enroll in some topics first.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </>
  );
};

export default EnrolledCourse;
