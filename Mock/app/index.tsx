import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../components/AuthContext";

const index = () => {
  const { isLoading } = useAuth();

  // Show loading indicator while auth is loading
  // The _layout.tsx will handle navigation once auth is ready
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Return null - _layout.tsx will handle navigation
  return null;
};

export default index;
