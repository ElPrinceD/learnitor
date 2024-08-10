import React from "react";
import { View, StyleSheet } from "react-native";

const ProgressBar = ({ progress, containerStyle, fillStyle }) => {
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

export default ProgressBar;
