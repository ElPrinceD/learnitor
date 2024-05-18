import axios, { AxiosError } from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import StreakList from "../../components/Streak";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "../../components/Themed";
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
          <EnrolledCoursesList enrolledCoursesData={enrolledCoursesData} />
      
          <Text style={[styles.sectionTitle]}>
            Recommended for you
          </Text>
          <RecommendedCoursesList RecommendedCoursesData={recommendedCoursesData} />
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