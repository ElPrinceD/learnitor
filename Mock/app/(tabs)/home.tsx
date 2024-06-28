import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, useColorScheme } from "react-native";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import { Text, View } from "../../components/Themed";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import CardSwiper from "../../components/CardSwiper";
import { SIZES, rMS, rS } from "../../constants";

const home = () => {
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const [recommendedCoursesData, setRecommendedCoursesData] = useState([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const dummyCardData = [
    {
      title: "Find all your academic schedules in one place",
      description: "Timetables, Study timetables, Assignment deadlines",
      colors: ["#ace2d1", "#54b099"],
      category: "Timeline",
      image: require("../../assets/images/clock1.png"),
    },
    {
      title: "Tailor topics according to course",
      description: "Variety of course topics, topic material & questions",
      colors: ["#dabda2", "#9b7a5d"],
      category: "Courses",
      image: require("../../assets/images/books.png"),
    },
    {
      title: "Games",
      description: "This is the description for card 3.",
      colors: ["#b1afe3", "#3d4e9b"],
      category: "Games",
      image: require("../../assets/images/mystery-box-collage (1).png"),
    },
  ];

  const fetchData = async (token) => {
    try {
      const coursesUrl = `${ApiUrl}/api/course/all/`;
      const coursesResponse = await axios.get(coursesUrl, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setRecommendedCoursesData(coursesResponse.data);

      const enrolledCoursesUrl = `${ApiUrl}/api/learner/${userInfo?.user.id}/courses`;
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

  useFocusEffect(
    useCallback(() => {
      if (userToken && userInfo) {
        fetchData(userToken.token);
      }
    }, [userToken, userInfo])
  );

  // Fetch data on initial load if token and user info are available
  useEffect(() => {
    if (userToken && userInfo) {
      fetchData(userToken.token);
    }
  }, [userToken, userInfo]);

  const handleCardPress = (card) => {
    if (card.category === "Timeline") {
      router.navigate({ pathname: "three" });
    } else if (card.category === "Courses") {
      router.navigate({ pathname: "two" });
    } else {
      router.navigate({ pathname: "GameIntro" });
    }
  };

  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(12),
      flexGrow: 2,
    },
    cardContainer: {
      flex: 1,
    },
    coursesContainer: {
      flex: 2.5,
    },
    sectionTitle: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      marginBottom: rMS(5),
      marginTop: rMS(15),
      alignSelf: "flex-start",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <CardSwiper cards={dummyCardData} onCardPress={handleCardPress} />
      </View>
      <View style={styles.coursesContainer}>
        <Text style={styles.sectionTitle}>Enrolled Courses</Text>
        <EnrolledCoursesList enrolledCoursesData={enrolledCoursesData} />
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <RecommendedCoursesList
          RecommendedCoursesData={recommendedCoursesData}
        />
      </View>
    </View>
  );
};

export default home;
