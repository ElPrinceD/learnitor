import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";

import { router } from "expo-router";
import axios from "axios";

import { Course } from "./types";
import ApiUrl from "../config";
import { useAuth } from "./AuthContext";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";

interface Props {
  enrolledCoursesData: Course[];
}

const EnrolledCoursesList: React.FC<Props> = ({ enrolledCoursesData }) => {
  const { userToken, userInfo } = useAuth();
  const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({});
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    // Fetch progress for each enrolled course
    const fetchProgress = async () => {
      const progressPromises = enrolledCoursesData.map(async (course) => {
        try {
          const response = await axios.get(
            `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/course/${course.id}/progress/`,
            {
              headers: {
                Authorization: `Token ${userToken?.token}`,
              },
            }
          );
          return {
            courseId: course.id,
            progress: response.data.course_progress,
          };
        } catch (error) {
          console.error("Error fetching progress:", error);
          return { courseId: course.id, progress: 0 };
        }
      });

      // Wait for all progress fetch requests to complete
      const progressResults = await Promise.all(progressPromises);

      // Update progress map with fetched progress data
      const updatedProgressMap: { [key: string]: number } = {};
      progressResults.forEach((result) => {
        updatedProgressMap[result.courseId] = result.progress;
      });
      setProgressMap(updatedProgressMap);
    };

    fetchProgress();
  }, [enrolledCoursesData, userToken, userInfo]);

  const styles = StyleSheet.create({
    container: {
      margin: 5,
      alignItems: "flex-start",
      position: "relative",
      flex: 1,
    },
    touchable: {
      borderRadius: 10,
      overflow: "hidden",
    },
    imageContainer: {
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: 150,
      height: 150,
    },

    textContainer: {
      position: "absolute",
      bottom: 10,
      left: 10,
      right: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
      textAlign: "left",
      marginBottom: 5,
      textShadowColor: themeColors.shadow,
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
  });

  return (
    <FlatList
      horizontal
      data={enrolledCoursesData}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            router.navigate({
              pathname: "/EnrolledCourse",
              params: { course: JSON.stringify(item) },
            });
          }}
          activeOpacity={0.5}
          style={styles.touchable}
        >
          <View style={styles.container}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.url }} style={styles.image} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {item.title}
              </Text>
              <ProgressBar
                progress={progressMap[item.id] || 0}
                containerStyle={{
                  backgroundColor: themeColors.text,
                  height: 7,
                }}
                fillStyle={{ backgroundColor: themeColors.icon }}
              />
            </View>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default EnrolledCoursesList;
