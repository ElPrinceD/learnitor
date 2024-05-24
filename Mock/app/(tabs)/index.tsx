import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import RecommendedCoursesList from "../../components/Recommended";
import EnrolledCoursesList from "../../components/EnrolledCoursesList";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "../../components/Themed";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import Swiper from "react-native-deck-swiper";
import GradientCard from "../../components/InfoCard";
import { router } from "expo-router";

const Index = () => {
  const { userToken, userInfo } = useAuth();
  const [recommendedCoursesData, setRecommendedCoursesData] = useState([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);

  const dummyCardData = [
    {
      title: "Find all your academic schedules in one place",
      description: "Timetables, Study timetables, Assignment deadlines",
      colors: ["#ace2d1", "#54b093"],
      category: "Timeline",
      image: require("../../assets/images/clock1.png"),
    },
    {
      title: "Tailor your topics according to your course description",
      description: "Variety of course topics, topic material & questions",
      colors: ["#dabda2", "#9b7a5d"],
      category: "Courses",
      image: require("../../assets/images/books.png"),
    },
    {
      title: "Card 3",
      description: "This is the description for card 3.",
      colors: ["#b1afe3", "#3d4e9b"],
      category: "Timeline",
    },
  ];

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

  const handleSwiped = () => {
    setCardIndex((prevIndex) => (prevIndex + 1) % dummyCardData.length);
  };
  const handleCardPress = () => {
    router.navigate({
      pathname: "three",
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fdecd2", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      >
        <View style={styles.topContainer}></View>
        <View style={styles.bottomContainer}>
          <View style={{ flex: 1, marginLeft: -10 }}>
            <Swiper
              cards={dummyCardData}
              renderCard={(card) =>
                card ? (
                  <GradientCard card={card} handleCardPress={handleCardPress} />
                ) : (
                  <View style={styles.cardPlaceholder}>
                    <Text>No more cards</Text>
                  </View>
                )
              }
              onSwiped={handleSwiped}
              verticalSwipe={true}
              cardIndex={cardIndex}
              stackSize={3}
              stackSeparation={1}
              stackScale={1}
              backgroundColor="transparent"
              infinite={true}
            />
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 120 }]}>
            Enrolled Courses
          </Text>
          <EnrolledCoursesList enrolledCoursesData={enrolledCoursesData} />
          <Text style={[styles.sectionTitle]}>Recommended for you</Text>
          <RecommendedCoursesList
            RecommendedCoursesData={recommendedCoursesData}
          />
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

  sectionTitle: {
    fontSize: 25,
    color: "#D96B06",
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
});

export default Index;
