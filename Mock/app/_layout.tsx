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
import { ErrorFallbackScreen } from "../components/ErrorFallbackScreen";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../QueryClient";
import { SQLiteProvider } from "expo-sqlite";
import { CacheProvider } from "../contexts/CacheContext"; // Update the path
import { AlertProvider } from "../contexts/AlertContext"; // Update the path
import { TimelineProvider } from "../contexts/TimelineContext"; // Update the path
import { AdManagerProvider } from "../components/ads/AdManager"; // Add AdManager
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
import { StatusBar } from "react-native";
import Colors from "../constants/Colors";
import * as SystemUI from "expo-system-ui";
import { usePushNotifications } from "../usePushNotifications";
import * as Linking from "expo-linking";
import axios from "axios";
import ApiUrl from "../config";

console.log("[_layout.tsx] Module loaded");

// Component to handle push notifications inside ConsentProvider
const PushNotificationHandler = () => {
  const { expoPushToken, notification } = usePushNotifications();
  const [loggedToken, setLoggedToken] = useState<string | null>(null);

  // Debug notification setup - only log once per token
  useEffect(() => {
    if (expoPushToken && expoPushToken.data !== loggedToken) {
      setLoggedToken(expoPushToken.data);
    }
  }, [expoPushToken, loggedToken]);

  // Debug notification received - only log unique notifications
  useEffect(() => {
    if (notification) {
      const notificationId = notification.request.identifier;
      // Notification received - handled silently
    }
  }, [notification]);

  return null; // This component doesn't render anything
};

// Component to handle deep links
const DeepLinkHandler = () => {
  const { userToken } = useAuth();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        // Parse the URL to extract game code
        const parsedUrl = Linking.parse(url);

        // Handle custom scheme: elevay://game/join/ABC123
        if (
          parsedUrl.scheme === "elevay" &&
          parsedUrl.hostname === "game" &&
          parsedUrl.path === "/join"
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
                // Navigate to GameWaiting screen
                router.push({
                  pathname: "/(game)/GameWaiting",
                  params: { code: gameCode, id: id },
                });
              }
            } catch (error) {
              console.error("Error joining game via deep link:", error);
              // Navigate to GameIntro with the code pre-filled
              router.push({
                pathname: "/(game)/GameIntro",
                params: { code: gameCode },
              });
            }
          }
        }
        // Handle universal links: https://elevay.online/GameIntro?code=ABC123
        else if (
          parsedUrl.scheme === "https" &&
          parsedUrl.hostname === "elevay.online" &&
          parsedUrl.path === "/GameIntro"
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
                // Navigate to GameWaiting screen
                router.push({
                  pathname: "/(game)/GameWaiting",
                  params: { code: gameCode, id: id },
                });
              }
            } catch (error) {
              console.error("Error joining game via deep link:", error);
              // Navigate to GameIntro with the code pre-filled
              router.push({
                pathname: "/(game)/GameIntro",
                params: { code: gameCode },
              });
            }
          } else if (gameCode && !userToken?.token) {
            // User not authenticated - navigate to GameIntro with code pre-filled
            router.push({
              pathname: "/(game)/GameIntro",
              params: { code: gameCode },
            });
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
  }, [userToken]);

  return null; // This component doesn't render anything
};

