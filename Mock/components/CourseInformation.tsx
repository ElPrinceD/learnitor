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
  id: string;
  url: string;
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
  const colorScheme = useColorScheme();
  const [enrolled, setEnrolled] = useState(false); // Track if user is enrolled
  const [progress, setProgress] = useState(0); // Progress of the user
  const [loading, setLoading] = useState(false);
  const [enrollDisabled, setEnrollDisabled] = useState(true); // Disable enroll button initially
  const { userToken, userInfo } = useAuth();

  const enrollCourse = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      if (response.status === 200) {
        setEnrolled(true);
        setEnrollDisabled(true); // Disable enroll button after successful enrollment
      } else {
        console.error("Failed to enroll:", response.data.detail);
      }
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

  useEffect(() => {
    // Check if the user is already enrolled in the course
    // You can implement this logic based on your application's requirements
    // For example, you can fetch the user's enrollment status from the backend
    const userAlreadyEnrolled = true; // Replace this with your actual logic to check if the user is enrolled
    setEnrolled(userAlreadyEnrolled);
    setEnrollDisabled(userAlreadyEnrolled); // Disable enroll button if user is already enrolled
  }, []);

  useEffect(() => {
    if (enrolled) {
      // Fetch user progress once enrolled (assuming there's an API to fetch progress)
      // Set progress based on the response
      const fakeProgress = 35; // Assuming progress is fetched from backend
      setProgress(fakeProgress);
    }
  }, [enrolled]);

  const handleContinue = () => {
    // Navigate to practice sessions page
    router.navigate("EnrolledCourse");
    router.setParams({
      selectedTopics: JSON.stringify(selectedTopics),
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
      flex: 1,
      backgroundColor: "transparent",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colorScheme === "dark" ? "#fff" : "#000",

      marginTop: -20,
      flexDirection: "row",
      justifyContent: "center", // Center the text horizontally
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
              <Text
                style={styles.progressText}
              >{`${progress}% Completed`}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.enrollButton}
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
