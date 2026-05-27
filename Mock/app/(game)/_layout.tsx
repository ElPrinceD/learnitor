import { Stack } from "expo-router";
import React from "react";
import { GameAudioProvider } from "../../contexts/GameAudioContext";

const smoothFade = {
  animation: "fade" as const,
  config: {
    duration: 250,
  },
};

export default function GameLayout() {
  return (
    <GameAudioProvider>
    <Stack
      initialRouteName="GameIntro"
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 280,
      }}
    >
      <Stack.Screen
        name="GameIntro"
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="GameCourses"
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen name="GameTopics" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="GameWaiting" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="GameLevel" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="Results"
        options={{ gestureEnabled: true, animation: "fade" }}
      />
      <Stack.Screen name="Game" options={{ animation: "fade" }} />
      <Stack.Screen name="SinglePlayerGame" options={{ animation: "fade" }} />
      <Stack.Screen name="Leaderboard" options={{ gestureEnabled: true }} />
      <Stack.Screen name="LeaderboardDetail" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
      <Stack.Screen name="WeeklyExamIntro" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
      <Stack.Screen name="WeeklyExam" options={{ animation: "fade" }} />
      <Stack.Screen name="SquadSettings" options={{ gestureEnabled: true, animation: "slide_from_right" }} />
    </Stack>
    </GameAudioProvider>
  );
}
