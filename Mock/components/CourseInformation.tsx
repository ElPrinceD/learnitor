import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
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
  enrollLoading,
  unEnrollLoading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: rMS(15),
          backgroundColor: themeColors.background,
        },
        heading: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        },
        topicsNumber: {
          fontSize: SIZES.medium,
          color: themeColors.icon,
          textAlign: "left",
          marginTop: -rV(10),
          fontWeight: "bold",
          alignSelf: "flex-end",
        },
        description: {
          fontSize: SIZES.medium,
          marginBottom: rV(20),
          color: themeColors.textSecondary,
        },
        buttonContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: rV(15),
          gap: rS(5),
        },
        enrollButton: {
          backgroundColor: enrollDisabled
            ? themeColors.buttonDisabled
            : themeColors.buttonBackground,
          paddingVertical: rV(10),
          marginTop: rV(15),
          borderRadius: 10,
          alignItems: "center",
          opacity: enrollDisabled ? 0.5 : 1,
          flexDirection: "row", // Ensure button and loader align horizontally
        },
        continueButton: {
          paddingVertical: rV(10),
          paddingHorizontal: rS(20),
          borderRadius: 10,
          backgroundColor: themeColors.buttonBackground,
          flexDirection: "row",
          justifyContent: "center",
          width: "48%",
        },
        continueText: {
          color: themeColors.text,
          fontSize: SIZES.medium,
          fontWeight: "bold",
        },
        arrowIcon: {
          marginLeft: rS(5),
          color: themeColors.text,
        },
        progressContainer: {
          marginTop: rV(20),
          flexDirection: "row",
          alignItems: "center",
        },
        progressText: {
          color: themeColors.textSecondary,
        },
        loader: {
          marginLeft: rS(5), // Adjust spacing between button and loader if needed
        },
      }),
    [colorScheme, themeColors, enrollDisabled]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { flexWrap: "wrap" }]}>
        {course.description}
      </Text>
      <View style={styles.heading}>
        <Text style={styles.topicsNumber}>
          <MaterialCommunityIcons
            name="notebook-multiple"
            size={rMS(20)}
            color={themeColors.icon}
          />{" "}
          {topics.length} Topics
        </Text>
      </View>
      {enrolled ? (
        <>
          <View style={styles.buttonContainer}>
            <GameButton
              title="Unenroll"
              onPress={unEnrollLoading ? null : unenrollCourse}
              style={[
                styles.continueButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: rMS(2),
                  borderColor: themeColors.border,
                },
              ]}
              textStyle={styles.continueText}
            >
              {unEnrollLoading && (
                <ActivityIndicator
                  size="small"
                  color={themeColors.text}
                  style={styles.loader}
                />
              )}
            </GameButton>

            <GameButton style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueText}>
                Continue{" "}
                <FontAwesome5
                  style={styles.arrowIcon}
                  name="arrow-alt-circle-right"
                  size={SIZES.medium}
                />
              </Text>
            </GameButton>
          </View>
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              containerStyle={{
                backgroundColor: themeColors.text,
                height: rV(8),
              }}
              fillStyle={{ backgroundColor: themeColors.icon }}
            />
            <Text style={styles.progressText}>{`${progress.toFixed(
              2
            )}% Completed`}</Text>
          </View>
        </>
      ) : (
        <GameButton
          onPress={
            enrollLoading || enrollDisabled
              ? onEnrollDisabledPress
              : enrollCourse
          }
          style={[
            styles.enrollButton,
            enrollLoading && { opacity: 0.5 },
            enrollDisabled && { opacity: 0.5 },
          ]}
          title={enrollLoading ? "Enrolling..." : "Enroll"}
        >
          {enrollLoading && (
            <ActivityIndicator
              size="small"
              color={themeColors.text}
              style={styles.loader}
            />
          )}
        </GameButton>
      )}
    </View>
  );
};

export default memo(CourseInformation);
