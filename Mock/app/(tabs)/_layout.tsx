import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { StyleSheet } from "react-native";

import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import { View, useThemeColor } from "../../components/Themed";

import { useAuth } from "../../components/AuthContext";

import { SafeAreaProvider } from "react-native-safe-area-context";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const currentHour = new Date().getHours();
  let greeting = "";

  // Determine the appropriate greeting based on the current hour
  if (currentHour >= 4 && currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  const themeTextColor = useThemeColor(
    {
      light: Colors.light.text, // Set light mode text color
      dark: Colors.dark.text, // Set dark mode text color
    },
    "text"
  );
  const themeColors = Colors[colorScheme ?? "light"];

  const { userInfo } = useAuth();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
        
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TabBarIcon name="home"  color={color} />,
            headerShadowVisible: false,
            headerRight: () => (
              <View style={styles.container}>
                <View style={styles.container}>
                  <Link href="/modal" asChild>
                    <Pressable>
                      {({ pressed }) => (
                        <Ionicons
                          name="notifications-outline"
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
            title: "Courses",
            tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
            headerShown: false,
            headerTitle: "Details",

            // headerTransparent: true,
            headerShadowVisible: false,
          }}
        />

        <Tabs.Screen
          name="(reminder)"
          options={{
            title: "Timeline",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="history" color={color} />
            ),
            headerShadowVisible: false,
            headerShown: false,
          
            headerTitle: "",
          }}
        />
        <Tabs.Screen
          name="(account)"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            headerTitle: "",
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
    
  },
});
