import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated as RNAnimated, // Alias for react-native's Animated
  useColorScheme,
  Dimensions,
} from "react-native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated"; // Import react-native-reanimated
import { useLocalSearchParams, router, Stack } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import Toast from "react-native-root-toast";
import Colors from "../../../constants/Colors";
import { SIZES, rS, rV } from "../../../constants";
import { useNavigation } from "@react-navigation/native";

const CourseDetails: React.FC = () => {
  const { course } = useLocalSearchParams();
  const { userToken, userInfo } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [enrollDisabled, setEnrollDisabled] = useState<boolean>(true);
  const [enrollmentResponse, setEnrollmentResponse] = useState<any>(null);
  const navigation = useNavigation();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/course/${parsedCourse.id}/topics/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    const fetchEnrollmentStatus = async () => {
      try {
        const response = await axios.get(
          `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/enrollment/`,
          {
            headers: {
              Authorization: `Token ${userToken?.token}`,
            },
          }
        );

        const userAlreadyEnrolled = response.data.enrolled;
        setEnrolled(userAlreadyEnrolled);
        setEnrollDisabled(userAlreadyEnrolled || selectedTopics.length === 0);

        if (userAlreadyEnrolled) {
          await fetchProgress();
        }
      } catch (error) {
        console.error("Error fetching enrollment status:", error);
      }
    };

    fetchEnrollmentStatus();
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/progress/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setProgress(response.data.course_progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const handleContinue = () => {
    router.navigate("EnrolledCourse");
    router.setParams({
      enrolledTopics: JSON.stringify(enrollmentResponse),
      course: JSON.stringify(parsedCourse),
    });
  };

  const handleSelectedTopicsChange = (selectedTopics: Topic[]) => {
    setSelectedTopics(selectedTopics);
  };

  const enrollCourse = async () => {
    setLoading(true);
    try {
      const topicIds = selectedTopics.map((topic) => topic.id);
      const response = await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/enroll/`,
        { selectedTopics: topicIds },
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setEnrolled(true);
      setEnrollDisabled(true);
      setEnrollmentResponse(response.data.enrolled_topics);
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setLoading(false);
    }
  };

  const unenrollCourse = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${parsedCourse.id}/unenroll/`,
        {},
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setEnrolled(false);
      setEnrollDisabled(false);
      setEnrollmentResponse(null);
      setProgress(0);
    } catch (error) {
      console.error("Error unenrolling:", error);
    }
  };
  useEffect(() => {
    // Enable enroll button if at least one topic is selected
    setEnrollDisabled(selectedTopics.length === 0);
  }, [selectedTopics]);

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

  const { height } = Dimensions.get("window");
  const φ = (1 + Math.sqrt(5)) / 2;
  const MIN_HEADER_HEIGHT = 64 + Constants.statusBarHeight;
  const MAX_HEADER_HEIGHT = height * (1 - 1 / φ);
  const HEADER_DELTA = MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT;
  const HEADER_BETA = MAX_HEADER_HEIGHT - HEADER_DELTA;

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
    extrapolateRight: "clamp",
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      ...StyleSheet.absoluteFillObject,
    },
    headerTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.icon,
      alignContent: "center",
      marginVertical: rV(10),
    },

    // scrollViewContent: {
    //   flexGrow: 1,
    // },
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
  });

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
            backgroundColor: themeColors.gradientBackground,
            opacity: imageOpacity,
          }}
        />
      </RNAnimated.View>
      <RNAnimated.ScrollView
        // contentContainerStyle={styles.scrollViewContent}
        scrollEventThrottle={1}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.cover}>
          <RNAnimated.View
            style={[styles.gradient, { height: courseTitleHeight }]}
          >
            <LinearGradient
              style={StyleSheet.absoluteFill}
              start={[0, 0.3]}
              end={[0, 1.1]}
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
          <CourseInformation
            course={parsedCourse}
            enrollCourse={enrollCourse}
            unenrollCourse={unenrollCourse}
            progress={progress}
            enrolled={enrolled}
            enrollDisabled={enrollDisabled}
            onEnrollDisabledPress={handleEnrolledDisabledPress}
            handleContinue={handleContinue}
            topics={topics}
          />
          <CourseTopics
            topics={topics}
            selectedTopics={selectedTopics}
            onSelectedTopicsChange={handleSelectedTopicsChange}
          />
        </Animated.View>
        {selectedTopics.map((topic) => (
          <View key={topic.id}></View>
        ))}
      </RNAnimated.ScrollView>
    </View>
  );
};

export default CourseDetails;
