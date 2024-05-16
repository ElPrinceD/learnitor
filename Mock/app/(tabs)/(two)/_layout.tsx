import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Tab2Layout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="two" options={{ headerShown: false }} />
        <Stack.Screen name="CourseDetails" options={{ headerShown: false }} />
        <Stack.Screen name="EnrolledCourse" options={{ headerShown: false }} />
        <Stack.Screen name="(topic)" options={{ headerShown: false }} />
        <Stack.Screen name="Practice" options={{ headerShown: false }} />
        <Stack.Screen
          name="PracticeInstructions"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="PracticeQuestions"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="ScorePage"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
