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
import { SIZES, rMS, rS, rV } from "../constants";
import { Course, Category } from "./types";

interface Props {
  courses: Course[];
  categories?: Category[];
  onCoursePress: (course: Course) => void;
}

const CoursesList: React.FC<Props> = ({ courses, onCoursePress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 9,
      borderTopLeftRadius: rMS(30),
      borderTopRightRadius: rMS(30),
      padding: rMS(10),
      backgroundColor: themeColors.background,
    },
    courseList: {
      paddingHorizontal: rMS(10),
      paddingBottom: rMS(20),
    },
    courseListContainer: {
      backgroundColor: themeColors.card,
    },
    courseItem: {
      flex: 1,
      margin: rMS(10),
      borderRadius: rMS(10),
      overflow: "hidden",
      elevation: 1,
    },
    imageContainer: {
      flex: 1,
      borderRadius: rMS(10),
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: rV(120),
    },
    newLabelContainer: {
      position: "absolute",
      top: rS(10),
      right: 0,
      backgroundColor: themeColors.tabIconSelected,
      paddingHorizontal: rMS(5),
      paddingVertical: rMS(2),
    },
    newLabelText: {
      color: themeColors.text,
      fontSize: SIZES.small,
      fontWeight: "bold",
    },
    textContainer: {
      flex: 1,
      padding: rMS(10),
      backgroundColor: "transparent",
    },
    name: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    details: {
      fontSize: SIZES.small,
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
