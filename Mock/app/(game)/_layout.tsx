import { Stack } from "expo-router";
import React from "react";

export default function GameLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="GameIntro"
        options={{ headerShown: false, gestureEnabled: true }}
      />
      <Stack.Screen
        name="GameCourses"
        options={{ headerShown: false, gestureEnabled: true }}
      />
      <Stack.Screen name="GameTopics" options={{ headerShown: false }} />
      <Stack.Screen name="GameWaiting" options={{ headerShown: false }} />
      <Stack.Screen name="GameLevel" options={{ headerShown: false }} />
      <Stack.Screen
        name="Results"
        options={{ headerShown: false, gestureEnabled: true }}
      />
      <Stack.Screen name="Game" options={{ headerShown: false }} />
    </Stack>
  );
}
