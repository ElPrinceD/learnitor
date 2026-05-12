import React, { memo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  Flame,
  Music,
  Music2,
  Volume2,
  VolumeX,
} from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants/index.js";

interface Props {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentStreak: number;
  // Milliseconds remaining on the current question.
  timeLeft: number;
  // RN Animated.Value driving the progress bar fill (0..100) — owned by the
  // parent game screen's timer effect. Passed in so the timer logic stays
  // exactly where it lives today.
  progressBarWidth: Animated.Value;
  progressBarPulse: Animated.Value;
  questionCounterPulse: Animated.Value;
  musicMuted: boolean;
  soundMuted: boolean;
  onToggleMusic: () => void;
  onToggleSound: () => void;
}

const QuizGlassHeader: React.FC<Props> = ({
  currentQuestionIndex,
  totalQuestions,
  currentStreak,
  timeLeft,
  progressBarWidth,
  progressBarPulse,
  questionCounterPulse,
  musicMuted,
  soundMuted,
  onToggleMusic,
  onToggleSound,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const questionsRemaining = totalQuestions - currentQuestionIndex;

  const styles = StyleSheet.create({
    headerBlur: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: Math.max(rV(20), insets.top + rV(10)),
      paddingBottom: rV(16),
      borderBottomLeftRadius: rMS(32),
      borderBottomRightRadius: rMS(32),
      overflow: "hidden",
      zIndex: 10,
    },
    timerRowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(24),
    },
    innerRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    questionCounterText: {
      fontSize: rMS(16),
      fontWeight: "900",
      textAlign: "left",
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F97316" + "18",
      paddingHorizontal: rMS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
      marginLeft: rS(8),
    },
    streakText: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: "#F97316",
      marginLeft: rS(4),
    },
    progressBarContainer: {
      alignItems: "center",
      width: rS(120),
      marginLeft: rS(16),
    },
    progressBarBackground: {
      width: "100%",
      height: rV(6),
      backgroundColor: themeColors.background + "80",
      borderRadius: rMS(3),
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: rMS(3),
      alignSelf: "flex-start",
    },
    muteButton: {
      padding: rMS(4),
    },
  });

  return (
    <BlurView
      intensity={80}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={styles.headerBlur}
    >
      <View style={styles.timerRowContainer}>
        <View style={styles.innerRow}>
          <Animated.Text
            style={[
              styles.questionCounterText,
              {
                color:
                  questionsRemaining <= 5 ? "#FF0000" : themeColors.text,
                transform: [{ scale: questionCounterPulse }],
              },
            ]}
          >
            {currentQuestionIndex + 1}/{totalQuestions}
          </Animated.Text>
          {currentStreak >= 2 && (
            <View style={styles.streakBadge}>
              <Flame size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{currentStreak}</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressBarWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                      extrapolate: "clamp",
                    }),
                    backgroundColor:
                      timeLeft <= 5000 ? "#DC2626" : themeColors.tint,
                    transform: [{ scale: progressBarPulse }],
                  },
                ]}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={onToggleMusic}
            style={[styles.muteButton, { marginLeft: rS(8) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {musicMuted ? (
              <Music2 size={22} color={themeColors.textSecondary} />
            ) : (
              <Music size={22} color={themeColors.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleSound}
            style={[styles.muteButton, { marginLeft: rS(4) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {soundMuted ? (
              <VolumeX size={22} color={themeColors.textSecondary} />
            ) : (
              <Volume2 size={22} color={themeColors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
};

export default memo(QuizGlassHeader);
