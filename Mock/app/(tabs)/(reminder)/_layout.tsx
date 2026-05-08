import { Stack, router } from "expo-router";
import React from "react";
import { Pressable, useColorScheme } from "react-native";
import { PlusCircle } from "lucide-react-native";
import Colors from "../../../constants/Colors";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { rMS, rS } from "../../../constants";

export default function Tab3Layout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <BottomSheetModalProvider>
      <Stack>
        <Stack.Screen
          name="three"
          options={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: themeColors.tint,
            },
            headerTitle: "Schedule",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "900",
              fontSize: rMS(25),
              color: "#fff",
            },
            headerRight: () => (
              <Pressable onPressIn={() => router.navigate("createNewTime")}>
                {({ pressed }) => (
                  <PlusCircle
                    size={24}
                    color="#fff"
                    style={{ marginRight: rS(12), opacity: pressed ? 0.5 : 1 }}
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
              fontWeight: "900",
              fontSize: rMS(16),
              color: themeColors.text,
            },
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="createNewTime"
          options={{
            headerShown: true,
            presentation: "card",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "New Schedule",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "900",
              fontSize: rMS(16),
              color: themeColors.text,
            },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </BottomSheetModalProvider>
  );
}
