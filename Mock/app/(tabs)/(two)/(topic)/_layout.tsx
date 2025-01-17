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
        
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "bold",
          textTransform: "capitalize",
        },
        tabBarIndicatorStyle: {
          backgroundColor: themeColors.tint,
          height: 3,
        },
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
