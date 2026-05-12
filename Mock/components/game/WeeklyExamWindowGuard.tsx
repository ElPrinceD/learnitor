import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Clock } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants/index.js";
import type { WeeklyExamStatus } from "../../services/WeeklyExamApiCalls";

interface Props {
  examStatus: WeeklyExamStatus | undefined;
  onGoBack: () => void;
}

function getCountdownToDate(targetDateStr?: string): string {
  const now = new Date();
  let target: Date;

  if (targetDateStr) {
    target = new Date(targetDateStr);
  } else {
    // Fallback: calculate next Friday 7pm UTC
    const daysUntilFriday = (5 - now.getUTCDay() + 7) % 7 || 7;
    target = new Date(now);
    target.setUTCDate(now.getUTCDate() + daysUntilFriday);
    target.setUTCHours(19, 0, 0, 0);
    if (target <= now) target.setUTCDate(target.getUTCDate() + 7);
  }

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now!";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

function formatLocalDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

const WeeklyExamWindowGuard: React.FC<Props> = ({ examStatus, onGoBack }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const examIsUpcoming =
    !!examStatus && new Date() < new Date(examStatus.startsAt);
  const examIsOver = !!examStatus && new Date() > new Date(examStatus.endsAt);

  const styles = StyleSheet.create({
    guardContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(32),
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(100),
      left: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(50),
      right: -rS(100),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: "#6366F118",
    },
    guardCard: {
      borderRadius: rMS(40),
      overflow: "hidden",
      ...shadow.extraLarge,
      width: "100%",
    },
    guardCardBlur: {
      padding: rMS(32),
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
    },
    guardTitle: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(12),
      marginTop: rV(16),
      letterSpacing: -0.5,
    },
    guardSubtext: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(22),
      marginBottom: rV(32),
      fontWeight: "600",
    },
    guardCountdown: {
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.tint,
      textAlign: "center",
      marginBottom: rV(32),
      letterSpacing: -1,
    },
    guardBackBtn: {
      backgroundColor: themeColors.text,
      paddingVertical: rV(16),
      paddingHorizontal: rMS(32),
      borderRadius: rMS(32),
      width: "100%",
    },
    guardBackBtnText: {
      fontSize: rMS(15),
      fontWeight: "900",
      color: themeColors.background,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
  });

  return (
    <View style={styles.guardContainer}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <Animated.View
        entering={FadeInUp.duration(600).springify()}
        style={styles.guardCard}
      >
        <BlurView
          intensity={80}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={styles.guardCardBlur}
        >
          <Clock size={64} color={themeColors.tint} />
          <Text style={styles.guardTitle}>Weekly Exam</Text>
          <Text style={styles.guardSubtext}>
            {examIsUpcoming
              ? `The exam starts ${formatLocalDateTime(
                  examStatus?.startsAt
                )}.`
              : examIsOver
              ? `The exam has ended. It ended ${formatLocalDateTime(
                  examStatus?.endsAt
                )}.`
              : "The exam window opens every Friday at 7:00 PM UTC and closes Sunday at 11:59 PM UTC."}
          </Text>
          {examIsUpcoming && (
            <Text style={styles.guardCountdown}>
              {getCountdownToDate(examStatus?.startsAt)}
            </Text>
          )}
          {!examIsUpcoming && !examIsOver && (
            <Text style={styles.guardCountdown}>{getCountdownToDate()}</Text>
          )}
          <TouchableOpacity
            style={styles.guardBackBtn}
            onPress={onGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.guardBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </View>
  );
};

export default memo(WeeklyExamWindowGuard);
