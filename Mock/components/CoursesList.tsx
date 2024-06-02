import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors"; // Adjust the import path as necessary
import { Course, Category } from "./types";

interface Props {
  courses: Course[];
  categories?: Category[];
  onCoursePress: (course: Course) => void;
}

const CoursesList: React.FC<Props> = ({
  courses,
  categories,
  onCoursePress,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // Define styles using themeColors
  const styles = StyleSheet.create({
    container: {
      flex: 4,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 10,
      backgroundColor: themeColors.background,
    },
    categoryContainer: {
      flex: 1,
      backgroundColor: "transparent",
    },
    courseContainer: {
      flex: 15,
    },
    categoryList: {
      // marginBottom: "2%",
    },
    categoryItem: {
      paddingHorizontal: 15,
      marginRight: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: themeColors.tabIconDefault,
      backgroundColor: "transparent",
      justifyContent: "center",
    },
    selectedCategoryItem: {
      borderColor: themeColors.selectedItem,
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 16,
      color: themeColors.text,
    },
    selectedCategoryText: {
      color: themeColors.selectedText,
      fontWeight: "bold",
    },
    courseList: {
      paddingHorizontal: 10,
      paddingBottom: 20,
    },
    courseListContainer: {
      // padding: 10,
      backgroundColor: themeColors.card,
    },
    courseItem: {
      flex: 1,
      margin: 10,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 1,
    },
    imageContainer: {
      flex: 1,
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: 150,
    },
    newLabelContainer: {
      position: "absolute",
      top: 10,
      right: 0,
      backgroundColor: themeColors.tabIconSelected,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    newLabelText: {
      color: themeColors.text,
      fontSize: 12,
      fontWeight: "bold",
    },
    textContainer: {
      flex: 1,
      padding: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeColors.text,
    },
    details: {
      fontSize: 14,
      color: themeColors.tabIconDefault,
    },
  });

  const filteredCourses = selectedCategoryId
    ? courses
        .filter((course) => course.category.includes(selectedCategoryId))
        .sort((a, b) => a.category[0] - b.category[0])
    : courses.sort((a, b) => a.category[0] - b.category[0]);

  return (
    <View style={styles.container}>
      {/* Category Container */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                item.id === selectedCategoryId && styles.selectedCategoryItem,
              ]}
              onPress={() =>
                setSelectedCategoryId(
                  item.id === selectedCategoryId ? null : item.id
                )
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  item.id === selectedCategoryId && styles.selectedCategoryText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Course List */}
      <View style={styles.courseContainer}>
        <FlatList
          data={filteredCourses}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onCoursePress(item)}
              activeOpacity={0.5}
              style={styles.courseItem}
            >
              <View style={styles.courseListContainer}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.url }} style={styles.image} />
                  <View style={styles.newLabelContainer}>
                    <Text style={styles.newLabelText}>NEW</Text>
                  </View>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {/* <Text style={styles.details} numberOfLines={2}>
                  {item.description} · {item.level}
                </Text> */}
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.courseList}
        />
      </View>
    </View>
  );
};

export default CoursesList;
