import React from "react";
import { useColorScheme } from "react-native";
import Colors from "../../../constants/Colors";
import { rMS } from "../../../constants";
import { JsStack, fastStackTransition } from "../../../navigation/JsStack";
import { CardStyleInterpolators } from "@react-navigation/stack";

export default function AccountLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const headerTitleStyle = {
    fontWeight: "900" as const,
    fontSize: rMS(16),
    color: themeColors.text,
  };

  const headerStyle = {
    backgroundColor: themeColors.background,
  };

  return (
    <JsStack
      screenOptions={{
        headerShown: false,
        ...fastStackTransition,
      }}
    >
      <JsStack.Screen
        name="four"
        options={{
          headerShown: false,
        }}
      />
      <JsStack.Screen
        name="SettingsPage"
        options={{
          headerShown: true,
          headerTitle: "Settings",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
        }}
      />
      <JsStack.Screen
        name="AccountSettings"
        options={{
          headerShown: true,
          headerTitle: "Account",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerBackTitle: "Back",
          headerShadowVisible: false,
        }}
      />
      <JsStack.Screen
        name="ReportProblem"
        options={{
          headerShown: true,
          headerTitle: "Report an Issue",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      />
      <JsStack.Screen
        name="FAQScreen"
        options={{
          headerShown: true,
          headerTitle: "FAQs",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerShadowVisible: false,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      />
      <JsStack.Screen
        name="ConsentSettings"
        options={{
          headerShown: true,
          headerTitle: "Privacy Settings",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerBackTitle: "Back",
          headerShadowVisible: false,
        }}
      />
      <JsStack.Screen
        name="ProfileInsights"
        options={{
          headerShown: true,
          headerTitle: "Your Insights",
          headerTitleAlign: "center",
          headerTitleStyle,
          headerStyle,
          headerBackTitle: "Back",
          headerShadowVisible: false,
        }}
      />
    </JsStack>
  );
}

