import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import CourseTopics from "./CourseTopics";

const CourseInformation = ({
  course,
  enrollCourse,
  handleContinue,
  unenrollCourse,
  progress,
  enrolled,
  enrollDisabled,
  topics,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      padding: 0,
    },
    bodyContainer: {
      padding: 20,
      backgroundColor: themeColors.background,
      marginTop: -47,
      borderTopLeftRadius: 50,
      borderTopRightRadius: 50,
    },
    heading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeColors.text,
    },
    topicsNumber: {
      fontSize: 18,
      color: themeColors.icon,
      textAlign: "center",
      top: 5,
    },
    description: {
      fontSize: 18,
      marginBottom: 20,
      color: themeColors.textSecondary,
    },

    imageContainer: {
      width: "100%",
    },

    image: {
      height: 250,
    },
    buttonContainer: {
      flexDirection: "row",
      alignItems: "center",
      position: "absolute",
      top: 20,
      marginTop: 20,
    },
    enrollButton: {
      backgroundColor: enrollDisabled
        ? themeColors.buttonDisabled
        : themeColors.buttonBackground,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: "center",
      opacity: enrollDisabled ? 0.5 : 1,
    },
    continueButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: themeColors.buttonBackground,
      marginTop: -40,
      flexDirection: "row",
      justifyContent: "center",
      width: "48%",
      marginRight: 10,
    },
    continueText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: "bold",
    },
    arrowIcon: {
      marginLeft: 5,
      color: themeColors.text,
    },
    progressContainer: {
      marginTop: 70,
      flexDirection: "row",
      alignItems: "center",
    },
    progressText: {
      color: themeColors.textSecondary,
    },
  });

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: course.url }}
            style={styles.image}
            resizeMode="cover"
            onError={(error) => console.log("Image error:", error)}
          />
        </View>
      </View>
      <View style={styles.bodyContainer}>
        <View>
          <View style={styles.heading}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.topicsNumber}>
              <MaterialCommunityIcons
                name="notebook-multiple"
                size={20}
                color={themeColors.icon}
              />{" "}
              {topics.length} Topics
            </Text>
          </View>
          <Text style={[styles.description, { flexWrap: "wrap" }]}>
            {course.description}
          </Text>
        </View>
        {enrolled ? (
          <View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: themeColors.border,
                  },
                ]}
                activeOpacity={0.3}
                onPress={unenrollCourse}
              >
                <Text style={styles.continueText}>Unenroll</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.3}
                onPress={handleContinue}
              >
                <Text style={styles.continueText}>
                  Continue{" "}
                  <FontAwesome5
                    style={styles.arrowIcon}
                    name="arrow-alt-circle-right"
                    size={15}
                    color="black"
                  />
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                containerStyle={{
                  backgroundColor: themeColors.text,
                  height: 10,
                }}
                fillStyle={{ backgroundColor: themeColors.icon }}
              />
              <Text style={styles.progressText}>{`${progress.toFixed(
                2
              )}% Completed`}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.enrollButton, { opacity: enrollDisabled ? 0.5 : 1 }]}
            activeOpacity={0.3}
            onPress={enrollCourse}
            disabled={enrollDisabled}
          >
            <Text style={styles.continueText}>Enroll</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CourseInformation;
