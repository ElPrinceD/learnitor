import React from "react";
import { Link, Tabs } from "expo-router";
import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import { View, useThemeColor } from "../../components/Themed";
import { useAuth } from "../../components/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Define TabBarIcon component to handle filled and outlined icons
function TabBarIcon(props: { name: string; color: string; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={props.focused ? props.name : `${props.name}-outline`}
      size={22}
      color={props.color}
      style={{ marginBottom: -3 }}
    />
  );
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
          
          tabBarLabelStyle: { fontSize: 13 },
          tabBarStyle: {
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            borderTopWidth: 0,
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
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
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="book" color={color} focused={focused} />
            ),
            headerShown: false,
            headerTitle: "Details",
            headerShadowVisible: false,
          }}
        />

        <Tabs.Screen
          name="(reminder)"
          options={{
            title: "Timeline",
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
