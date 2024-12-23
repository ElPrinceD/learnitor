import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Animated as RNAnimated,
  useColorScheme,
  Dimensions,
  RefreshControl,
} from "react-native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Toast from "react-native-root-toast";
import Colors from "../../../constants/Colors";
import { SIZES, rS, rV } from "../../../constants";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../QueryClient";
import {
  getCourseTopics,
  getEnrollmentStatus,
  enrollInCourse,
  unenrollFromCourse,
  getCourseProgress,
} from "../../../CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import { Topic, Course } from "../../../components/types";

const CourseDetails: React.FC = () => {
  const { course } = useLocalSearchParams();
  const { userToken, userInfo } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  const {
    status: topicsStatus,
    data: topics,
    error: topicsError,
    refetch: refetchTopics,
  } = useQuery({
    queryKey: ["courseTopics", parsedCourse?.id],
    queryFn: () => getCourseTopics(parsedCourse?.id, userToken?.token),
    enabled: !!parsedCourse?.id,
  });

  const {
    status: enrollmentStatus,
    data: enrollmentData,
    error: enrollmentError,
    refetch: refetchEnrollmentStatus,
  } = useQuery({
    queryKey: ["enrollmentStatus", userInfo?.user?.id, parsedCourse?.id],
    queryFn: () =>
      getEnrollmentStatus(
        userInfo?.user?.id,
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
      if (
        userAlreadyEnrolled &&
        parsedCourse?.id &&
        userInfo?.user?.id &&
        userToken?.token
      ) {
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

  const userAlreadyEnrolled = enrollmentData?.enrolled;
  const [enrollDisabled, setEnrollDisabled] = useState<boolean>(
    userAlreadyEnrolled || selectedTopics.length === 0
  );

  const enrollMutation = useMutation<any, any, any, any>({
    mutationFn: async ({ userId, courseId, topicIds, token }) => {
      const response = await enrollInCourse(userId, courseId, topicIds, token);
      return response.enrolled_topics;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["enrollmentStatus", userInfo?.user?.id, parsedCourse?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
      });
      setErrorMessage(null); // Clear error message on successful enrollment
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error enrolling in course");
    },
  });

  const unenrollMutation = useMutation<any, any, any, any>({
    mutationFn: async ({ userId, courseId, token }) => {
      await unenrollFromCourse(userId, courseId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["enrollmentStatus", userInfo?.user?.id, parsedCourse?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
      });
      setErrorMessage(null); // Clear error message on successful unenrollment
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error unenrolling from course");
    },
  });

  useEffect(() => {
    if (progressError) {
      setErrorMessage(progressError.message || "An error occurred");
    } else if (courseProgress) {
      setProgress(courseProgress);
    }
  }, [courseProgress, progressError]);

  useEffect(() => {
    if (topicsError || enrollmentError || progressError) {
      setErrorMessage(
        topicsError?.message ||
          enrollmentError?.message ||
          progressError?.message ||
          "An error occurred"
      );
    }
  }, [topicsError, enrollmentError, progressError]);

  const handleEnrollCourse = () => {
    const topicIds = selectedTopics.map((topic) => topic.id);
    enrollMutation.mutate({
      userId: userInfo?.user?.id,
      courseId: parsedCourse?.id,
      topicIds,
      token: userToken?.token,
    });
    setEnrollDisabled(false);
  };

  const handleUnenrollCourse = () => {
    unenrollMutation.mutate({
      userId: userInfo?.user?.id,
      courseId: parsedCourse?.id,
      token: userToken?.token,
    });
  };

  const handleContinue = () => {
    router.navigate("EnrolledCourse");
    router.setParams({
      course: JSON.stringify(parsedCourse),
    });
  };

  const handleSelectedTopicsChange = (selectedTopics: Topic[]) => {
    setSelectedTopics(selectedTopics);
  };

  const handleEnrolledDisabledPress = () => {
    if (enrollDisabled) {
      Toast.show("Select at least one topic", {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        opacity: 0.8,
      });
    }
  };

  useEffect(() => {
    setEnrollDisabled(selectedTopics.length === 0);
  }, [selectedTopics]);

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["courseTopics", parsedCourse?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["enrollmentStatus", userInfo?.user?.id, parsedCourse?.id],
    });
  }, [parsedCourse?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["courseTopics", parsedCourse?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", userInfo?.user?.id, parsedCourse?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrollmentStatus", userInfo?.user?.id, parsedCourse?.id],
      });
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userInfo?.user.id, parsedCourse.id]);

  const { height } = Dimensions.get("window");
  const φ = (1 + Math.sqrt(5)) / 2;
  const MIN_HEADER_HEIGHT = 64 + Constants.statusBarHeight;
  const MAX_HEADER_HEIGHT = height * (1 - 1 / φ);
  const HEADER_DELTA = MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT;

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HEADER_DELTA - 8, HEADER_DELTA - 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_DELTA - 16, HEADER_DELTA],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [-64, 0, HEADER_DELTA],
    outputRange: [0, 0.1, 1],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-MAX_HEADER_HEIGHT, 0],
    outputRange: [4, 1],
    extrapolate: "clamp",
  });

  const courseTitleOpacity = scrollY.interpolate({
    inputRange: [-MAX_HEADER_HEIGHT / 2, 0, MAX_HEADER_HEIGHT / 2],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  const courseTitleHeight = scrollY.interpolate({
    inputRange: [-MAX_HEADER_HEIGHT, -48 / 2],
    outputRange: [0, MAX_HEADER_HEIGHT + 48],
    extrapolate: "clamp",
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          ...StyleSheet.absoluteFillObject,
          backgroundColor: themeColors.background,
        },
        headerTitle: {
          fontSize: SIZES.large,
          fontWeight: "bold",
          color: themeColors.icon,
          alignContent: "center",
          marginVertical: rV(10),
        },
        imageContainer: {
          ...StyleSheet.absoluteFillObject,
          height: MAX_HEADER_HEIGHT,
        },
        image: {
          ...StyleSheet.absoluteFillObject,
        },
        gradient: {
          position: "absolute",
          left: 0,
          bottom: rV(-5),
          right: 0,
          alignItems: "center",
        },
        cover: {
          height: MAX_HEADER_HEIGHT,
        },
        courseTitleContainer: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: "flex-end",
          alignItems: "flex-start",
        },
        courseTitle: {
          textAlign: "left",
          marginLeft: rS(17),
          color: "#fff",
          fontSize: SIZES.xxxLarge,
          fontWeight: "bold",
        },
      }),
    [themeColors.icon, rV, rS, SIZES, MAX_HEADER_HEIGHT]
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <RNAnimated.Text
            style={[
              styles.headerTitle,
              {
                opacity: headerTitleOpacity,
                textAlign: "center",
              },
            ]}
          >
            {parsedCourse.title}
          </RNAnimated.Text>
        </View>
      ),
      headerShown: true,
      headerTitleStyle: {
        fontWeight: "bold",
      },
      headerBackTitleVisible: false,
      headerShadowVisible: false,
      headerTitleAlign: "center",
      headerBackground: () => (
        <RNAnimated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: themeColors.background,
            opacity: headerOpacity,
          }}
        />
      ),
    });
  }, [navigation, headerTitleOpacity, headerOpacity]);

  return (
    <View style={styles.container}>
      <RNAnimated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateY: imageTranslateY }],
          },
        ]}
      >
        <Animated.Image
          source={{ uri: parsedCourse.url }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => console.log("Image error:", error)}
        />
        <RNAnimated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: themeColors.background,
            opacity: imageOpacity,
          }}
        />
      </RNAnimated.View>
      <RNAnimated.ScrollView
        scrollEventThrottle={1}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
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
        <View style={styles.cover}>
          <RNAnimated.View
            style={[styles.gradient, { height: courseTitleHeight }]}
          >
            <LinearGradient
              style={StyleSheet.absoluteFill}
              start={[0, 0.3]}
              end={[0, 2]}
              colors={["transparent", "rgba(0, 0, 0, 0.2)", "#000"]}
            />
          </RNAnimated.View>
          <View style={styles.courseTitleContainer}>
            <RNAnimated.Text
              style={[styles.courseTitle, { opacity: courseTitleOpacity }]}
            >
              {parsedCourse.title}
            </RNAnimated.Text>
          </View>
        </View>
        <Animated.View
          entering={FadeInDown.delay(400)
            .randomDelay()
            .reduceMotion(ReduceMotion.Never)}
        >
          {topics && enrollmentData && (
            <CourseInformation
              course={parsedCourse}
              enrollCourse={handleEnrollCourse}
              unenrollCourse={handleUnenrollCourse}
              progress={progress}
              enrolled={enrollmentData.enrolled}
              enrollDisabled={enrollDisabled}
              onEnrollDisabledPress={handleEnrolledDisabledPress}
              handleContinue={handleContinue}
              topics={topics}
              enrollLoading={enrollMutation.isPending}
              unEnrollLoading={unenrollMutation.isPending}
            />
          )}
          {topics && (
            <CourseTopics
              topics={topics}
              selectedTopics={selectedTopics}
              onSelectedTopicsChange={handleSelectedTopicsChange}
            />
          )}
        </Animated.View>
        {selectedTopics.map((topic) => (
          <View key={topic.id} />
        ))}
      </RNAnimated.ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage} // Control visibility based on errorMessage state
        onDismiss={() => setErrorMessage(null)} // Clear error message when dismissed
      />
    </View>
  );
};

export default CourseDetails;