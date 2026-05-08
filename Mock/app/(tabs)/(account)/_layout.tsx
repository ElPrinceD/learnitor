import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import Colors from "../../../constants/Colors";
import { rMS } from "../../../constants";

export default function AccountLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const headerTitleStyle = {
    fontWeight: "900" as const,
    fontSize: rMS(16),
    color: themeColors.text,
  };

  const headerStyle = {
    backgroundColor: themeColors.background,
  };

  return (
    <Stack>
      <Stack.Screen
        name="four"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SettingsPage"
        options={{
          headerShown: true,
          headerTitle: "Settings",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        options={{
          headerShown: true,
          headerTitle: "Account",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerBackTitle: "Back",
          headerShadowVisible: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ReportProblem"
        options={{
          headerShown: true,
          headerTitle: "Report an Issue",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="FAQScreen"
        options={{
          headerShown: true,
          headerTitle: "FAQs",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ConsentSettings"
        options={{
          headerShown: true,
          headerTitle: "Privacy Settings",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerBackTitle: "Back",
          headerShadowVisible: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
