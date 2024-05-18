import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Tab2Layout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="four"
          options={{ headerShown: false }} // Hide the header
        />
        <Stack.Screen
          name="AccountSettings"
          options={{ headerShown: true, presentation: 'modal', headerTitle: "Account Settings", }} 
          
        />
         <Stack.Screen
          name="ReportProblem"
          options={{ headerShown: true, presentation: 'modal', headerTitle: "Account Settings", }} 
          
        />
      </Stack>
    </SafeAreaProvider>
  );
}