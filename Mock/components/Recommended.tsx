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
import { router } from "expo-router";
import { Course } from "./types";
import Colors from "../constants/Colors";

interface Props {
  RecommendedCoursesData: Course[];
}

const RecommendedCoursesList: React.FC<Props> = ({
  RecommendedCoursesData,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 2,
      alignItems: "flex-start",
      position: "relative",
    },
    touchable: {
      flex: 1,
      marginRight: 20,
      marginBottom: 2,
      borderRadius: 10,
      overflow: "hidden",
      elevation: 1,
    },
    courseListContainer: {
      // padding: 10,
      flex: 1,
      backgroundColor: themeColors.card,
    },
    imageContainer: {
      flex: 2,
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: 250,
      height: 200,
    },

    textContainer: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: 16,
      fontWeight: "bold",
      flexWrap: "wrap",
      maxWidth: "70%",
      color: themeColors.text,
    },
    details: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: "left",
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={RecommendedCoursesData}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              router.navigate({
                pathname: "/CourseDetails",
                params: { course: JSON.stringify(item) },
              });
            }}
            activeOpacity={0.5}
            style={styles.touchable}
          >
            <View style={styles.courseListContainer}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.url }} style={styles.image} />
              </View>
              <View style={styles.textContainer}>
                {/* <Text style={styles.details} numberOfLines={1}>
                  {item.description} · {item.level}
                </Text> */}
                <Text style={styles.name} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false} // Hide horizontal scroll indicator
      />
    </View>
  );
};

export default RecommendedCoursesList;
