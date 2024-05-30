import { Stack } from "expo-router";
import React from "react";

const VerificationLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="Intro" options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" options={{ headerShown: false }} />
      <Stack.Screen name="ContinueWithEmail" options={{ headerShown: false }} />

      <Stack.Screen name="LogIn" options={{ headerShown: false }} />

      <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />

      <Stack.Screen name="Verification" options={{ headerShown: false }} />
    </Stack>
  );
};

export default VerificationLayout;
