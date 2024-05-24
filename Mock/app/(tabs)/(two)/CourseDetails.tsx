import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";
import { LinearGradient } from "expo-linear-gradient";

const CourseDetails: React.FC = () => {
  const { course } = useLocalSearchParams();
  const { userToken, userInfo } = useAuth();
  const [selectedTopicCount, setSelectedTopicCount] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectedMiniTitle, setSelectedMiniTitle] = useState<string>("");
  const [showTopics, setShowTopics] = useState(true);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [enrollDisabled, setEnrollDisabled] = useState<boolean>(true);
  const [enrollmentResponse, setEnrollmentResponse] = useState<any>(null);
  const [showFullDescription, setShowFullDescription] = useState(false); // New state for description

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

  const handleShowMore = () => {
    setShowFullDescription(!showFullDescription);
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
    setSelectedTopicCount(selectedTopics.length);
  };

  const handleMiniTitleSelect = (title: string) => {
    setSelectedMiniTitle(title);
  };

  const handleEnrollmentStatusChange = (status: boolean) => {
    setShowTopics(!status);
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
      setShowTopics(false);
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
      setShowTopics(true);
    } catch (error) {
      console.error("Error unenrolling:", error);
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#fdecd2"]} style={styles.container}>
      <CourseInformation
        course={parsedCourse}
        enrollCourse={enrollCourse}
        unenrollCourse={unenrollCourse}
        progress={progress}
        enrolled={enrolled}
        enrollDisabled={enrollDisabled}
        showFullDescription={showFullDescription}
        handleShowMore={handleShowMore}
        handleContinue={handleContinue}
      />
      <View style={styles.miniTitles}>
        <View style={styles.topicCountContainer}>
          {showTopics && (
            <TouchableOpacity onPress={() => handleMiniTitleSelect("Topics")}>
              <Text
                style={[
                  styles.miniText,
                  selectedMiniTitle === "Topics" && styles.selectedMiniTitle,
                  { paddingHorizontal: 40 },
                ]}
              >
                Topics{" "}
                {selectedTopicCount > 0 && `(${selectedTopicCount} Selected)`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <CourseTopics
        topics={topics}
        selectedTopics={selectedTopics}
        onSelectedTopicsChange={handleSelectedTopicsChange}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {selectedTopics.map((topic) => (
          <View key={topic.id}></View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopEndRadius: 20,
    borderTopLeftRadius: 20,
  },
  topicCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countText: {
    paddingHorizontal: 10,
    color: "#8e8e8e",
    fontWeight: "bold",
    paddingVertical: 15,
    fontSize: 15,
  },
  miniTitles: {
    borderBottomColor: "#bababa",
    marginTop: -20,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderWidth: 1,
  },
  miniText: {
    paddingHorizontal: 10,
    color: "#8e8e8e",
    fontWeight: "bold",
    paddingVertical: 15,
    fontSize: 15,
  },
  selectedMiniTitle: {
    borderBottomColor: "#9a580d",
    borderBottomWidth: 2.5,
    borderRadius: 7,
  },
  inline: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 15,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
});

export default CourseDetails;
