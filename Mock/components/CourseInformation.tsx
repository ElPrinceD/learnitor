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
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      if (response.status === 200) {
        setEnrolled(true);
      } else {
        console.error("Failed to enroll:", response);
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
    // Enable enroll button only if selectedTopics are received and user is not enrolled
    if (selectedTopics.length > 0 && !enrolled) {
      setEnrollDisabled(false);
    } else {
      setEnrollDisabled(true);
    }
  }, [selectedTopics, enrolled]);

  useEffect(() => {
    if (enrolled) {
      // Fetch user progress once enrolled (assuming there's an API to fetch progress)
      // Set progress based on the response
      const fakeProgress = 50; // Assuming progress is fetched from backend
      setProgress(fakeProgress);
    }
  }, [enrolled]);

  const handleContinue = () => {
    // Navigate to practice sessions page
    router.navigate("EnrolledCourse");
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
      borderColor: colorScheme === "dark" ? "#fff" : "#000",
      opacity: enrollDisabled ? 0.5 : 1,
    },
    continueButton: {
      backgroundColor: "#007bff",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
    progressContainer: {
      marginTop: 20,
    },
    progressBar: {
      height: 10,
      backgroundColor: "#ccc",
      borderRadius: 5,
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#007bff",
      borderRadius: 5,
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
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.3}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text>{`${progress}% Completed`}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.enrollButton}
            activeOpacity={0.3}
            onPress={enrollCourse}
            disabled={enrollDisabled}
          >
            <Text style={styles.buttonText}>Enroll</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CourseInformation;
