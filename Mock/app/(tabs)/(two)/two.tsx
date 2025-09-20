import React, { useCallback, useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import SearchBar from "../../../components/SearchBar";
import CoursesList from "../../../components/CoursesList";
import CoursesCategories from "../../../components/CoursesCategories";
import { useAuth } from "../../../components/AuthContext";
import { Course } from "../../../components/types";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  getCourseCategories,
  getCourses,
} from "../../../services/CoursesApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import { queryClient } from "../../../QueryClient";

// Static styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

interface CoursesScreenProps {
  segment?: string; // Optional prop from router
}

const CoursesScreen: React.FC<CoursesScreenProps> = ({ segment }) => {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const { userToken, userInfo } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

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

  // Consolidated error handling
  useEffect(() => {
    if (categoryStatus === "error" || coursesStatus === "error") {
      setErrorMessage(
        categoryError?.message || coursesError?.message || "An error occurred"
      );
    }
  }, [
    categoryStatus,
    coursesStatus,
    categoryError?.message,
    coursesError?.message,
  ]);

  const handleSearch = useCallback(
    (query: string) => {
      const filtered =
        coursesData?.filter((course: Course) =>
          course.title.toLowerCase().includes(query.toLowerCase())
        ) ?? [];
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
            ) ?? []
          : coursesData ?? [];
      setFilteredCourses(filtered);
    },
    [coursesData, selectedCategoryId]
  );

  const handleCoursePress = useCallback((course: Course) => {
    router.navigate({
      pathname: "CourseDetails",
      params: {
        course: JSON.stringify(course),
      },
    });
  }, []);

  // Update filteredCourses when coursesData changes
  useEffect(() => {
    setFilteredCourses(coursesData ?? []);
  }, [coursesData]);

  const onRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      await refetchCourses();
    } catch (error) {
      setErrorMessage("Failed to refresh courses");
    }
  }, [userToken?.token, refetchCourses]);

  // Memoized props for child components
  const coursesListProps = useMemo(
    () => ({
      courses: filteredCourses,
      onCoursePress: handleCoursePress,
      onRefresh,
      refreshing: coursesStatus === "pending",
      loading: coursesStatus === "pending",
    }),
    [filteredCourses, handleCoursePress, onRefresh, coursesStatus]
  );

  const coursesCategoriesProps = useMemo(
    () => ({
      categories: categoryData ?? [],
      onPressCategory: handleCategoryPress,
      selectedCategoryId,
      loading: coursesStatus === "pending",
    }),
    [categoryData, handleCategoryPress, selectedCategoryId, coursesStatus]
  );

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />
      <CoursesCategories {...coursesCategoriesProps} />
      <CoursesList {...coursesListProps} />
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default React.memo(CoursesScreen);
