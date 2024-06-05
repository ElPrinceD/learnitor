import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function GameLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="GameIntro" options={{ headerShown: false }} />
        <Stack.Screen name="GameCourses" options={{ headerShown: false }} />
        <Stack.Screen name="GameTopics" options={{ headerShown: false }} />
        <Stack.Screen name="GameWaiting" options={{ headerShown: false }} />
        <Stack.Screen name="GameLevel" options={{ headerShown: false }} />
        <Stack.Screen name="Results" options={{ headerShown: false }} />
        <Stack.Screen name="Game" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
