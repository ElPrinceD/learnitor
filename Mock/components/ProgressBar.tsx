import React, { memo } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import isEqual from "lodash/isEqual"; // For deep equality comparison
import Colors from "../constants/Colors";
import { rMS } from "../constants";

interface ProgressBarProps {
  progress: number;
  containerStyle?: object;
  fillStyle?: object;
}

const arePropsEqual = (
  prevProps: ProgressBarProps,
  nextProps: ProgressBarProps
) => {
  return (
    prevProps.progress === nextProps.progress &&
    isEqual(prevProps.containerStyle, nextProps.containerStyle) &&
    isEqual(prevProps.fillStyle, nextProps.fillStyle)
  );
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  containerStyle,
  fillStyle,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    progressBar: {
      flex: 1,
      backgroundColor: themeColors.border,
      borderRadius: rMS(4),
      marginRight: 10,
      height: 6,
    },
    progressFill: {
      height: "100%",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(4),
    },
  });

  return (
    <View style={[styles.progressBar, containerStyle]}>
      <View
        style={[styles.progressFill, { width: `${progress}%` }, fillStyle]}
      />
    </View>
  );
};

export default memo(ProgressBar, arePropsEqual);
