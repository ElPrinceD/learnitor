// CRITICAL: Import error handler FIRST before any other code
// This prevents Expo's error recovery from crashing the app
import "./errorHandler";

import "react-native-reanimated";
import React, { useEffect, useState, useRef } from "react";
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
import { AuthProvider, useAuth } from "../components/AuthContext";
import { useColorScheme } from "../components/useColorScheme";
import { ErrorFallbackScreen } from "../components/ErrorFallbackScreen";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../QueryClient";
import { SQLiteProvider } from "expo-sqlite";
import { CacheProvider } from "../contexts/CacheContext";
import { AlertProvider } from "../contexts/AlertContext";
import { TimelineProvider } from "../contexts/TimelineContext";
import { AdManagerProvider } from "../components/ads/AdManager";
import { ConsentProvider } from "../contexts/ConsentContext";
import mobileAds from "react-native-google-mobile-ads";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { TamaguiProvider } from "@tamagui/core";
import { PortalProvider } from "@tamagui/portal";
import config from "../tamagui.config";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { StatusBar, View, ActivityIndicator } from "react-native";
import Colors from "../constants/Colors";
import * as SystemUI from "expo-system-ui";
import { usePushNotifications } from "../usePushNotifications";
import * as Linking from "expo-linking";
import axios from "axios";
import ApiUrl from "../config";

// FIX #8: Static requires ensure all routes are bundled in production
// Expo Router needs these for static analysis - prevents missing routes
if (typeof require !== "undefined") {
  require("./index");
  require("./(verification)/Intro");
  require("./(verification)/LogIn");
  require("./(verification)/SignUp");
  require("./(verification)/ContinueWithEmail");
  require("./(verification)/ConsentScreen");
  require("./(verification)/ForgotPassword");
  require("./(verification)/Verification");
  require("./(tabs)/home");
  require("./(game)/GameIntro");
  require("./(game)/GameWaiting");
  require("./(game)/GameLevel");
  require("./(game)/Game");
  require("./(game)/GameCourses");
  require("./(game)/GameTopics");
  require("./(game)/Results");
}

// Component to handle push notifications inside ConsentProvider
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

// Component to handle deep links - only processes when navigation is ready
const DeepLinkHandler = ({ ready }: { ready: boolean }) => {
  const { userToken } = useAuth();

  useEffect(() => {
    // FIX #4: Don't handle deep links until navigation is initialized
    if (!ready) return;

    const handleDeepLink = async (url: string) => {
      try {
        const parsedUrl = Linking.parse(url);
        const gameCode = parsedUrl.queryParams?.code as string;

        if (!gameCode) return;

        if (
          (parsedUrl.scheme === "elevay" && parsedUrl.hostname === "game" && parsedUrl.path === "/join") ||
          (parsedUrl.scheme === "https" && parsedUrl.hostname === "elevay.online" && parsedUrl.path === "/GameIntro")
        ) {
          if (gameCode && userToken?.token) {
            try {
              const response = await axios.post(
                `${ApiUrl}/games/join/`,
                { game_code: gameCode },
                {
                  headers: { Authorization: `Token ${userToken.token}` },
                  timeout: 15000, // FIX #6: 15 second timeout for network calls
                }
              );
              if (response.status === 200) {
                router.push({
                  pathname: "/(game)/GameWaiting",
                  params: { code: gameCode, id: response.data.id },
                });
                return;
              }
            } catch (error) {
              // FIX #7: Log error but continue - navigate to GameIntro as fallback
              console.error("Error joining game via deep link:", error);
            }
          }
          router.push({
            pathname: "/(game)/GameIntro",
            params: { code: gameCode },
          });
        }
      } catch (error) {
        // FIX #7: Catch all deep link errors, log them, but don't crash
        console.error("Error handling deep link:", error);
      }
    };

    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // FIX #4: Short delay to let router settle before handling deep link
          setTimeout(() => handleDeepLink(initialUrl), 500);
        }
      } catch (error) {
        // FIX #7: Log error but continue - deep links are non-critical
        console.error("Failed to get initial URL:", error);
      }
    };

    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    getInitialURL();
    return () => subscription?.remove();
  }, [ready, userToken]);

  return null;
};

// Initialize Sentry safely
let navigationIntegration: any;
try {
  navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
  });

  Sentry.init({
    dsn: "https://461367c99dea3ea65e615a0ad9e1ba7e@o4509328707878912.ingest.us.sentry.io/4509328782000128",
    sendDefaultPii: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],
    tracesSampleRate: 1.0,
  });
} catch (error) {
  // FIX #7: Sentry init failure shouldn't crash app
  console.warn("Failed to initialize Sentry:", error);
  navigationIntegration = {
    registerNavigationContainer: () => {},
  };
}

