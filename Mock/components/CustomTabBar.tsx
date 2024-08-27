// src/components/CustomTabBar.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useColorScheme } from "../../Mock/components/useColorScheme";

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;

        const isFocused = state.index === index;
        const iconName = options.tabBarIcon
          ? options.tabBarIcon({ color: isFocused ? themeColors.tint : themeColors.tabIconDefault, focused: isFocused })
          : "";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const tabBarButtonStyle =
          route.name === "(community)" ? styles.communityTabButton : styles.tabButton;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={tabBarButtonStyle}
          >
            <View style={styles.iconContainer}>{iconName}</View>
            <Text style={{ color: isFocused ? themeColors.tint : themeColors.tabIconDefault }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    height: 60,
    elevation: 10,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 10,
  },
  communityTabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 10,
    borderBottomColor: Colors.dark.background,
    backgroundColor: Colors.light.background, // Customize the background color
    borderTopLeftRadius: 50, // Rounded corners
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopRightRadius: 50, // Rounded corners
    height: 70, // Increase the height to create a "dip"
    marginTop: -35, // Lift the tab to create a dip effect
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.3,
    // shadowRadius: 6,
    // elevation: 10,
  },
  iconContainer: {
    marginBottom: 3,
  },
});

export default CustomTabBar;
