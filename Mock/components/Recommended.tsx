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

interface Props {
  coursesData: Course[];
}

const RecommendedCoursesList: React.FC<Props> = ({ coursesData }) => {
  const colorScheme = useColorScheme();

  return (
    <FlatList
      horizontal
      data={coursesData}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => console.log("Course clicked")}
          activeOpacity={0.5} // Set activeOpacity to 1 to remove white overlay
          style={styles.touchable}
        >
          <View style={styles.container}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.overlay} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.details} numberOfLines={1}>
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
    width: 250,
    height: 250,
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
