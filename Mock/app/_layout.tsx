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
  router,
  useSegments,
  useRootNavigationState,
  useNavigationContainerRef,
} from "expo-router";
import { JsStack, fastStackTransition } from "../navigation/JsStack";
import { CardStyleInterpolators } from "@react-navigation/stack";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "../store/authStore";
import { useColorScheme } from "../components/useColorScheme";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../QueryClient";
import { SQLiteProvider } from "expo-sqlite";
import { CacheInitializer } from "../contexts/CacheContext";
import { AlertPortal } from "../contexts/AlertContext";
import { AdInitializer } from "../components/ads/AdManager";
import { useConsentStore } from "../store/consentStore";
import { useAuthStore } from "../store/authStore";
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
import { StatusBar, LogBox } from "react-native";

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);
import Colors from "../constants/Colors";
import * as SystemUI from "expo-system-ui";
import { usePushNotifications } from "../usePushNotifications";
import * as Linking from "expo-linking";
import axios from "axios";
import ApiUrl from "../config";

// Component to handle push notifications
const PushNotificationHandler = () => {
  const { expoPushToken, notification } = usePushNotifications();
  const [loggedToken, setLoggedToken] = useState<string | null>(null);

  useEffect(() => {
    if (expoPushToken && expoPushToken.data !== loggedToken) {
      setLoggedToken(expoPushToken.data);
    }
  }, [expoPushToken, loggedToken]);

  useEffect(() => {
    if (notification) {
      const notificationId = notification.request.identifier;
      // Notification received - handled silently
    }
  }, [notification]);

  return null;
};

// Component to reload consents when the auth token changes
const ConsentHydrator = () => {
  const token = useAuthStore((s) => s.userToken?.token);

  useEffect(() => {
    if (token) {
      useConsentStore.getState().loadConsents();
    }
  }, [token]);

  return null;
};

// Defer navigation to the next frame so the root navigator is settled.
const navigateFromDeepLink = (
  pathname: "/(game)/GameWaiting" | "/(game)/GameIntro",
  params: Record<string, string>
) => {
  requestAnimationFrame(() => {
    router.replace({ pathname, params });
  });
};

// Component to handle deep links
const DeepLinkHandler = () => {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const navigationReady =
    !isLoading &&
    !!rootNavigationState?.key &&
    segments.length > 0;

  useEffect(() => {
    if (!navigationReady) return;

    const handleDeepLink = async (url: string) => {
      try {
        // Parse the URL to extract game code
        const parsedUrl = Linking.parse(url);

        // Handle custom scheme: elevay://game/join?code=ABC123
        if (
          parsedUrl.scheme === "elevay" &&
          parsedUrl.hostname === "game" &&
          (parsedUrl.path === "join" || parsedUrl.path === "/join" || parsedUrl.path === "join/" || parsedUrl.path === "/join/")
        ) {
          const gameCode = parsedUrl.queryParams?.code as string;

          if (gameCode && userToken?.token) {
            try {
              // Join the game automatically
              const response = await axios.post(
                `${ApiUrl}/games/join/`,
                { game_code: gameCode },
                {
                  headers: {
                    Authorization: `Token ${userToken.token}`,
                  },
                }
              );

              if (response.status === 200) {
                const id = response.data.id;
                navigateFromDeepLink("/(game)/GameWaiting", {
                  code: gameCode,
                  id: String(id),
                });
              }
            } catch (error) {
              console.error("Error joining game via deep link:", error);
              navigateFromDeepLink("/(game)/GameIntro", { code: gameCode });
            }
          }
        }
        // Handle universal links and custom schemes for GameIntro
        else if (
          (parsedUrl.scheme === "https" &&
            (parsedUrl.hostname === "elevay.online" || parsedUrl.hostname === "www.elevay.online") &&
            (parsedUrl.path === "GameIntro" || parsedUrl.path === "/GameIntro" || parsedUrl.path === "GameIntro/" || parsedUrl.path === "/GameIntro/")) ||
          (parsedUrl.scheme === "elevay" &&
            (parsedUrl.hostname === "GameIntro" ||
              (parsedUrl.hostname === "game" &&
                (parsedUrl.path === "GameIntro" || parsedUrl.path === "/GameIntro" || parsedUrl.path === "GameIntro/" || parsedUrl.path === "/GameIntro/"))))
        ) {
          const gameCode = parsedUrl.queryParams?.code as string;

          if (gameCode && userToken?.token) {
            try {
              // Join the game automatically
              const response = await axios.post(
                `${ApiUrl}/games/join/`,
                { game_code: gameCode },
                {
                  headers: {
                    Authorization: `Token ${userToken.token}`,
                  },
                }
              );

              if (response.status === 200) {
                const id = response.data.id;
                navigateFromDeepLink("/(game)/GameWaiting", {
                  code: gameCode,
                  id: String(id),
                });
              }
            } catch (error) {
              console.error("Error joining game via deep link:", error);
              navigateFromDeepLink("/(game)/GameIntro", { code: gameCode });
            }
          } else if (gameCode && !userToken?.token) {
            navigateFromDeepLink("/(game)/GameIntro", { code: gameCode });
          }
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };

    // Handle initial URL when app is opened from a deep link
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle URLs when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    getInitialURL();

    return () => {
      subscription?.remove();
    };
  }, [userToken, navigationReady]);

  return null; // This component doesn't render anything
};

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
  tracesSampleRate: __DEV__ ? 1.0 : 0.05,

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
  .then((adapterStatuses) => {})
  .catch((error) => {});

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.light.tint,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.tint,
  },
};

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Add StatusBar and SystemUI configuration
  useEffect(() => {
    // Set status bar style based on theme
    StatusBar.setBarStyle(
      colorScheme === "dark" ? "light-content" : "dark-content"
    );

    // Set root view background color using expo-system-ui
    // This will be handled by the expo-system-ui plugin configuration
    SystemUI.setBackgroundColorAsync(themeColors.background);
  }, [colorScheme, themeColors.background]);

  return (
    <TamaguiProvider config={config}>
      <PortalProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <SQLiteProvider databaseName="slate.db">
                {/* Zustand bridge initializers (renderless) */}
                <CacheInitializer />
                <ConsentHydrator />
                <PushNotificationHandler />
                <DeepLinkHandler />
                <AdInitializer />

                <ThemeProvider
                  value={
                    colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme
                  }
                >
                  <JsStack
                    screenOptions={{
                      headerShown: false,
                      ...fastStackTransition,
                    }}
                  >
                    <JsStack.Screen
                      name="index"
                    />
                    <JsStack.Screen
                      name="(verification)"
                    />
                    <JsStack.Screen
                      name="(tabs)"
                      options={{
                        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
                      }}
                    />
                    <JsStack.Screen
                      name="(game)"
                    />
                  </JsStack>
                </ThemeProvider>

                {/* Alert modal portal (renders above everything) */}
                <AlertPortal />
              </SQLiteProvider>
            </QueryClientProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
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
    <RootSiblingParent>
      <RootLayoutNav />
    </RootSiblingParent>
  );
};

export default Sentry.wrap(RootLayout);
