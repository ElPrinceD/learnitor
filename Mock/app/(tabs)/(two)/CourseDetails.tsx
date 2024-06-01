import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
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
    scrollViewContainer: {
      flexGrow: 1,
      zIndex: 2,
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
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: parsedCourse.url }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => console.log("Image error:", error)}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
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
      </ScrollView>
    </View>
  );
};

export default CourseDetails;
