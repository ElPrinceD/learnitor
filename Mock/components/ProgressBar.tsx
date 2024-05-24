import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ProgressBar = ({ progress }) => {
  const styles = StyleSheet.create({
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: "#ffffff",
      borderRadius: 5,
      marginRight: 10,
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#e6ac6a",
      borderRadius: 5,
    },
    progressText: {
      color: "#000",
    },
  });

  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
  );
};

export default ProgressBar;
