import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import StreakList from "../../components/Streak";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "../../components/Themed";
import axios from "axios";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

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

const index = () => {
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
  const [RecommendedCoursesData, setRecommendedCoursesData] = useState<Course[]>([]);
  const [EnrolledCoursesData, setEnrolledCoursesData] = useState<Course[]>([]);

  const fetchData = async () => {
    try {
      const courses = await axios.get(`${ApiUrl}:8000/api/course/all`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      setRecommendedCoursesData(courses.data);
      const enrolled = await axios.get(
        `${ApiUrl}:8000/api/learner/${userInfo?.user.id}/courses`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setEnrolledCoursesData(enrolled.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fdecd2', '#FFFFFF']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      >
        <View style={styles.topContainer}>
          {/* <View style={{ flex: 1, padding: 20 }}>
            <LinearGradient
              colors={['#d8cdc1', '#8c6130']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientContainer}
            >
              <View style={styles.textWithIcon}>
                <Ionicons name="sparkles" size={30} color="white" />
                <Text style={styles.gradientText}>Checkout your Schdeule for the Day</Text>
                <Ionicons name="chevron-forward-circle" size={35} color="white" />
              </View>
            </LinearGradient>
          </View> */}
          
        </View>
        <View style={styles.bottomContainer}>
          <Text style={[styles.sectionTitle]}>
            Enrolled Courses
          </Text>
          <EnrolledCoursesList enrolledCoursesData={EnrolledCoursesData} />
          <Text style={[styles.sectionTitle]}>
            Recommended for you
          </Text>
          <RecommendedCoursesList RecommendedCoursesData={RecommendedCoursesData} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  bottomContainer: {
    flex: 2,
    marginTop: -150,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gradientContainer: {
    flex: 1,
    width: 390,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    paddingHorizontal: 20,
  },
  textWithIcon: {
    flexDirection: "row",
    backgroundColor: "none",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  gradientText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "normal",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default index;