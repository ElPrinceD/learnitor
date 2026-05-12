import React, { memo, useCallback, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type { PlayMode } from "./types";

interface Props {
  activeMode: PlayMode;
  onChange: (mode: PlayMode) => void;
  enterAnim: (delay: number) => any;
}

const PlayModeToggle: React.FC<Props> = ({
  activeMode,
  onChange,
  enterAnim,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const toggleIndicatorX = useSharedValue(0);
  const toggleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleIndicatorX.value }],
  }));

  useEffect(() => {
    const targetX =
      activeMode === "rankings"
        ? 0
        : (Dimensions.get("window").width - rS(32) - rMS(6)) / 2;
    toggleIndicatorX.value = withTiming(targetX, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [activeMode, toggleIndicatorX]);

  const handlePressRankings = useCallback(() => {
    onChange("rankings");
  }, [onChange]);
  const handlePressKnockout = useCallback(() => {
    onChange("knockout");
  }, [onChange]);

  const styles = StyleSheet.create({
    toggleContainer: {
      flexDirection: "row",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(3),
      marginBottom: rV(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      position: "relative",
    },
    toggleIndicator: {
      position: "absolute",
      top: rMS(3),
      bottom: rMS(3),
      left: rMS(3),
      width: "50%",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
    },
    toggleButton: {
      flex: 1,
      paddingVertical: rV(10),
      borderRadius: rMS(22),
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    toggleText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    toggleTextActive: {
      color: "#fff",
    },
  });

  return (
    <Animated.View entering={enterAnim(150)} style={styles.toggleContainer}>
      <Animated.View style={[styles.toggleIndicator, toggleAnimatedStyle]} />
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handlePressRankings}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.toggleText,
            activeMode === "rankings" && styles.toggleTextActive,
          ]}
        >
          Rankings
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handlePressKnockout}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.toggleText,
            activeMode === "knockout" && styles.toggleTextActive,
          ]}
        >
          Knockout
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(PlayModeToggle);
