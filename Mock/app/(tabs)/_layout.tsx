import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useThemeColor } from "../../components/Themed";

import { useLocalSearchParams } from "expo-router";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const params = useLocalSearchParams();
  const firstName = params.firstName;
  console.log("Received User:", firstName);

  const currentHour = new Date().getHours();
  let greeting = "";

  // Determine the appropriate greeting based on the current hour
  if (currentHour >= 5 && currentHour < 12) {
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

  return (
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
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="notifications"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
          headerTitle: () => (
            <Text
              style={{
                color: themeTextColor,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {greeting}, {firstName}!
            </Text>
          ), // Adjusted the font size to 24
        }}
      />
      <Tabs.Screen
        name="(two)"
        options={{
          title: "Courses",
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerTitle: "What do you want to learn today?",
        }}
      />

      <Tabs.Screen
        name="three"
        options={{
          title: "Don't Know",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="history" color={color} />
          ),
          headerTitle: "Unknown",
        }}
      />
      <Tabs.Screen
        name="four"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: "Account Settings",
        }}
      />
    </Tabs>
  );
}
