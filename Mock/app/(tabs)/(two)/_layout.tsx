import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../../constants/Colors";

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
            headerTitleAlign: "center",

            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="CourseDetails"
          options={{
            headerShown: true,
            title: "Course Details",
            headerTransparent: true,
            headerTitleStyle: {
              color: themeColors.text,
            },
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="EnrolledCourse" options={{ headerShown: false }} />
        <Stack.Screen
          name="(topic)"
          options={{
            headerShown: true,
            title: "Materials",
            headerTitleStyle: {
              color: themeColors.text,
            },
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="Practice" options={{ headerShown: true }} />
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
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
