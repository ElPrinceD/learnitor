import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { FontAwesome } from "@expo/vector-icons";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../components/AuthContext"; // Update the path
import { useColorScheme } from "../components/useColorScheme";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../QueryClient";

import { WebSocketProvider } from "../webSocketProvider"; // Update the import path
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
export { ErrorBoundary } from "expo-router";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();
  const [navigationCompleted, setNavigationCompleted] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === "(tabs)";

    if (userToken && !inTabsGroup) {
      router.replace({ pathname: "/home" });
    } else if (!userToken) {
      router.replace("/Intro");
    }
    setNavigationCompleted(true); // Set navigation completion flag
  }, [isLoading, userToken]);

  useEffect(() => {
    if (navigationCompleted) {
      SplashScreen.hideAsync();
    }
  }, [navigationCompleted]);

  return (
    <BottomSheetModalProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider token={userToken?.token}>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(verification)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, headerShadowVisible: false }}
                  />

                  <Stack.Screen
                    name="(game)"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </ThemeProvider>
            </WebSocketProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
};

const RootLayout = () => {
  return (
    <AuthProvider>
      <RootSiblingParent>
        <RootLayoutNav />
      </RootSiblingParent>
    </AuthProvider>
  );
};
export default RootLayout;
