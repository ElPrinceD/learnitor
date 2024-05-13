import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Tab3Layout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="three"
          options={{ headerShown: false }} // Hide the header
        />
         <Stack.Screen
          name="EditPlan"
          options={{ headerShown: true, presentation: 'modal', headerTitle: "Edit Task", }} 
          
        />
        <Stack.Screen
          name="Categories"
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
        <Stack.Screen
          name="EditTaskScreen"
          options={{
            headerShown: true,
            presentation: "modal",
            headerTitle: "Edit Task",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
