import React from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Course } from "./types";

interface Props {
  RecommendedCoursesData: Course[];
}

const RecommendedCoursesList: React.FC<Props> = ({
  RecommendedCoursesData,
}) => {
  return (
    <FlatList
      horizontal
      data={RecommendedCoursesData}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            router.navigate({
              pathname: "CourseDetails",
              params: { course: JSON.stringify(item) },
            });
          }}
          activeOpacity={0.5} // Set activeOpacity to 1 to remove white overlay
          style={styles.touchable}
        >
          <View style={styles.container}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.url }} style={styles.image} />
              <View style={styles.overlay} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.details} numberOfLines={1}>
                {item.description} · {item.level}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false} // Hide horizontal scroll indicator
    />
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 5,
    alignItems: "flex-start",
    position: "relative",
  },
  touchable: {
    borderRadius: 10,
    overflow: "hidden", // Clip overflow content
  },
  imageContainer: {
    borderRadius: 10,
    overflow: "hidden", // Clip overflow content
  },
  image: {
    width: 150,
    height: 150,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent black overlay
  },
  textContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
    marginBottom: 5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  details: {
    fontSize: 16,
    color: "white",
    textAlign: "left",
  },
});

export default RecommendedCoursesList;
