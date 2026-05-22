import React, { useEffect, useRef, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View, Animated } from "react-native";
import {
  Home,
  BookOpen,
  Gamepad2,
  CalendarClock,
  UserRound,
} from "lucide-react-native";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import { rMS } from "../../constants";
import { useAuth } from "../../store/authStore";
import { horizontalTabTransition } from "../../navigation/tabSlideTransition";

// Lucide icon map — Lucide doesn't have outline variants, so we use
// the same icon but vary strokeWidth (1.5 for inactive, 2.5 for active)
const iconMap: Record<string, React.FC<any>> = {
  home: Home,
  book: BookOpen,
  gamepad: Gamepad2,
  calendar: CalendarClock,
  account: UserRound,
};

function TabBarIcon(props: { name: string; color: string; focused: boolean }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const animatedScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.focused) {
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [props.focused, animatedScale]);

  const IconComponent = iconMap[props.name] || Home;

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
              width: containerWidth,
              transform: [{ scaleX: animatedScale }],
            },
          ]}
        />
      )}
      <IconComponent
        size={rMS(20)}
        color={props.color}
        strokeWidth={props.focused ? 2.5 : 1.5}
        style={{ marginBottom: -3 }}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userToken, isLoading } = useAuth();

  if (!isLoading && !userToken) {
    return <Redirect href="/(verification)/Intro" />;
  }

  return (
    <Tabs
      screenOptions={{
        ...horizontalTabTransition,
        tabBarHideOnKeyboard: true,
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
          headerShown: false,
          headerShadowVisible: false,
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
        name="(play)"
        options={{
          title: "Play",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="gamepad" color={color} focused={focused} />
          ),
          headerShown: false,
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="(reminder)"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account" color={color} focused={focused} />
          ),
          headerTitle: "Profile",
          headerShown: false,
          headerShadowVisible: false,
        }}
      />
    </Tabs>
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
});
