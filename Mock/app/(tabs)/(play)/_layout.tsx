import { Stack } from "expo-router";
import React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function PlayTabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack>
          <Stack.Screen
            name="play"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
