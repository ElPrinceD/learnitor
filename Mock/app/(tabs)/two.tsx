import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import SearchBar from "../../components/SearchBar";
import CoursesList from "../../components/CoursesList";

// Sample data for courses
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
  {
    name: "Course 7",
    program: "Geography",
    level: "Intermediate",
    image:
      "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
  },
  {
    name: "Course 8",
    program: "Literature",
    level: "Advanced",
    image:
      "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
  },
  {
    name: "Course 9",
    program: "Art",
    level: "Beginner",
    image:
      "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
  },
  {
    name: "Course 10",
    program: "Music",
    level: "Intermediate",
    image:
      "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
  },

  // Add more courses here...
];

// Sample data for categories
const categories: string[] = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Biology",
  "Chemistry",
];

interface Course {
  name: string;
  program: string;
  level: string;
  image: string;
}

const CoursesScreen: React.FC = () => {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(coursesData);
  const colorScheme = useColorScheme();

  const handleSearch = (query: string) => {
    const filtered = coursesData.filter((course) =>
      course.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  // Determine styles based on color scheme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
  });

  return (
    <View style={styles.container}>
      {/* <Text style={styles.headerText}>What do you want to learn today?</Text> */}
      <SearchBar onSearch={handleSearch} />
      <CoursesList courses={filteredCourses} />
    </View>
  );
};

export default CoursesScreen;
