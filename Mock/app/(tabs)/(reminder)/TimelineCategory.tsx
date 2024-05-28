import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext";
import apiUrl from "../../../config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import TimelineCategoryItem from ".,/../../components/TimelineCategoryItem"; // Adjust the import path as needed

// Define the TimelineCategory interface
interface TimelineCategory {
  id: string;
  name: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap; // Ensure icon is a valid Ionicon name
}

const TimelineCategory: React.FC = () => {
  const { width } = Dimensions.get("window");
  const [categories, setCategories] = useState<TimelineCategory[]>([]);
  const { userToken } = useAuth();

  // Fetch categories from the API endpoint
  const fetchCategories = async () => {
    try {
      const response = await axios.get<TimelineCategory[]>(
        `${apiUrl}:8000/api/task/categories/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setCategories(
        response.data.map((category: TimelineCategory) => ({
          ...category,
          color: getCategoryColor(category.name),
          icon: getCategoryIcon(category.name),
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCategoryPress = (category: TimelineCategory) => {
    router.navigate("createNewTime");
    router.setParams({
      name: category.name,
      category_id: category.id,
    });
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "Assignments & Projects":
        return "#0d1116"; // Red
      case "TimeTable":
        return "#ed892e"; // Orange
      case "Study TimeTable":
        return "#6c77f4"; // Blue
      case "Exams TimeTable":
        return "#a96ae3"; // Purple
      default:
        return "#000000"; // Black (default color)
    }
  };

  // Function to get icon name based on category type
  const getCategoryIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "Exams TimeTable":
        return "flame";
      case "TimeTable":
        return "briefcase";
      case "Assignments & Projects":
        return "people";
      case "Study TimeTable":
        return "book";
      default:
        return "help-circle"; // Default icon name
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // Fetch categories only once when the component mounts

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select category to remind</Text>
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TimelineCategoryItem
            key={category.id}
            category={category}
            onPress={() => handleCategoryPress(category)}
            width={width}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default TimelineCategory;
