import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
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
            // headerRight: () => (
            //   <Link href="../(reminder)/TimeTable" asChild>
            //     <Pressable>
            //       {({ pressed }) => (
            //         <MaterialCommunityIcons
            //           name="timetable"
            //           size={25}
            //           color={Colors[colorScheme ?? "light"].text}
            //           style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
            //         />
            //       )}
            //     </Pressable>
            //   </Link>
            // ),
          }} // Hide the header
        />
        <Stack.Screen
          name="EditPlan"
          options={{
            headerShown: true,
            presentation: "modal",
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
          name="TimeTable"
          options={{
            headerShown: true,
            presentation: "modal",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            animation: "slide_from_bottom",

            headerTitle: "TimeTables",
            headerTitleAlign: "center",
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="createNewTime"
          options={{
            headerShown: true,
            presentation: "containedModal",
            headerBackTitle: "Back",
            animation: "fade_from_bottom",
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
        {/* <Stack.Screen
          name="CourseForm"
          options={{
            headerShown: false,
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "Create TimeTable",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
          }}
        /> */}
      </Stack>
    </SafeAreaProvider>
  );
}
