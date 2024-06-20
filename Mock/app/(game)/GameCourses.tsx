import { View, StyleSheet, Text, useColorScheme } from "react-native";
import React, { useState, useEffect } from "react";
import CoursesList from "../../components/CoursesList";
import { router } from "expo-router";
import axios from "axios";
import { Course } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ApiUrl from "../../config";
import Colors from "../../constants/Colors";
import { SIZES, rV } from "../../constants";

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
      const course = await axios.get(`${ApiUrl}/api/course/all/`, {
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
      marginTop: rV(55),
    },
    header: {
      flex: 1,
      color: themeColors.text,
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginTop: rV(8),
      marginBottom: rV(10),
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
