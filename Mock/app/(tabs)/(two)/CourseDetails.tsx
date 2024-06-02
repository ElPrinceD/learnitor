import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Image, Animated } from "react-native";
// import Animated from "react-native-reanimated";
import { Dimensions } from "react-native";
import Constants from "expo-constants";
import { useLocalSearchParams, router, Stack } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import Toast from "react-native-root-toast";

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

  const scrollY = useRef(new Animated.Value(0)).current;

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

  const imageOpacity = scrollY.interpolate({
    inputRange: [-64, 0, HEADER_DELTA],
    outputRange: [0, 0.2, 1],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-MAX_HEADER_HEIGHT, 0],
    outputRange: [4, 1],
    extrapolateRight: "clamp",
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      borderTopEndRadius: 20,
      borderTopLeftRadius: 20,
    },

    icon: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 15,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    imageContainer: {
      width: "100%",
      zIndex: 1,
    },

    image: {
      height: 250,
    },
  });

  return (
    // <View style={styles.container}>
    <Animated.ScrollView
      // style={{ transform: [{ translateY: HEADER_DELTA }] }}
      contentContainerStyle={styles.scrollViewContent}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
    >
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: imageOpacity,
            transform: [{ translateY: imageTranslateY }],
          },
        ]}
      >
        <Image
          source={{ uri: parsedCourse.url }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => console.log("Image error:", error)}
        />
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "black",
            opacity: imageOpacity,
          }}
        />
      </Animated.View>
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
      {selectedTopics.map((topic) => (
        <View key={topic.id}></View>
      ))}
    </Animated.ScrollView>
    // </View>
  );
};

export default CourseDetails;
