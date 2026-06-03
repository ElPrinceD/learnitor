import { Redirect } from "expo-router";
import React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAuth } from "../../store/authStore";
import { JsStack, fastStackTransition } from "../../navigation/JsStack";

const VerificationLayout = () => {
  const { userToken, isLoading } = useAuth();

  if (!isLoading && userToken) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <BottomSheetModalProvider>
    <JsStack
      screenOptions={{
        headerShown: false,
        ...fastStackTransition,
      }}
    >
      <JsStack.Screen name="Intro" />
      <JsStack.Screen name="SignUp" />
      <JsStack.Screen name="ContinueWithEmail" />
      <JsStack.Screen name="ConsentScreen" />
      <JsStack.Screen name="LogIn" />
      <JsStack.Screen name="ForgotPassword" />
      <JsStack.Screen name="Verification" />
    </JsStack>
    </BottomSheetModalProvider>
  );
};

export default VerificationLayout;

