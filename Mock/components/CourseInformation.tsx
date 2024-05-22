import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
} from "react-native";
import { router } from "expo-router";
import axios, { AxiosError } from "axios";
import { FontAwesome5 } from "@expo/vector-icons";
import ApiUrl from "../config";
import { useAuth } from "./AuthContext";

interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

interface Topic {
  title: string;
  description: string;
  id: string;
}

interface CourseInformationProps {
  course: Course;
  selectedTopics: Topic[];
  onContinue: () => void;
  setShowTopics: (value: boolean) => void;
  onEnrollmentStatusChange: (status: boolean) => void;
}

const CourseInformation: React.FC<CourseInformationProps> = ({
  course,
  selectedTopics,
  onContinue,
  setShowTopics,
  onEnrollmentStatusChange,
}) => {
  if (!course) {
    return (
      <View>
        <Text>No course data available</Text>
      </View>
    );
  }

  const colorScheme = useColorScheme();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { userToken, userInfo } = useAuth();
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [enrollDisabled, setEnrollDisabled] = useState<boolean>(true);
  const [enrollmentResponse, setEnrollmentResponse] = useState<any>(null);

  const handleShowMore = () => {
    setShowFullDescription(!showFullDescription);
  };
  const enrollCourse = async () => {
    setLoading(true);

    try {
      const topicIds = selectedTopics.map((topic) => topic.id); // Extract IDs from selectedTopics
      const response = await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/enroll/`,
        { selectedTopics: topicIds }, // Pass only the IDs of selected topics
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setEnrolled(true);
      setEnrollDisabled(true);
      setShowTopics(false);
      onEnrollmentStatusChange(true);
      setEnrollmentResponse(response.data.enrolled_topics); // Store the response data
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error("Failed to enroll:", axiosError.response.data);
      } else {
        console.error("Error enrolling:", axiosError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const unenrollCourse = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/unenroll/`,
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
      onEnrollmentStatusChange(false);
      console.log("Unenrollment response:", response.data);
    } catch (error) {
      console.error("Error unenrolling:", error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/progress/`,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/enrollment/`,
          {
            headers: {
              Authorization: `Token ${userToken?.token}`,
            },
          }
        );
        const userAlreadyEnrolled = response.data.enrolled;
        setEnrolled(userAlreadyEnrolled);
        setEnrollDisabled(userAlreadyEnrolled || selectedTopics.length === 0);
        onEnrollmentStatusChange(userAlreadyEnrolled);

        if (userAlreadyEnrolled) {
          await fetchProgress();
        }
      } catch (error) {
        console.error("Error fetching enrollment status:", error);
      }
    };

    fetchData();
  }, [userInfo, userToken, course.id, selectedTopics.length]);

  useEffect(() => {
    if (enrolled) {
      fetchProgress();
    }
  }, [enrolled]);

  useEffect(() => {
    // Enable enroll button if at least one topic is selected
    setEnrollDisabled(selectedTopics.length === 0);
  }, [selectedTopics]);

  const handleContinue = () => {
    router.navigate("EnrolledCourse");
    router.setParams({
      enrolledTopics: JSON.stringify(enrollmentResponse),
      course: JSON.stringify(course),
    });
  };

  const styles = StyleSheet.create({
    container: {
      padding: 0,
      //flexDirection: "row",
      backgroundColor: "transparernt",
      borderTopLeftRadius: 80,
      borderTopRightRadius: 70,
    },

    bodyContainer: {
      padding: 20,
      // backgroundColor: "blue",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },
    title: {
      fontSize: 24,
      justifyContent: "center",
      alignItems: "center",
      fontWeight: "bold",

      // borderTopLeftRadius: 30,
      // borderTopRightRadius: 3
      backgroundColor: "transparent",

      color: colorScheme === "dark" ? "#565050" : "#5c5a5a",
    },
    description: {
      fontSize: 18,
      marginBottom: 20,

      color: colorScheme === "dark" ? "#ccc" : "#1d1c1c",
    },
    showMore: {
      fontSize: 16,

      color: "#337ab7",
      // textDecorationLine: "underline",
    },
    imageContainer: {
      width: "100%",
      //margin: 20,
    },
    image: {
      height: 250,
    },
    buttonContainer: {
      flexDirection: "row",
      alignItems: "center",
      position: "absolute",
      top: 20,
      marginTop: 20,
    },
    enrollButton: {
      backgroundColor: enrollDisabled ? "#e6ac6a" : "#b5752c",
      paddingVertical: 15,

      paddingHorizontal: 20,
      borderRadius: 20,
      //borderWidth: 2,
      alignItems: "center",
      //borderColor: colorScheme === "dark" ? "#fff" : "#000",
      opacity: enrollDisabled ? 0.5 : 1,
    },
    continueButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      //borderWidth: 2,
      //borderColor: colorScheme === "dark" ? "#fff" : "#000",
      backgroundColor: "#b5752c",
      marginTop: -40,
      flexDirection: "row",
      justifyContent: "center", // Center the text horizontally
      width: "48%",
      marginRight: 10,
    },
    continueText: {
      color: colorScheme === "dark" ? "#fff" : "#000",
      fontSize: 16,
      fontWeight: "bold",
    },
    arrowIcon: {
      marginLeft: 5,
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    progressContainer: {
      marginTop: 70,
      flexDirection: "row",
      alignItems: "center",
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: "#ffffff",
      borderRadius: 5,
      marginRight: 10,
    },

    progressFill: {
      height: "100%",
      backgroundColor: colorScheme === "dark" ? "#e6ac6a" : "#e6ac6a",
      borderRadius: 5,
    },
    progressText: {
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
  });

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: course.url,
            }}
            style={styles.image}
            resizeMode="cover"
            onError={(error) => console.log("Image error:", error)}
          />
        </View>
        {/* <Text style={styles.title}>{course.title}</Text> */}
      </View>
      <View style={styles.bodyContainer}>
        <Text
          style={[
            {
              fontWeight: "bold",
              fontSize: 20,
              color: "#696868",
              paddingBottom: 8,
            },
          ]}
        >
          About Course:
        </Text>
        <View>
          <Text style={[styles.description, { flexWrap: "wrap" }]}>
            {showFullDescription
              ? course.description
              : `${course.description.substring(0, 100)}...`}
            <TouchableOpacity onPress={handleShowMore}>
              <Text style={styles.showMore}>
                {showFullDescription ? "Show less" : "Show more"}
              </Text>
            </TouchableOpacity>
          </Text>
        </View>

        {enrolled ? (
          <View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: "#e6ac6a",
                  },
                ]}
                activeOpacity={0.3}
                onPress={unenrollCourse}
              >
                <Text style={[styles.continueText]}>Unenroll</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.3}
                onPress={handleContinue}
              >
                <Text style={styles.continueText}>
                  Continue{" "}
                  <FontAwesome5
                    style={styles.arrowIcon}
                    name="arrow-alt-circle-right"
                    size={15}
                    color="black"
                  />
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.progressText}>
                {`${progress.toFixed(2)}% Completed`}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.enrollButton, { opacity: enrollDisabled ? 0.5 : 1 }]}
            activeOpacity={0.3}
            onPress={enrollCourse}
            disabled={enrollDisabled}
          >
            <Text style={styles.continueText}>Enroll</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CourseInformation;
