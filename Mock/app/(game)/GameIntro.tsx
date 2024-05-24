import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import GameButton from "../../components/GameButton";

export default function GameIntro() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Quiz Game!</Text>
      <GameButton
        title="Create Game"
        onPress={() => router.navigate("GameCourses")}
      />
      <GameButton
        title="Join Game"
        onPress={() => router.navigate("JoinGame")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
});
