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
import { SIZES, rMS, rS, rV } from "../constants";

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
      marginRight: rS(18),
      marginBottom: rV(2),
      borderRadius: 10,
      overflow: "hidden",
      elevation: 1,
    },
    courseListContainer: {
      flex: 1,
      backgroundColor: themeColors.card,
    },
    imageContainer: {
      flex: 2,
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: rS(210),
      height: rV(130),
    },

    textContainer: {
      flex: 1,
      padding: rMS(8),
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      flexWrap: "wrap",
      maxWidth: rMS(150),
      color: themeColors.text,
    },
    details: {
      fontSize: SIZES.small,
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