export { ErrorBoundary } from "expo-router";

// Initialize vexo-analytics safely (only in production)
if (!__DEV__) {
  import("vexo-analytics")
    .then((module) => {
      try {
        const vexo = module.vexo || (module.default && module.default.vexo) || module.default;
        if (vexo && typeof vexo === "function") {
          vexo("0893ecd2-10a6-4e31-a30f-37848b825577");
        }
      } catch (error) {
        console.warn("Failed to call vexo-analytics:", error);
      }
    })
    .catch((error) => {
      console.warn("Failed to initialize vexo-analytics:", error);
    });
}

// Configure Reanimated logger safely
try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
} catch (error) {
  console.warn("Failed to configure Reanimated logger:", error);
}

// FIX #1: Prevent splash screen auto-hide - we'll hide it manually when ready
try {
  SplashScreen.preventAutoHideAsync().catch((error) => {
    console.warn("Failed to prevent splash screen auto-hide:", error);
  });
} catch (error) {
  console.warn("Failed to call preventAutoHideAsync:", error);
}

// Initialize Google Mobile Ads safely
try {
  mobileAds()
    .initialize()
    .then(() => {})
    .catch((error) => {
      console.warn("Failed to initialize Google Mobile Ads:", error);
    });
} catch (error) {
  console.warn("Failed to load Google Mobile Ads module:", error);
}

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();
  const themeColors = Colors[colorScheme ?? "light"];

  const [isAppReady, setIsAppReady] = useState(false);
  const [navigationCompleted, setNavigationCompleted] = useState(false);
  const token = userToken?.token || null;

  // FIX #10: Use refs to prevent multiple navigation attempts
  const navigationAttemptedRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX #8: Ensure segments is always an array - prevents undefined errors
  const safeSegments = Array.isArray(segments) ? segments : [];
  const hasSegments = safeSegments.length > 0;
  const currentSegment = hasSegments ? safeSegments[0] : null;
  const isOnIndex = !hasSegments;
  const inTabsGroup = currentSegment === "(tabs)";
  const inAuthGroup = currentSegment === "(verification)";

  // FIX #8: Track when segments populate and mark navigation as completed
  useEffect(() => {
    if (!hasSegments) return;

    const currentSegment = safeSegments[0];
    const inTabsGroup = currentSegment === "(tabs)";
    const inAuthGroup = currentSegment === "(verification)";

    // FIX #8: Only mark navigation completed if we're in the expected route group
    if ((userToken && inTabsGroup) || (!userToken && inAuthGroup)) {
      console.log("[RootLayoutNav] Navigation completed - segments populated", {
        currentSegment,
        inTabsGroup,
        inAuthGroup,
      });
      setNavigationCompleted(true);
    }
  }, [safeSegments, userToken, hasSegments]);

  // FIX #1, #4: Main navigation logic - routes user based on auth state
  useEffect(() => {
    // FIX #3: Wait for auth to finish loading before attempting navigation
    if (isLoading) {
      return;
    }

    // FIX #10: Prevent multiple navigation attempts
    if (navigationAttemptedRef.current) {
      return;
    }

    // FIX #8: If we're on index route, always navigate to appropriate screen
    if (isOnIndex) {
      navigationAttemptedRef.current = true;
      if (userToken) {
        console.log("[RootLayoutNav] Navigating authenticated user to /(tabs)/home");
        router.replace("/(tabs)/home");
      } else {
        console.log("[RootLayoutNav] Navigating unauthenticated user to /(verification)/Intro");
        router.replace("/(verification)/Intro");
      }
    } else if (userToken && !inTabsGroup) {
      // FIX #1: User authenticated but not in tabs - redirect to home
      navigationAttemptedRef.current = true;
      console.log("[RootLayoutNav] Redirecting authenticated user to /(tabs)/home");
      router.replace("/(tabs)/home");
    } else if (!userToken && !inAuthGroup) {
      // FIX #1: User not authenticated but not in auth flow - redirect to Intro
      navigationAttemptedRef.current = true;
      console.log("[RootLayoutNav] Redirecting unauthenticated user to /(verification)/Intro");
      router.replace("/(verification)/Intro");
    } else {
      // FIX #1: Already in correct route - mark navigation as completed
      console.log("[RootLayoutNav] Already in correct route");
      setNavigationCompleted(true);
      navigationAttemptedRef.current = true;
    }
  }, [isLoading, userToken, isOnIndex, inTabsGroup, inAuthGroup]);

  // FIX #1, #8: Set app ready only when ALL conditions are met
  useEffect(() => {
    if (navigationCompleted && !isLoading && hasSegments) {
      console.log("[RootLayoutNav] All conditions met - marking app ready", {
        navigationCompleted,
        isLoading,
        hasSegments,
        segmentsLength: safeSegments.length,
      });
      setIsAppReady(true);
    }
  }, [navigationCompleted, isLoading, hasSegments, safeSegments.length]);

  // FIX #9: Safety timer - forces app ready if async tasks take too long
  useEffect(() => {
    // Clear any existing timer
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }

    // FIX #9: Set 8-second safety timer (longer than auth timeout)
    safetyTimerRef.current = setTimeout(() => {
      if (!isAppReady) {
        console.warn("[RootLayoutNav] Safety timer triggered - forcing app ready", {
          isAppReady,
          navigationCompleted,
          isLoading,
          hasSegments,
          segmentsLength: safeSegments.length,
        });
        // FIX #1: Force ready state - better than infinite loading
        setNavigationCompleted(true);
        setIsAppReady(true);
      }
    }, 8000); // 8 seconds - gives auth check (5s) + navigation (3s) time

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, [isAppReady, navigationCompleted, isLoading, hasSegments]);

  // FIX #1: Hide splash screen only when truly ready
  useEffect(() => {
    if (isAppReady && navigationCompleted && hasSegments) {
      console.log("[RootLayoutNav] Hiding splash screen");
      SplashScreen.hideAsync()
        .then(() => {
          console.log("[RootLayoutNav] Splash screen hidden successfully");
        })
        .catch((error) => {
          // FIX #7: Log error but continue - splash hiding failure is non-critical
          console.warn("[RootLayoutNav] Error hiding splash screen:", error);
        });
    }
  }, [isAppReady, navigationCompleted, hasSegments]);

  // Configure System UI
  useEffect(() => {
    try {
      StatusBar.setBarStyle(
        colorScheme === "dark" ? "light-content" : "dark-content"
      );
      SystemUI.setBackgroundColorAsync(themeColors.background).catch(() => {
        // FIX #7: SystemUI errors are non-critical
      });
    } catch (error) {
      // FIX #7: Catch SystemUI errors, log them, but continue
      console.warn("[RootLayoutNav] Error configuring System UI:", error);
    }
  }, [colorScheme, themeColors.background]);

  // FIX #1: Show loading indicator until ALL conditions are met
  if (!navigationCompleted || isLoading || !isAppReady || !hasSegments) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: themeColors.background,
        }}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  return (
    <TamaguiProvider config={config}>
      <PortalProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <SQLiteProvider databaseName="slate.db">
                <CacheProvider>
                  <ConsentProvider>
                    <PushNotificationHandler />
                    <DeepLinkHandler ready={navigationCompleted && hasSegments} />
                    <TimelineProvider token={token}>
                      <AlertProvider>
                        <AdManagerProvider>
                          <ThemeProvider
                            value={
                              colorScheme === "dark" ? DarkTheme : DefaultTheme
                            }
                          >
                            <Stack screenOptions={{ headerShown: false }}>
                              <Stack.Screen name="index" />
                              <Stack.Screen name="(verification)" />
                              <Stack.Screen name="(tabs)" />
                              <Stack.Screen name="(game)" />
                            </Stack>
                          </ThemeProvider>
                        </AdManagerProvider>
                      </AlertProvider>
                    </TimelineProvider>
                  </ConsentProvider>
                </CacheProvider>
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
    if (ref?.current && navigationIntegration) {
      try {
        navigationIntegration.registerNavigationContainer(ref);
      } catch (error) {
        // FIX #7: Sentry registration failure shouldn't crash app
        console.warn("Failed to register navigation container with Sentry:", error);
      }
    }
  }, [ref]);

  try {
    return (
      <AuthProvider>
        <RootSiblingParent>
          <RootLayoutNav />
        </RootSiblingParent>
      </AuthProvider>
    );
  } catch (error) {
    // FIX #7: Catch rendering errors and show fallback UI
    console.error("[RootLayout] Error rendering RootLayout:", error);
    return (
      <ErrorFallbackScreen
        error={error instanceof Error ? error : new Error("Failed to initialize app")}
        onRetry={() => {
          // Retry will cause a re-render
          console.log("[RootLayout] Retry requested");
        }}
        isLoading={false}
      />
    );
  }
};

// Wrap with Sentry only if it's available
let WrappedRootLayout;
try {
  WrappedRootLayout = Sentry.wrap(RootLayout);
} catch (error) {
  console.warn("Failed to wrap RootLayout with Sentry:", error);
  WrappedRootLayout = RootLayout;
}

export default WrappedRootLayout;
