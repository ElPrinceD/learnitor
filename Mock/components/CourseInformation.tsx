import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import GameButton from "../components/GameButton";

const CourseInformation = ({
  course,
  enrollCourse,
  handleContinue,
  unenrollCourse,
  progress,
  enrolled,
  enrollDisabled,
  onEnrollDisabledPress,
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
    },
    heading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeColors.text,
    },
    topicsNumber: {
      fontSize: 18,
      color: themeColors.icon,
      textAlign: "left",
      marginTop: -10,
      marginBottom: 5,
      fontWeight: "bold",
      alignSelf: "flex-end",
    },
    description: {
      fontSize: 18,
      marginBottom: 20,
      color: themeColors.textSecondary,
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
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      opacity: enrollDisabled ? 0.5 : 1,
    },
    continueButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: themeColors.buttonBackground,
      marginTop: -40,
      marginHorizontal: 5,
      flexDirection: "row",
      justifyContent: "center",
      width: "48%",
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
      <View style={styles.container}></View>
      <View style={styles.bodyContainer}>
        <View>
          <Text style={[styles.description, { flexWrap: "wrap" }]}>
            {course.description}
          </Text>
          <View style={styles.heading}>
            <Text style={styles.topicsNumber}>
              <MaterialCommunityIcons
                name="notebook-multiple"
                size={20}
                color={themeColors.icon}
              />{" "}
              {topics.length} Topics
            </Text>
          </View>
        </View>
        {enrolled ? (
          <View>
            <View style={styles.buttonContainer}>
              <GameButton
                title="Unenroll"
                onPress={unenrollCourse}
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderColor: themeColors.border,
                  },
                ]}
                textStyle={styles.continueText}
              />

              <GameButton
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueText}>
                  Continue{" "}
                  <FontAwesome5
                    style={styles.arrowIcon}
                    name="arrow-alt-circle-right"
                    size={15}
                  />
                </Text>
              </GameButton>
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
          <GameButton
            onPress={enrollDisabled ? onEnrollDisabledPress : enrollCourse}
            style={styles.enrollButton}
            title="Enroll"
          />
        )}
      </View>
    </View>
  );
};

export default CourseInformation;
