import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../../constants/Colors"; // Adjust the import path as necessary

export default function Tab2Layout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="two"
          options={{
            headerShown: true,
            headerTitle: () => (
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                Courses
              </Text>
            ),
            headerStyle: {
              backgroundColor: themeColors.background,
            },

            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="CourseDetails"
          options={{
            headerShown: true,
            title: "Course Details",
            headerTransparent: true,
            headerStyle: {
              backgroundColor: "transparent",
            },
            headerTitleStyle: {
              color: themeColors.text,
            },
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="EnrolledCourse" options={{ headerShown: false }} />
        <Stack.Screen name="(topic)" options={{ headerShown: false }} />
        <Stack.Screen name="Practice" options={{ headerShown: true,  headerTitleAlign: "center", }} />
        <Stack.Screen
          name="PracticeInstructions"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="PracticeQuestions"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="ScorePage"
          options={{ headerShown: true, presentation: "modal" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
