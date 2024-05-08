import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import RecommendedCoursesList from "@/components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import StreakList from "@/components/Streak";
import { Text, View } from "@/components/Themed";
import axios from "axios";
import ApiUrl from "../../config";

import { useAuth } from "../../components/AuthContext";

interface Streak {
  name: string;
  streak: boolean;
}
interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

const HomeScreen = () => {
  const streakData: Streak[] = [
    { name: "Streak 1", streak: true },
    { name: "Streak 2", streak: false },
    { name: "Streak 3", streak: false },
    { name: "Streak 4", streak: false },
    { name: "Streak 5", streak: false },
    { name: "Streak 6", streak: false },
    { name: "Streak 7", streak: false },
    // Add more streaks as needed
  ];

  const { userToken, userInfo } = useAuth();

  const [RecommendedCoursesData, setRecommendedCoursesData] = useState<
    Course[]
  >([]);
  const [EnrolledCoursesData, setEnrolledCoursesData] = useState<Course[]>([]);

  const fetchData = async () => {
    console.log("Rec: " + userToken);
    try {
      const course = await axios.get(`${ApiUrl}:8000/api/course/all`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      const enrolled = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/courses`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      console.log("Enrolled:", enrolled.data);
      setEnrolledCoursesData(enrolled.data);
      setRecommendedCoursesData(course.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      <EnrolledCoursesList enrolledCoursesData={EnrolledCoursesData} />
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
      <RecommendedCoursesList RecommendedCoursesData={RecommendedCoursesData} />
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

export default HomeScreen;
