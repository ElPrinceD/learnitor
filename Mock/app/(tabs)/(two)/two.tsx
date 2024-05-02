import React, { useState, useEffect } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { useLocalSearchParams, useGlobalSearchParams } from "expo-router";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import axios from "axios";
import ApiUrl from "../../../config"

interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

interface Category {
  id: number;
  name: string;
}

const CoursesScreen: React.FC = () => {
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const colorScheme = useColorScheme();
  const { course } = useLocalSearchParams();
  const params = useGlobalSearchParams();
  const token = params.token;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const course = await axios.get(
        `${ApiUrl}:8000/api/course/all`,{
          headers: {
            Authorization: `Token ${token}`,
          },
        } 
      );
      const categories = await axios.get(
        `${ApiUrl}:8000/api/category/all`,{
          headers: {
            Authorization: `Token ${token}`,
          },
        } 
      );
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
  });

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />
      <CoursesList courses={filteredCourses} categories={categoryData} />
    </View>
  );
};

export default CoursesScreen;
