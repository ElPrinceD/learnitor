import { Stack } from "expo-router";
import React from "react";

const VerificationLayout = () => {
  console.log("[VerificationLayout] Rendering");
  try {
    return (
      <Stack>
        <Stack.Screen name="Intro" options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" options={{ headerShown: false }} />
        <Stack.Screen name="ContinueWithEmail" options={{ headerShown: false }} />
        <Stack.Screen name="ConsentScreen" options={{ headerShown: false }} />

        <Stack.Screen name="LogIn" options={{ headerShown: false }} />

        <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />

        <Stack.Screen name="Verification" options={{ headerShown: false }} />
      </Stack>
    );
  } catch (error) {
    console.error("[VerificationLayout] Error rendering:", error);
    throw error;
  }
};

export default VerificationLayout;