// Initialize Sentry safely
let navigationIntegration;
try {
  navigationIntegration = Sentry.reactNavigationIntegration({
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
} catch (error) {
  console.warn("Failed to initialize Sentry:", error);
  // Create a dummy integration to prevent crashes
  navigationIntegration = {
    registerNavigationContainer: () => {},
  };
}

export { ErrorBoundary } from "expo-router";

// Initialize vexo-analytics safely (only in production)
if (!__DEV__) {
  // Lazy import to avoid module resolution errors during development
  import("vexo-analytics")
    .then((module) => {
      // Handle both named and default exports
      const vexo = module.vexo || (module.default && module.default.vexo) || module.default;
      if (vexo && typeof vexo === "function") {
        vexo("0893ecd2-10a6-4e31-a30f-37848b825577");
      }
    })
    .catch((error) => {
      console.warn("Failed to initialize vexo-analytics:", error);
    });
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

// Initialize Google Mobile Ads safely
try {
  mobileAds()
    .initialize()
    .then((adapterStatuses) => {
      // Ad SDK initialized successfully
    })
    .catch((error) => {
      console.warn("Failed to initialize Google Mobile Ads:", error);
    });
} catch (error) {
  console.warn("Failed to load Google Mobile Ads module:", error);
}

const RootLayoutNav = () => {
  console.log("[RootLayoutNav] Component rendering");
  const colorScheme = useColorScheme();
  const segments = useSegments();
  console.log("[RootLayoutNav] Hooks initialized");
  const { userToken, isLoading } = useAuth();
  console.log("[RootLayoutNav] Auth state:", { hasToken: !!userToken, isLoading });
  const themeColors = Colors[colorScheme ?? "light"];
  console.log("[RootLayoutNav] Theme colors loaded");

  const [navigationCompleted, setNavigationCompleted] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const token = userToken?.token || null;

  const MAX_INIT_TIMEOUT = 10000; // 10 second maximum timeout

  // Timeout safeguard - force hide splash screen after max timeout
  useEffect(() => {
    const startTime = Date.now();
    console.log("[RootLayoutNav] Starting initialization timeout safeguard");
    
    const timeoutId = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.warn(`[RootLayoutNav] Initialization timeout after ${elapsed}ms - forcing completion`);
      
      setNavigationCompleted((prev) => {
        if (!prev) {
          console.warn("[RootLayoutNav] Forcing navigation completion due to timeout");
          setInitError(new Error("Initialization timeout - app took too long to load"));
          
          // Force hide splash screen
          SplashScreen.hideAsync().catch((error) => {
            console.error("[RootLayoutNav] Failed to hide splash screen:", error);
          });
          
          return true;
        }
        return prev;
      });
    }, MAX_INIT_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
      console.log("[RootLayoutNav] Timeout safeguard cleaned up");
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) {
      console.log("[RootLayoutNav] Still loading auth state...");
      return;
    }

    console.log("[RootLayoutNav] Auth loading complete, starting navigation");

    try {
      const inTabsGroup = segments[0] === "(tabs)";
      console.log("[RootLayoutNav] Current segments:", segments, "inTabsGroup:", inTabsGroup);

      if (userToken && !inTabsGroup) {
        console.log("[RootLayoutNav] User authenticated, navigating to /home");
        router.replace({ pathname: "/home" });
      } else if (!userToken) {
        console.log("[RootLayoutNav] User not authenticated, navigating to /Intro");
        router.replace("/Intro");
      } else {
        console.log("[RootLayoutNav] User already in correct route");
      }

      setNavigationCompleted(true);
      console.log("[RootLayoutNav] Navigation completed successfully");
    } catch (error) {
      console.error("[RootLayoutNav] Error during navigation:", error);
      setInitError(error instanceof Error ? error : new Error("Navigation error"));
      setNavigationCompleted(true);
    }
  }, [isLoading, userToken, segments]);

  // Hide splash screen when navigation is completed
  useEffect(() => {
    if (navigationCompleted) {
      console.log("[RootLayoutNav] Hiding splash screen");
      SplashScreen.hideAsync()
        .then(() => {
          console.log("[RootLayoutNav] Splash screen hidden successfully");
        })
        .catch((error) => {
          console.error("[RootLayoutNav] Failed to hide splash screen:", error);
          // Continue anyway - don't block the app
        });
    }
  }, [navigationCompleted]);

  // Retry handler
  const handleRetry = () => {
    console.log("[RootLayoutNav] Retry requested");
    setIsRetrying(true);
    setInitError(null);
    setNavigationCompleted(false);
    
    // Force a re-render by resetting state
    setTimeout(() => {
      setIsRetrying(false);
      // The useEffect will handle navigation again
    }, 100);
  };

  // Show error screen if initialization failed
  if (initError && navigationCompleted) {
    console.log("[RootLayoutNav] Rendering error fallback screen");
    return (
      <ErrorFallbackScreen
        error={initError}
        onRetry={handleRetry}
        isLoading={isRetrying}
      />
    );
  }

  // Add StatusBar and SystemUI configuration (non-blocking)
  useEffect(() => {
    const configureUI = async () => {
      try {
        console.log("[RootLayoutNav] Configuring status bar and system UI");
        // Set status bar style based on theme
        StatusBar.setBarStyle(
          colorScheme === "dark" ? "light-content" : "dark-content"
        );
        
        // Set root view background color using expo-system-ui
        await SystemUI.setBackgroundColorAsync(themeColors.background);
        console.log("[RootLayoutNav] UI configuration completed");
      } catch (error) {
        console.warn("[RootLayoutNav] Failed to configure UI (non-critical):", error);
        // Don't block app initialization on UI config errors
      }
    };

    // Run UI configuration asynchronously without blocking
    configureUI();
  }, [colorScheme, themeColors.background]);

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
                    <DeepLinkHandler />
                    <TimelineProvider token={token}>
                      <AlertProvider>
                        <AdManagerProvider>
                          <ThemeProvider
                            value={
                              colorScheme === "dark" ? DarkTheme : DefaultTheme
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
  console.log("[RootLayout] Component rendering");
  const ref = useNavigationContainerRef();
  console.log("[RootLayout] Navigation ref created");

  useEffect(() => {
    console.log("[RootLayout] useEffect running");
    if (ref?.current && navigationIntegration) {
      try {
        navigationIntegration.registerNavigationContainer(ref);
        console.log("[RootLayout] Sentry navigation registered");
      } catch (error) {
        console.warn("Failed to register navigation container with Sentry:", error);
      }
    }
  }, [ref]);
  
  console.log("[RootLayout] Returning JSX");
  return (
   
      <AuthProvider>
        <RootSiblingParent>
          <RootLayoutNav />
        </RootSiblingParent>
      </AuthProvider>
  
  );
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
