import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, useColorScheme } from "react-native";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext";
import apiUrl from "../../../config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import TimelineCategoryItem from "../../../components/TimelineCategoryItem"; // Adjust the import path as needed
import { rMS } from "../../../constants";
import Colors from "../../../constants/Colors";

interface TimelineCategory {
  id: string;
  name: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const TimelineCategory: React.FC = () => {
  const { width } = Dimensions.get("window");
  const [categories, setCategories] = useState<TimelineCategory[]>([]);
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  // Fetch categories from the API endpoint
  const fetchCategories = async () => {
    try {
      const response = await axios.get<TimelineCategory[]>(
        `${apiUrl}/api/task/categories/`,
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
        return "#0d1116";
      case "TimeTable":
        return "#ed892e";
      case "Study TimeTable":
        return "#6c77f4";
      case "Exams TimeTable":
        return "#a96ae3";
      default:
        return "#000000";
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      padding: rMS(10),
      backgroundColor: themeColors.background,
    },

    categoriesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
  });
  return (
    <View style={styles.container}>
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

export default TimelineCategory;
