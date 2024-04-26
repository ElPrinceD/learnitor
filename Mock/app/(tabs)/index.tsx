import React from "react";
import { StyleSheet } from "react-native";

import RecommendedCoursesList from "@/components/Recommended";
import StreakList from "@/components/Streak";
import { Text, View } from "@/components/Themed";

interface Streak {
  name: string;
  streak: boolean;
}
interface Course {
  name: string;
  program: string;
  level: string;
  image: string;
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
  const coursesData: Course[] = [
    {
      name: "Course 1",
      program: "Computer Science",
      level: "Beginner",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
    {
      name: "Course 2",
      program: "Mathematics",
      level: "Intermediate",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
    {
      name: "Course 3",
      program: "Physics",
      level: "Advanced",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
    {
      name: "Course 4",
      program: "Biology",
      level: "Intermediate",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
    {
      name: "Course 5",
      program: "Chemistry",
      level: "Advanced",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
    {
      name: "Course 6",
      program: "History",
      level: "Beginner",
      image:
        "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
    },
  ];

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
          marginLeft: -150,
        }}
      >
        Recommended for you
      </Text>
      <RecommendedCoursesList coursesData={coursesData} />
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
