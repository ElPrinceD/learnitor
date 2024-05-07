import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Tab2Layout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="two"
          options={{ headerShown: false }} // Hide the header
        />
        <Stack.Screen
          name="CourseDetails"
          options={{ headerShown: false }} // Hide the header
        />
        <Stack.Screen
          name="EnrolledCourse"
          options={{ headerShown: false }} // Hide the header
        />
        <Stack.Screen
          name="Topic"
          options={{ headerShown: false }} // Hide the header
        />
      </Stack>
    </SafeAreaProvider>
  );
}
