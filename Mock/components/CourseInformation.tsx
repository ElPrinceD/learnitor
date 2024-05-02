import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
} from "react-native";

interface Course {
  title: string;
  description: string;
  id: string;
  url: string;
}

const CourseInformation: React.FC<{ course: Course }> = ({ course }) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#fff" : "#333",
    },
    description: {
      fontSize: 18,
      marginBottom: 20,
      color: colorScheme === "dark" ? "#ccc" : "#777",
    },
    imageContainer: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 10,
    },
    image: {
      width: "30%",
      height: 100,
    },
    enrollButton: {
      backgroundColor: "transparent",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colorScheme === "dark" ? "#fff" : "#000",
    },
    enrollButtonText: {
      color: colorScheme === "dark" ? "#fff" : "#000",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: course.url,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.description}>{course.description}</Text>
      <TouchableOpacity style={styles.enrollButton} activeOpacity={0.3}>
        <Text style={styles.enrollButtonText}>Enroll</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CourseInformation;
