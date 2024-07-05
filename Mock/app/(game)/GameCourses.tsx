import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, useColorScheme } from "react-native";
import { useQuery } from "@tanstack/react-query";
import CoursesList from "../../components/CoursesList";
import { router } from "expo-router";
import { Course } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rV } from "../../constants";
import { getCourses } from "../../CoursesApiCalls";
import { queryClient } from "../../QueryClient";
import ErrorMessage from "../../components/ErrorMessage";

const GameCourses: React.FC = () => {
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    status: coursesStatus,
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses", userToken?.token],
    queryFn: () => getCourses(userToken?.token),
  });

  const handleCoursePress = (course: Course) => {
    router.navigate("GameTopics");
    router.setParams({
      course: JSON.stringify(course),
    });
  };

  useEffect(() => {
    if (coursesStatus === "error") {
      setErrorMessage(coursesError?.message || "An error occurred");
    }
  }, [coursesStatus]);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [themeColors]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Course</Text>
      <CoursesList
        onCoursePress={handleCoursePress}
        courses={coursesData || []}
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

export default GameCourses;
