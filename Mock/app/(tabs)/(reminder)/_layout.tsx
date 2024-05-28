import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import React from "react";
import { Pressable, useColorScheme} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../../constants/Colors";

export default function Tab3Layout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="three"
          options={{ headerShown: true,  headerShadowVisible: false,
            headerStyle: {
              
              backgroundColor: "#fdecd2", // Add this line
            }, 
            headerTitle: "Schedule",
            headerTitleAlign: "center",
            headerRight: () => (
            <Link href="../(reminder)/TimelineCategory" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="add"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ), }} // Hide the header
        />
        <Stack.Screen
          name="EditPlan"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Edit Task",
          }}
        />
        <Stack.Screen
          name="TimelineCategory"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Categories",
          }}
        />
        <Stack.Screen
          name="createNewTime"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Create New Schedule",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
