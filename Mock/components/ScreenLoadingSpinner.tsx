import React, { memo } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "../constants/Colors";

interface Props {
  /** Override the default flex:1 centered layout. */
  style?: object;
}

/**
 * Themed, fade-in loading spinner used as a placeholder while
 * screen data is being fetched. Shows only the spinner (no text).
 */
const ScreenLoadingSpinner: React.FC<Props> = ({ style }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.container, style]}>
      <ActivityIndicator size="large" color={themeColors.tint} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});

export default memo(ScreenLoadingSpinner);
