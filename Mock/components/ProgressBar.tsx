import React from "react";
import { View, StyleSheet } from "react-native";
import { rV } from "../constants";

const ProgressBar = ({ progress, containerStyle, fillStyle }) => {
  const styles = StyleSheet.create({
    progressBar: {
      flex: 1,
      // height: rV(2),
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
      {/* <Text style={[styles.progressText, textStyle]}>{progress}%</Text> */}
    </View>
  );
};

export default ProgressBar;
