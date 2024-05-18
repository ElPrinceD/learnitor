import axios, { AxiosError } from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import RecommendedCoursesList from "@/components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import StreakList from "@/components/Streak";
import { Text, View } from "@/components/Themed";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

const index = () => {
  const streakData = [
    { name: "Streak 1", streak: true },
    { name: "Streak 2", streak: true },
    { name: "Streak 3", streak: true },
    { name: "Streak 4", streak: false },
    { name: "Streak 5", streak: false },
    { name: "Streak 6", streak: false },
    { name: "Streak 7", streak: false },
  ];

  const { userToken, userInfo } = useAuth();

  const [recommendedCoursesData, setRecommendedCoursesData] = useState([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (userToken && userInfo) {
        fetchData();
      }
    }, [userToken, userInfo])
  );

  const fetchData = async () => {
    try {
      const token = userToken?.token;
      const coursesUrl = `${ApiUrl}:8000/api/course/all/`;
      const coursesResponse = await axios.get(coursesUrl, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setRecommendedCoursesData(coursesResponse.data);

      const enrolledCoursesUrl = `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/courses`;
      const enrolledResponse = await axios.get(enrolledCoursesUrl, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setEnrolledCoursesData(enrolledResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error fetching data:",
          error.response?.status,
          error.response?.data
        );
        if (error.response?.status === 404) {
          console.log(
            "Enrolled courses not found for user ID:",
            userInfo?.user.id
          );
        }
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, padding: 20 }}>
        {/* <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
          Streaks
        </Text> */}
        <StreakList streakData={streakData} />
      </View>

      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text
        style={{
          fontSize: 25,
          fontWeight: "bold",
          marginBottom: 10,
          flexDirection: "row",
          marginLeft: -207,
        }}
      >
        Enrolled Courses
      </Text>
      <EnrolledCoursesList enrolledCoursesData={enrolledCoursesData} />
      <Text
        style={{
          fontSize: 25,
          fontWeight: "bold",
          marginBottom: 10,
          marginLeft: -150,
        }}
      >
        Recommended for you
      </Text>
      <RecommendedCoursesList RecommendedCoursesData={recommendedCoursesData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});

export default index;
