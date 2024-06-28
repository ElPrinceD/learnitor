import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { FontAwesome } from "@expo/vector-icons";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { Slot, Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../components/AuthContext"; // Update the path
import { useColorScheme } from "../components/useColorScheme";
import { RootSiblingParent } from "react-native-root-siblings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export { ErrorBoundary } from "expo-router";

// export const unstable_settings = {
//   initialRouteName: "",
// };

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
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Slot />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
};

const RootLayout = () => {
  // const [loaded, error] = useFonts({
  //   SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  //   ...FontAwesome.font,
  // });

  return (
    <AuthProvider>
      <RootSiblingParent>
        <RootLayoutNav />
      </RootSiblingParent>
    </AuthProvider>
  );
};
export default RootLayout;
