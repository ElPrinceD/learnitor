import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "../store/authStore";

export default function Index() {
  const { userToken, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (userToken) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(verification)/Intro" />;
}
