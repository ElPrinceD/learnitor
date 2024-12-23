import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import CoursesCategories from "../../../components/CoursesCategories";
import { useAuth } from "../../../components/AuthContext";
import { Course } from "../../../components/types";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getCourseCategories, getCourses } from "../../../CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import { queryClient } from "../../../QueryClient";

const CoursesScreen: React.FC = () => {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const { userToken, userInfo } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    status: coursesStatus,
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses", userToken?.token],
    queryFn: () => getCourses(userToken?.token),
  });

  const {
    status: categoryStatus,
    data: categoryData,
    error: categoryError,
  } = useQuery({
    queryKey: ["coursesCategory", userToken?.token, userInfo?.user?.id],
    queryFn: () => getCourseCategories(userToken?.token),
  });

  useEffect(() => {
    if (categoryStatus === "error" || coursesStatus === "error") {
      setErrorMessage(
        categoryError?.message || coursesError?.message || "An error occurred"
      );
    }
  }, [categoryStatus, coursesStatus]);

  const handleSearch = useCallback(
    (query: string) => {
      const filtered = coursesData?.filter((course: Course) =>
        course.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCourses(filtered);
    },
    [coursesData]
  );

  const handleCategoryPress = useCallback(
    (categoryId: number | null) => {
      const newCategoryId =
        selectedCategoryId === categoryId ? null : categoryId;
      setSelectedCategoryId(newCategoryId);

      const filtered =
        newCategoryId !== null
          ? coursesData?.filter((course: Course) =>
              course.category.includes(newCategoryId)
            )
          : coursesData;

      setFilteredCourses(filtered);
    },
    [coursesData, selectedCategoryId]
  );

  const handleCoursePress = useCallback(
    (course: Course) => {
      console.log(course)
      router.navigate("CourseDetails");
      router.setParams({
        course: JSON.stringify(course),
      });
    },
    [router]
  );

  useEffect(() => {
    setFilteredCourses(coursesData);
  }, [coursesData]);

  const onRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchCourses();
    } catch (error) {
      setErrorMessage("Failed to refresh courses");
    }
  }, [queryClient, userToken?.token, refetchCourses]);

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
        loading={coursesStatus === "pending"}
      />
      <CoursesList
        courses={filteredCourses}
        onCoursePress={handleCoursePress}
        onRefresh={onRefresh}
        refreshing={coursesStatus === "pending"}
        loading={coursesStatus === "pending"}
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
