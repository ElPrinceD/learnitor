import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const TopicLayout = () => {
  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: "#131620",
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "bold",
          textTransform: "capitalize",
        },
        tabBarIndicatorStyle: { backgroundColor: "#1C87ED", height: 3 },
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
