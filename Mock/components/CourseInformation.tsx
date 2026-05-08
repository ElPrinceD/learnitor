import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { BookOpen, ArrowRight } from "lucide-react-native";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import GameButton from "../components/GameButton";
import { Topic, Course } from "./types";

interface CourseInformationProps {
  course: Course;
  enrollCourse: () => void;
  handleContinue: () => void;
  unenrollCourse: () => void;
  progress: number;
  enrolled: boolean;
  enrollDisabled: boolean;
  onEnrollDisabledPress: () => void;
  topics: Topic[];
  enrollLoading: boolean;
  unEnrollLoading: boolean;
}

const CourseInformation: React.FC<CourseInformationProps> = ({
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
  const shadow = useShadows();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: rMS(16),
          backgroundColor: themeColors.background,
        },
        description: {
          fontSize: rMS(13),
          marginBottom: rV(16),
          color: themeColors.textSecondary,
          lineHeight: rMS(20),
          fontWeight: "600",
        },
        heading: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: rV(4),
        },
        topicsNumber: {
          fontSize: rMS(13),
          color: themeColors.tint,
          fontWeight: "800",
          flexDirection: "row",
          alignItems: "center",
        },
        topicsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: rS(6),
        },
        buttonContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: rV(16),
          gap: rS(8),
        },
        enrollButton: {
          backgroundColor: enrollDisabled
            ? themeColors.buttonDisabled
            : themeColors.buttonBackground,
          paddingVertical: rV(14),
          marginTop: rV(16),
          borderRadius: rMS(24),
          alignItems: "center",
          opacity: enrollDisabled ? 0.5 : 1,
          flexDirection: "row",
          justifyContent: "center",
        },
        continueButton: {
          paddingVertical: rV(12),
          paddingHorizontal: rS(20),
          borderRadius: rMS(24),
          backgroundColor: themeColors.buttonBackground,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "48%",
          gap: rS(6),
        },
        unenrollButton: {
          paddingVertical: rV(12),
          paddingHorizontal: rS(20),
          borderRadius: rMS(24),
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: themeColors.border,
          flexDirection: "row",
          justifyContent: "center",
          width: "48%",
        },
        continueText: {
          color: "#fff",
          fontSize: rMS(13),
          fontWeight: "800",
        },
        unenrollText: {
          color: themeColors.text,
          fontSize: rMS(13),
          fontWeight: "700",
        },
        progressContainer: {
          marginTop: rV(16),
          backgroundColor: themeColors.cardGlass,
          borderRadius: rMS(20),
          padding: rMS(14),
          borderWidth: 1,
          borderColor: themeColors.border + "40",
        },
        progressRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: rV(8),
        },
        progressLabel: {
          fontSize: rMS(11),
          fontWeight: "700",
          color: themeColors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        progressText: {
          fontSize: rMS(13),
          fontWeight: "800",
          color: themeColors.tint,
        },
        loader: {
          marginLeft: rS(6),
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
        <View style={styles.topicsRow}>
          <BookOpen size={18} color={themeColors.tint} />
          <Text style={styles.topicsNumber}>
            {topics.length} Topics
          </Text>
        </View>
      </View>
      {enrolled ? (
        <>
          <View style={styles.buttonContainer}>
            <GameButton
              title="Unenroll"
              onPress={unEnrollLoading ? undefined : unenrollCourse}
              style={styles.unenrollButton}
              textStyle={styles.unenrollText}
            >
              {unEnrollLoading && (
                <ActivityIndicator
                  size="small"
                  color={themeColors.text}
                  style={styles.loader}
                />
              )}
            </GameButton>

            <GameButton
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>Continue</Text>
              <ArrowRight size={16} color="#fff" />
            </GameButton>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>{`${progress.toFixed(
                1
              )}%`}</Text>
            </View>
            <ProgressBar progress={progress} />
          </View>
        </>
      ) : (
        <GameButton
          onPress={
            enrollLoading || enrollDisabled
              ? onEnrollDisabledPress
              : enrollCourse
          }
          style={{
            ...styles.enrollButton,
            opacity: (enrollLoading || enrollDisabled) ? 0.5 : 1,
          }}
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
