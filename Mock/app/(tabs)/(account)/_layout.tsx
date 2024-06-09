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
          name="four"
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

            headerShadowVisible: false,
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

            headerShadowVisible: false,
            presentation: "modal",
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
      </Stack>
    </SafeAreaProvider>
  );
}
