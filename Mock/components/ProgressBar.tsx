import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import isEqual from "lodash/isEqual"; // For deep equality comparison

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
  const styles = StyleSheet.create({
    progressBar: {
      flex: 1,
      backgroundColor: "#ffffff",
      borderRadius: 5,
      marginRight: 10,
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#e6ac6a",
      borderRadius: 5,
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
