import { View, StyleSheet, Text, useColorScheme } from "react-native";
import React, { useState, useEffect } from "react";
import CoursesList from "../../components/CoursesList";
import { router } from "expo-router";
import axios from "axios";
import { Course } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ApiUrl from "../../config";
import Colors from "../../constants/Colors";

const GameCourses: React.FC = () => {
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [coursesData, setCoursesData] = useState<Course[]>([]);

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const course = await axios.get(`${ApiUrl}:8000/api/course/all/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      setCoursesData(course.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleCoursePress = (course: Course) => {
    router.navigate("GameTopics");
    router.setParams({
      course: JSON.stringify(course),
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 80,
      marginBottom: 20,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Course</Text>
      <CoursesList onCoursePress={handleCoursePress} courses={coursesData} />
    </View>
  );
};

export default GameCourses;
