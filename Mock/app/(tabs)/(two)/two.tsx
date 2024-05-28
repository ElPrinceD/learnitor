import React, { useState, useEffect } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import axios from "axios";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Stack } from "expo-router";
import { Course, Category } from "../../../components/types";
import { router } from "expo-router";
import Colors from "../../../constants/Colors"; // Adjust the import path as necessary

const CoursesScreen: React.FC = () => {
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const colorScheme = useColorScheme();
  const { userToken } = useAuth();

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
      const categories = await axios.get(`${ApiUrl}:8000/api/category/all/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      setCoursesData(course.data);
      setFilteredCourses(course.data);
      setCategoryData(categories.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = (query: string) => {
    const filtered = coursesData.filter((course) =>
      course.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleCoursePress = (course: Course) => {
    router.navigate("CourseDetails");
    router.setParams({
      course: JSON.stringify(course),
    });
  };

  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: themeColors.background, // Add background color for the container
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "What do you want to learn today?",
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleStyle: {
            color: themeColors.text,
          },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <SearchBar onSearch={handleSearch} />
        <CoursesList
          courses={filteredCourses}
          categories={categoryData}
          onCoursePress={handleCoursePress}
        />
      </View>
    </>
  );
};

export default CoursesScreen;
