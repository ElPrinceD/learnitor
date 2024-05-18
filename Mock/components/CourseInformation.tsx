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
}

const CourseInformation: React.FC<CourseInformationProps> = ({
  course,
  selectedTopics,
}) => {
  if (!course) {
    return (
      <View>
        <Text>No course data available</Text>
      </View>
    );
  }

  const colorScheme = useColorScheme();
  const { userToken, userInfo } = useAuth();
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [enrollDisabled, setEnrollDisabled] = useState<boolean>(true);
  const [enrollmentResponse, setEnrollmentResponse] = useState<any>(null); // State to hold enrollment response

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
      setProgress(0); // Reset progress to 0 on unenroll
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
        setEnrollDisabled(userAlreadyEnrolled || selectedTopics.length === 0); // Disable enroll button if user is already enrolled or no topic is selected

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
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    description: {
      fontSize: 18,
      marginBottom: 20,
      color: colorScheme === "dark" ? "#ccc" : "#777",
    },
    imageContainer: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 10,
    },
    image: {
      width: "30%",
      height: 100,
    },
    buttonContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
    },
    enrollButton: {
      backgroundColor: enrollDisabled ? "#ccc" : "transparent",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: "center",
      borderColor: colorScheme === "dark" ? "#fff" : "#000",
      opacity: enrollDisabled ? 0.5 : 1,
    },
    continueButton: {
      backgroundColor: "transparent",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colorScheme === "dark" ? "#fff" : "#000",
      marginTop: -20,
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
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: "#ccc",
      borderRadius: 5,
      marginRight: 10,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colorScheme === "dark" ? "#fff" : "#000",
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
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>

        {enrolled ? (
          <View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.3}
                onPress={unenrollCourse}
              >
                <Text style={styles.continueText}>Unenroll</Text>
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
