import React, { memo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  CheckCircle2,
  Clock,
  FileText,
  Gamepad2,
} from "lucide-react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type { ExamButtonState } from "./types";

interface Props {
  examButtonState: ExamButtonState;
  onPlayPress: () => void;
  onExamPress: () => void;
  enterAnim: (delay: number) => any;
}

const ExamActionRow: React.FC<Props> = ({
  examButtonState,
  onPlayPress,
  onExamPress,
  enterAnim,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const playFill = useSharedValue(0);
  const examFill = useSharedValue(0);

  const playBtnAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      playFill.value,
      [0, 1],
      ["transparent", themeColors.tint]
    ),
  }));
  const examBtnAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      examFill.value,
      [0, 1],
      ["transparent", themeColors.tint]
    ),
  }));

  const onPlayPressIn = useCallback(() => {
    playFill.value = withTiming(1, {
      duration: 120,
      easing: Easing.linear,
    });
  }, [playFill]);
  const onPlayPressOut = useCallback(() => {
    playFill.value = withTiming(0, {
      duration: 180,
      easing: Easing.linear,
    });
  }, [playFill]);
  const onExamPressIn = useCallback(() => {
    examFill.value = withTiming(1, {
      duration: 120,
      easing: Easing.linear,
    });
  }, [examFill]);
  const onExamPressOut = useCallback(() => {
    examFill.value = withTiming(0, {
      duration: 180,
      easing: Easing.linear,
    });
  }, [examFill]);

  const styles = StyleSheet.create({
    actionRow: {
      flexDirection: "row",
      gap: rS(10),
      marginBottom: rV(16),
    },
    ghostButton: {
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      borderWidth: 1.5,
      borderColor: themeColors.tint,
    },
    ghostButtonText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.tint,
    },
  });

  const showExamButton =
    examButtonState !== "hidden" && examButtonState !== "expired";

  return (
    <Animated.View entering={enterAnim(100)} style={styles.actionRow}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPlayPressIn}
        onPressOut={onPlayPressOut}
        onPress={onPlayPress}
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.ghostButton, playBtnAnimStyle]}>
          <Gamepad2 size={18} color={themeColors.tint} />
          <Text style={styles.ghostButtonText}>Play Game</Text>
        </Animated.View>
      </TouchableOpacity>

      {showExamButton && (
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onExamPressIn}
          onPressOut={onExamPressOut}
          disabled={examButtonState !== "active"}
          onPress={onExamPress}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={[
              styles.ghostButton,
              examBtnAnimStyle,
              examButtonState === "completed" && { borderColor: "#4CAF50" },
            ]}
          >
            {examButtonState === "completed" ? (
              <CheckCircle2 size={16} color="#4CAF50" />
            ) : examButtonState === "active" ? (
              <FileText size={16} color={themeColors.tint} />
            ) : (
              <Clock size={16} color={themeColors.tint} />
            )}
            <Text
              style={[
                styles.ghostButtonText,
                examButtonState === "completed" && { color: "#4CAF50" },
              ]}
            >
              {examButtonState === "teaser"
                ? "Exam Soon"
                : examButtonState === "active"
                ? "Weekly Exam"
                : "Completed"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default memo(ExamActionRow);
