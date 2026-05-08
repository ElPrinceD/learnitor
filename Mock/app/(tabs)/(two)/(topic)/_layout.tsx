import React from "react";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import Colors from "../../../../constants/Colors";
import { useColorScheme } from "react-native";
import { rMS, rV, rS } from "../../../../constants";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const TopicLayout = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarLabelStyle: {
          fontSize: rMS(12),
          fontWeight: "800",
          textTransform: "capitalize",
          letterSpacing: 0.2,
        },
        tabBarIndicatorStyle: {
          backgroundColor: themeColors.tint,
          height: 3,
          borderRadius: 2,
        },
        tabBarStyle: {
          backgroundColor: themeColors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border + "30",
        },
        tabBarPressColor: themeColors.tint + "15",
      }}
    >
      <MaterialTopTabs.Screen
        name="VideoMaterials"
        options={{ title: "Videos" }}
      />
      <MaterialTopTabs.Screen
        name="BookMaterials"
        options={{ title: "Books" }}
      />
      <MaterialTopTabs.Screen
        name="ArticleMaterials"
        options={{ title: "Articles" }}
      />
    </MaterialTopTabs>
  );
};
export default TopicLayout;
