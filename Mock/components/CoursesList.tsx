import React from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";

interface Course {
  name: string;
  program: string;
  level: string;
  image: string;
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

  // Determine styles based on color scheme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    categoryContainer: {
      height: 50, // Adjust the height as needed
    },
    categoryList: {
      flexGrow: 0, // Disable auto resizing
      marginBottom: 10,
    },
    categoryItem: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 10,
      borderRadius: 20,
      backgroundColor: colorScheme === "dark" ? "#333" : "#f0f0f0",
    },
    categoryText: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#fff" : "#333",
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
      elevation: 3,
      backgroundColor: colorScheme === "dark" ? "#333" : "#fff",
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

  // Extract unique program categories from the list of courses
  const uniqueCategories = categories.map((category) => category.name);

  return (
    <View style={styles.container}>
      {/* Category Container */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={uniqueCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.categoryItem}>
              <Text style={styles.categoryText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Course List */}
      <FlatList
        data={courses}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => console.log("Course clicked")}
            activeOpacity={0.5}
            style={styles.courseItem}
          >
            <View style={styles.container}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.details} numberOfLines={2}>
                  {item.program} · {item.level}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.courseList}
      />
    </View>
  );
};

export default CoursesList;
