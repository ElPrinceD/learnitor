import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { FontAwesome } from '@expo/vector-icons';
import DeepLinkHandler from '../DeepLink';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../components/AuthContext'; // Update the path as needed
import { usePushNotifications } from '../usePushNotifications';
import { useColorScheme } from '../components/useColorScheme';
import { RootSiblingParent } from 'react-native-root-siblings';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../QueryClient';
import { SQLiteProvider } from 'expo-sqlite';
import { CacheProvider } from '../contexts/CacheContext'; // Update the path
import { WebSocketProvider } from '../contexts/webSocketProvider'; // Update the path
import { CommunityProvider } from '../contexts/CommunityContext'; // Update the path
import { TimelineProvider } from '../contexts/TimelineContext'; // Update the path
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { TamaguiProvider } from '@tamagui/core';
import { PortalProvider } from '@tamagui/portal';
import config from '../tamagui.config';

export { ErrorBoundary } from 'expo-router';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();

  const [navigationCompleted, setNavigationCompleted] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';

    if (userToken && !inTabsGroup) {
      router.replace({ pathname: '/home' });
    } else if (!userToken) {
      router.replace('/Intro');
    }
    setNavigationCompleted(true);
  }, [isLoading, userToken]);

  useEffect(() => {
    if (navigationCompleted) {
      SplashScreen.hideAsync();
    }
  }, [navigationCompleted]);

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
                    <WebSocketProvider token={userToken?.token}>
                      <CommunityProvider token={userToken?.token}>
                        <TimelineProvider token={userToken?.token}>
                          <DeepLinkHandler />
                          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                            <Stack>
                              <Stack.Screen name="index" options={{ headerShown: false }} />
                              <Stack.Screen name="(verification)" options={{ headerShown: false }} />
                              <Stack.Screen
                                name="(tabs)"
                                options={{
                                  headerShown: false,
                                  headerShadowVisible: false,
                                }}
                              />
                              <Stack.Screen name="(game)" options={{ headerShown: false }} />
                              <Stack.Screen name="(fullscreens)" options={{ headerShown: false }} />
                            </Stack>
                          </ThemeProvider>
                        </TimelineProvider>
                      </CommunityProvider>
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
  return (
    <AuthProvider>
      <RootSiblingParent>
        <RootLayoutNav />
      </RootSiblingParent>
    </AuthProvider>
  );
};

export default RootLayout;