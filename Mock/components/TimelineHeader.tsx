import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TimelineHeader: React.FC = () => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Easy way to note your task</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#1f3e4c",
    padding: 20,
    borderRadius: 10,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default TimelineHeader;
