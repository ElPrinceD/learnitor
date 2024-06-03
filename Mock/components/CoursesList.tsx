import React, { memo } from "react";
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

const CoursesList: React.FC<Props> = ({ courses, onCoursePress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Define styles using themeColors
  const styles = StyleSheet.create({
    container: {
      flex: 9,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 10,
      backgroundColor: themeColors.background,
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

  const renderItem = ({ item }: { item: Course }) => (
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
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)} // Ensure item.id is converted to a string
        contentContainerStyle={styles.courseList}
      />
    </View>
  );
};

export default memo(CoursesList);
