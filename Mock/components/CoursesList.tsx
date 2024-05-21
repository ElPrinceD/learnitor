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
import { router } from "expo-router";

interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  courses: Course[];
  categories: Category[];
}

const CoursesList: React.FC<Props> = ({ courses, categories }) => {
  const colorScheme = useColorScheme();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // Determine styles based on color scheme
  const styles = StyleSheet.create({
    container: {
      flex: 4,
      marginTop: -20,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 10,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fffdfd",
    },
    categoryContainer: {
      height: 40,
      marginTop: -6,
    },
    categoryList: {
      marginBottom: "1%",
    },
    categoryItem: {
      paddingHorizontal: 15,
      paddingVertical: 4,
      marginRight: 10,
      
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#555" : "#ccc",
      backgroundColor: "transparent",
    },
    selectedCategoryItem: {
      borderColor: "#9a580d",
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#888" : "#666",
    },
    selectedCategoryText: {
      color: "#9a580d",
      fontWeight: "bold",
    },
    courseList: {
      paddingHorizontal: 10,
      paddingBottom: 20,
    },
    courseItem: {
      flex: 1,
      flexDirection: "row",
      margin: 10,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 1,
      backgroundColor: colorScheme === "dark" ? "#181818" : "#fff",
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
      backgroundColor: "#c99252",
      paddingHorizontal: 5,
      paddingVertical: 2,
      
    },
    newLabelText: {
      color: "white",
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
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    details: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#ccc" : "#777",
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
                  item.id === selectedCategoryId &&
                    styles.selectedCategoryText,
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
      <FlatList
        data={filteredCourses}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              // Push the CourseDetails route and set parameters
              router.navigate("CourseDetails");
              router.setParams({
                course: JSON.stringify(item),
              });
            }}
            activeOpacity={0.5}
            style={styles.courseItem}
          >
            <View style={styles.container}>
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
  );
};

export default CoursesList;
