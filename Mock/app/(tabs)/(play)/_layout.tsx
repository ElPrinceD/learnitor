import { Stack } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function PlayTabLayout() {
  return (
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
  );
}
