import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Animated from "react-native-reanimated";
import { Flame } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";
import type { WeeklyExamStatus } from "../../services/WeeklyExamApiCalls";
import type { ExamButtonState } from "./types";

interface Props {
  examStatus: WeeklyExamStatus | null | undefined;
  examIsActive: boolean;
  examButtonState: ExamButtonState;
  examStartLocal: string;
  examEndLocal: string;
  enterAnim: (delay: number) => any;
  streak?: number;
}

const ScoreCardHero: React.FC<Props> = ({
  examStatus,
  examIsActive,
  examButtonState,
  examStartLocal,
  examEndLocal,
  enterAnim,
  streak,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const styles = StyleSheet.create({
    scoreCardOuter: {
      borderRadius: rMS(24),
      overflow: "hidden",
      marginBottom: rV(14),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      ...shadow.medium,
    },
    scoreCardInner: {
      backgroundColor: themeColors.tint + "08",
      padding: rMS(22),
      paddingBottom: rMS(18),
      position: "relative",
    },
    scoreCardStripe: {
      position: "absolute",
      top: -rV(10),
      right: -rS(40),
      width: rS(200),
      height: rS(200),
      borderRadius: rS(100),
      backgroundColor: themeColors.tint + "0C",
      transform: [{ scaleX: 1.5 }],
    },
    scoreCardAccent: {
      position: "absolute",
      bottom: -rV(20),
      left: -rS(20),
      width: rS(80),
      height: rS(80),
      borderRadius: rS(40),
      backgroundColor: themeColors.tint + "10",
    },
    scoreCardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rV(14),
    },
    scoreCardWeekLabel: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.tint,
      letterSpacing: 0.5,
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF980015",
      paddingHorizontal: rMS(10),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
      gap: rS(4),
    },
    streakText: {
      fontSize: rMS(10),
      fontWeight: "800",
      color: "#FF9800",
    },
    scoreCardMain: {
      alignItems: "center",
      marginBottom: rV(16),
    },
    scoreCardValue: {
      fontSize: rMS(64),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1.5,
      lineHeight: rMS(68),
    },
    scoreCardLabel: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.tint,
      marginTop: rV(4),
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    scoreCardBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    scoreCardAvgText: {
      fontSize: rMS(15),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    scoreCardDeadline: {
      fontSize: rMS(10),
      fontWeight: "600",
      color: themeColors.textSecondary + "BB",
    },
  });

  return (
    <Animated.View entering={enterAnim(50)}>
      <View style={styles.scoreCardOuter}>
        <View style={styles.scoreCardInner}>
          <View style={styles.scoreCardStripe} />
          <View style={styles.scoreCardAccent} />

          <View style={styles.scoreCardHeaderRow}>
            <Text style={styles.scoreCardWeekLabel}>
              {examStatus?.seasonName ? `${examStatus.seasonName} · ` : ""}
              {examStatus?.currentWeek
                ? `Study Week ${examStatus.currentWeek}`
                : "Study Week"}
            </Text>
            {streak !== undefined && streak > 0 && (
              <View style={styles.streakBadge}>
                <Flame size={12} color="#FF9800" fill="#FF9800" />
                <Text style={styles.streakText}>{streak} Day Streak</Text>
              </View>
            )}
          </View>

          <View style={styles.scoreCardMain}>
            <Text style={styles.scoreCardValue}>
              {examStatus?.userScore ?? "\u2014"}
            </Text>
            <Text style={styles.scoreCardLabel}>Your Score</Text>
          </View>

          <View style={styles.scoreCardBottom}>
            <Text style={styles.scoreCardAvgText}>
              Average ·{" "}
              {examButtonState === "completed" || examButtonState === "expired"
                ? (examStatus?.globalAverage ?? "\u2014")
                : "\u2014"}
            </Text>
            <Text style={styles.scoreCardDeadline}>
              {examIsActive
                ? `Ends ${examEndLocal}`
                : examButtonState === "completed" ||
                  examButtonState === "expired"
                ? "Exam completed"
                : `Starts ${examStartLocal}`}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default memo(ScoreCardHero);
