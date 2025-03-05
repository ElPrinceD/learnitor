import React, { useEffect, useRef, useState } from "react";
import { Link, Tabs } from "expo-router";
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import { useThemeColor } from "../../components/Themed";
import { rMS } from "../../constants";
import { useAuth } from "../../components/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useWebSocket } from "../../webSocketProvider";

// Animated TabBarIcon: the indicator uses a scale transform so that it starts at 0
// in the middle and expands equally to left and right.
function TabBarIcon(props: { name: string; color: string; focused: boolean }) {
  const [containerWidth, setContainerWidth] = useState(0);
  // We'll animate scaleX from 0 (no indicator) to 1 (full width)
  const animatedScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.focused) {
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true, // scale transforms can use native driver
      }).start();
    } else {
      Animated.timing(animatedScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [props.focused, animatedScale]);

  return (
    <View
      style={styles.iconContainer}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      {props.focused && (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: props.color,
              // Set the base width to containerWidth; then scaleX will animate from the center.
              width: containerWidth,
              transform: [{ scaleX: animatedScale }],
            },
          ]}
        />
      )}
      <MaterialCommunityIcons
        name={props.focused ? props.name : `${props.name}-outline`}
        size={rMS(20)}
        color={props.color}
        style={{ marginBottom: -3 }}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { unreadCommunitiesCount } = useWebSocket();
  const currentHour = new Date().getHours();
  let greeting = "";
  if (currentHour >= 4 && currentHour < 12) {
    greeting = "What's up";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Hey";
  } else {
    greeting = "What's up";
  }
  const themeTextColor = useThemeColor(
    {
      light: Colors.light.text,
      dark: Colors.dark.text,
    },
    "text"
  );
  const { userInfo } = useAuth();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarLabelStyle: { fontSize: 13 },
          tabBarStyle: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            borderTopWidth: 0,
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Relax",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
            headerShadowVisible: false,
            headerRight: () => (
              <View style={styles.container}>
                <Link href="/GameIntro" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <Ionicons
                        name="game-controller-outline"
                        size={27}
                        color={Colors[colorScheme ?? "light"].text}
                        style={{
                          marginRight: 15,
                          opacity: pressed ? 0.5 : 1,
                        }}
                      />
                    )}
                  </Pressable>
                </Link>
              </View>
            ),
            headerTitle: () => (
              <Text
                style={{
                  color: themeTextColor,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {greeting}, {userInfo?.user.first_name}!
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="(two)"
          options={{
            title: "Learn",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="book" color={color} focused={focused} />
            ),
            headerShown: false,
            headerTitle: "Details",
            headerShadowVisible: false,
          }}
        />
        <Tabs.Screen
          name="(community)"
          options={{
            title: "Squad",
            tabBarIcon: ({ color, focused }) => (
              <View style={{ backgroundColor: "transparent" }}>
                <TabBarIcon
                  name="account-group"
                  color={color}
                  focused={focused}
                />
                {unreadCommunitiesCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: Colors[colorScheme ?? "light"].tint },
                    ]}
                  >
                    <Text style={styles.badgeText}>{unreadCommunitiesCount}</Text>
                  </View>
                )}
              </View>
            ),
            headerShown: false,
            headerTitle: "Community",
            headerShadowVisible: false,
          }}
        />
        <Tabs.Screen
          name="(reminder)"
          options={{
            title: "To Do",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="calendar-clock" color={color} focused={focused} />
            ),
            headerShadowVisible: false,
            headerShown: false,
            headerTitle: "",
          }}
        />
        <Tabs.Screen
          name="(account)"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="cog" color={color} focused={focused} />
            ),
            headerTitle: "Settings",
            headerShown: false,
            headerShadowVisible: false,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    backgroundColor: "transparent",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    top: -9,
    height: 3,
    borderRadius: 1.5,
  },
  badge: {
    position: "absolute",
    left: 15,
    top: -3,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
