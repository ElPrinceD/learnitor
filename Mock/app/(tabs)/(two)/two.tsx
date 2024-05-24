import React, { useState, useEffect } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import axios from "axios";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Course, Category } from "../../../components/types";
import { router } from "expo-router";

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#ffffff",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    backgroundGradient: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    topContainer: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      height: "10.33%",
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "What do you want to learn today?",
          headerStyle: {
            backgroundColor: "#fdecd2",
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
