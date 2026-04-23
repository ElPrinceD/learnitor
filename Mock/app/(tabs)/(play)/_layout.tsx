import { Stack } from "expo-router";
import React from "react";

export default function PlayTabLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="play"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
