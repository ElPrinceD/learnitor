import React, { memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { ArrowLeft, Settings } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  onBack: () => void;
  onSettings?: () => void;
  showSettings?: boolean;
}

const LeaderboardTopBar: React.FC<Props> = ({
  onBack,
  onSettings,
  showSettings = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    backScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [backScale]);

  const handlePressOut = useCallback(() => {
    backScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [backScale]);

  const styles = useMemo(() => StyleSheet.create({
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(rV(80), insets.top + rV(50)),
      zIndex: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      paddingBottom: rV(8),
      paddingHorizontal: rS(16),
    },
    iconButton: {
      width: rMS(38),
      height: rMS(38),
      borderRadius: rMS(19),
      backgroundColor: themeColors.cardGlass,
      alignItems: "center",
      justifyContent: "center",
      ...shadow.light,
    },
    settingsButton: {
      marginLeft: rS(8),
    },
    spacer: {
      flex: 1,
    },
  }), [themeColors, shadow, insets.top]);

  return (
    <BlurView
      intensity={60}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={styles.topBar}
    >
      <AnimatedTouchable
        style={[styles.iconButton, backAnimStyle]}
        onPress={onBack}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <ArrowLeft size={22} color={themeColors.text} />
      </AnimatedTouchable>

      <View style={styles.spacer} />

      {showSettings && (
        <TouchableOpacity
          style={[styles.iconButton, styles.settingsButton]}
          onPress={onSettings}
          activeOpacity={0.7}
        >
          <Settings size={20} color={themeColors.text} />
        </TouchableOpacity>
      )}
    </BlurView>
  );
};

export default memo(LeaderboardTopBar);
