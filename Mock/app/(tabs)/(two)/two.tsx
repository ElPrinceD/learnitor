import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import CoursesCategories from "../../../components/CoursesCategories";
import axios from "axios";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Course, Category } from "../../../components/types";
import { router } from "expo-router";

const CoursesScreen: React.FC = () => {
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const { userToken } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const headers = {
      Authorization: `Token ${userToken?.token}`,
      'Content-Type': 'application/json',
    }
    console.log(userToken?.token)
    try {
      const course = await axios.get(`${ApiUrl}/api/course/all/`, {
        headers 
      });
      const categories = await axios.get(`${ApiUrl}/api/category/all/`, {
        headers
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

  const handleCategoryPress = (categoryId: number | null) => {
    // Toggle the selected category
    const newCategoryId = selectedCategoryId === categoryId ? null : categoryId;
    setSelectedCategoryId(newCategoryId);

    // Filter courses based on the new selected category ID
    const filtered =
      newCategoryId !== null
        ? coursesData.filter((course) =>
            course.category.includes(newCategoryId)
          )
        : coursesData;
    setFilteredCourses(filtered);
  };

  const handleCoursePress = React.useCallback(
    (course: Course) => {
      router.navigate("CourseDetails");
      router.setParams({
        course: JSON.stringify(course),
      });
    },
    [router] // Include router in the dependencies array
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />
      <CoursesCategories
        categories={categoryData}
        onPressCategory={handleCategoryPress}
        selectedCategoryId={selectedCategoryId}
      />
      <CoursesList
        courses={filteredCourses}
        onCoursePress={handleCoursePress}
      />
    </View>
  );
};

export default CoursesScreen;
