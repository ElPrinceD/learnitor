import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Stack } from "expo-router";
import React from "react";
import { Pressable, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../../constants/Colors";

export default function Tab3Layout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="three"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: themeColors.tabIconSelected,
            },
            headerTitle: "Schedule",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerRight: () => (
              <Pressable onPressIn={() => router.navigate("createNewTime")}>
                {({ pressed }) => (
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="EditPlan"
          options={{
            headerShown: true,
            presentation: "containedModal",
            animation: "slide_from_right",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "Edit Schedule",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
          }}
        />
       
        <Stack.Screen
          name="createNewTime"
          options={{
            headerShown: true,
            presentation: "card",
            headerBackTitle: "Back",
            // animation: "fade_from_bottom",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "New",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
          }}
        />
    
      </Stack>
    </SafeAreaProvider>
  );
}
