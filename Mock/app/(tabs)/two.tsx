import React, { useState } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import SearchBar from "../../components/SearchBar";
import CoursesList from "../../components/CoursesList";
import CoursesData from "../../components/CoursesData.json"; // Assuming the correct path
import CategoryData from "../../components/Category.json"; // Assuming the correct path

interface Course {
  name: string;
  program: string;
  level: string;
  image: string;
  category: number;
  id: number;
}

interface Category {
  id: number;
  name: string;
}

const coursesData: Course[] = CoursesData.map((course: any) => ({
  name: course.title,
  id: course.id,
  category: course.category,
  program: course.description,
  level: "",
  image:
    "https://e1.pxfuel.com/desktop-wallpaper/355/972/desktop-wallpaper-stock-of-reading-%C2%B7-pexels-coffee-winter-and-books.jpg",
}));

const categoryData: Category[] = CategoryData.map((category: any) => ({
  id: category.id,
  name: category.name,
}));

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
      <SearchBar onSearch={handleSearch} />
      <CoursesList courses={filteredCourses} categories={categoryData} />
    </View>
  );
};

export default CoursesScreen;
