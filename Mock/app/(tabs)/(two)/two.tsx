import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import CoursesCategories from "../../../components/CoursesCategories";
import { useAuth } from "../../../components/AuthContext";
import { Course } from "../../../components/types";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorMessage from "../../../components/ErrorMessage";
import { useWebSocket } from "../../../webSocketProvider";

const CoursesScreen: React.FC = () => {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const { userToken, userInfo } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchAndCacheCourses, fetchAndCacheCourseCategories } =
    useWebSocket();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchAndCacheCourses();
        await fetchAndCacheCourseCategories();

        const cachedCourses = await AsyncStorage.getItem("courses");
        const cachedCategories = await AsyncStorage.getItem("courseCategories");

        if (cachedCourses) {
          setCourses(JSON.parse(cachedCourses));
          setFilteredCourses(JSON.parse(cachedCourses));
        }
        if (cachedCategories) setCategories(JSON.parse(cachedCategories));
      } catch (error) {
        setErrorMessage("Failed to load data");
        console.error("Error loading courses or categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchAndCacheCourses, fetchAndCacheCourseCategories]);

  const handleSearch = useCallback(
    (query: string) => {
      const filtered = courses.filter((course: Course) =>
        course.title.toLowerCase().includes(query.toLowerCase())
      );

      setFilteredCourses(filtered);
    },
    [courses]
  );

  const handleCategoryPress = useCallback(
    (categoryId: number | null) => {
      const newCategoryId =
        selectedCategoryId === categoryId ? null : categoryId;
      setSelectedCategoryId(newCategoryId);

      const filtered =
        newCategoryId !== null
          ? courses.filter((course: Course) =>
              course.category.includes(newCategoryId)
            )
          : courses;

      setFilteredCourses(filtered);
    },
    [courses, selectedCategoryId]
  );

  const handleCoursePress = useCallback(
    (course: Course) => {
      // Use push instead of navigate for sending params
      router.push({
        pathname: "CourseDetails",
        params: { course: JSON.stringify(course) },
      });
    },
    [router]
  );

  const onRefresh = useCallback(async () => {
    try {
      await fetchAndCacheCourses();
      await fetchAndCacheCourseCategories();
      const cachedCourses = await AsyncStorage.getItem("courses");
      const cachedCategories = await AsyncStorage.getItem("courseCategories");
      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses));
        setFilteredCourses(JSON.parse(cachedCourses));
      }
      if (cachedCategories) setCategories(JSON.parse(cachedCategories));
    } catch (error) {
      setErrorMessage("Failed to refresh courses");
    }
  }, [fetchAndCacheCourses, fetchAndCacheCourseCategories]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />
      <CoursesCategories
        categories={categories}
        onPressCategory={handleCategoryPress}
        selectedCategoryId={selectedCategoryId}
        loading={isLoading}
      />
      <CoursesList
        courses={filteredCourses}
        onCoursePress={handleCoursePress}
        onRefresh={onRefresh}
        refreshing={isLoading}
        loading={isLoading}
      />
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default CoursesScreen;
