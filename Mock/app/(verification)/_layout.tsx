import { Redirect, Stack } from "expo-router";
import React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAuth } from "../../store/authStore";

const VerificationLayout = () => {
  const { userToken, isLoading } = useAuth();

  if (!isLoading && userToken) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <BottomSheetModalProvider>
    <Stack>
      <Stack.Screen name="Intro" options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" options={{ headerShown: false }} />
      <Stack.Screen name="ContinueWithEmail" options={{ headerShown: false }} />
      <Stack.Screen name="ConsentScreen" options={{ headerShown: false }} />

      <Stack.Screen name="LogIn" options={{ headerShown: false }} />

      <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />

      <Stack.Screen name="Verification" options={{ headerShown: false }} />
    </Stack>
    </BottomSheetModalProvider>
  );
};

export default VerificationLayout;
