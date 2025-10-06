//import "../wdyr";
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import {
  Stack,
  router,
  useSegments,
  useNavigationContainerRef,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../components/AuthContext"; // Update the path as needed
import { useColorScheme } from "../components/useColorScheme";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../QueryClient";
import { SQLiteProvider } from "expo-sqlite";
import { CacheProvider } from "../contexts/CacheContext"; // Update the path
import { WebSocketProvider } from "../contexts/webSocketProvider"; // Update the path
import { AlertProvider } from "../contexts/AlertContext"; // Update the path
import { TimelineProvider } from "../contexts/TimelineContext"; // Update the path
import { AdManagerProvider } from "../components/ads/AdManager"; // Add AdManager
import mobileAds from "react-native-google-mobile-ads";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { TamaguiProvider } from "@tamagui/core";
import { PortalProvider } from "@tamagui/portal";
import config from "../tamagui.config";
import { vexo } from "vexo-analytics";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { StatusBar } from "react-native";
import Colors from "../constants/Colors";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: "https://461367c99dea3ea65e615a0ad9e1ba7e@o4509328707878912.ingest.us.sentry.io/4509328782000128",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
  tracesSampleRate: 1.0,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export { ErrorBoundary } from "expo-router";

if (!__DEV__) {
  vexo("0893ecd2-10a6-4e31-a30f-37848b825577");
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

// Initialize Google Mobile Ads
mobileAds()
  .initialize()
  .then((adapterStatuses) => {
    console.log("Google Mobile Ads initialized successfully:", adapterStatuses);
  })
  .catch((error) => {
    console.error("Failed to initialize Google Mobile Ads:", error);
  });

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();
  const themeColors = Colors[colorScheme ?? "light"];

  const [navigationCompleted, setNavigationCompleted] = useState(false);
  const token = userToken?.token || null;
  console.log("2nd main layout token", token);
  console.log("main layout token", userToken?.token);

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === "(tabs)";

    if (userToken && !inTabsGroup) {
      router.replace({ pathname: "/home" });
    } else if (!userToken) {
      router.replace("/Intro");
    }
    setNavigationCompleted(true);
  }, [isLoading, userToken]);

  useEffect(() => {
    if (navigationCompleted) {
      SplashScreen.hideAsync();
    }
  }, [navigationCompleted]);

  // Add StatusBar configuration
  useEffect(() => {
    StatusBar.setBarStyle(
      colorScheme === "dark" ? "light-content" : "dark-content"
    );
    StatusBar.setBackgroundColor(themeColors.background);
  }, [colorScheme, themeColors.background]);

  return (
    <TamaguiProvider config={config}>
      <PortalProvider>
        <BottomSheetModalProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                {/* Wrap all contexts with SQLiteProvider */}
                <SQLiteProvider databaseName="slate.db">
                  <CacheProvider>
                    <WebSocketProvider>
                      <TimelineProvider token={token}>
                        <AlertProvider>
                          <AdManagerProvider>
                            <ThemeProvider
                              value={
                                colorScheme === "dark"
                                  ? DarkTheme
                                  : DefaultTheme
                              }
                            >
                              <Stack>
                                <Stack.Screen
                                  name="index"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(verification)"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(tabs)"
                                  options={{
                                    headerShown: false,
                                    headerShadowVisible: false,
                                  }}
                                />
                                <Stack.Screen
                                  name="(game)"
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name="(fullscreens)"
                                  options={{ headerShown: false }}
                                />
                              </Stack>
                            </ThemeProvider>
                          </AdManagerProvider>
                        </AlertProvider>
                      </TimelineProvider>
                    </WebSocketProvider>
                  </CacheProvider>
                </SQLiteProvider>
              </QueryClientProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </BottomSheetModalProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
};

const RootLayout = () => {
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);
  return (
    <AuthProvider>
      <RootSiblingParent>
        <RootLayoutNav />
      </RootSiblingParent>
    </AuthProvider>
  );
};

export default Sentry.wrap(RootLayout);
