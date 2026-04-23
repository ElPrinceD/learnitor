import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text } from "react-native";
import Colors from "../../../constants/Colors";

export default function AccountLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
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
          headerTitle: () => (
            <Text
              style={{
                color: themeColors.text,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Settings
            </Text>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleAlign: "center",
          headerBackTitle: "Back",
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="AccountSettings"
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
              Account
            </Text>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleAlign: "center",
          headerBackTitle: "Back",
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="ReportProblem"
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
              Report an Issue
            </Text>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleAlign: "center",
          headerShadowVisible: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="FAQScreen"
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
              FAQs
            </Text>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleAlign: "center",
          headerShadowVisible: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ConsentSettings"
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
              Privacy Settings
            </Text>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTitleAlign: "center",
          headerBackTitle: "Back",
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}
