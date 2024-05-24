import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function ResultsScreen({ route }) {
  const { results } = route.params;

  return (
    <View style={styles.container}>
      <Text>Results</Text>
      {results.map((result, index) => (
        <Text key={index}>
          {index + 1}. {result.name}: {result.score}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
