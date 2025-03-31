import React, { useState, useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CommunityScreen from "./CommunityScreen";
import CreateCommunity from "./CreateCommunity";
import EditCommunityScreen from "./EditCommunityScreen";
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../../constants/Colors";
import { useColorScheme, TouchableOpacity, Text, View, Pressable } from "react-native";
import { rMS } from "../../../constants";
import { router } from "expo-router";
// Make sure this is the correct path

const Stack = createNativeStackNavigator();

export default function CommunityLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="CommunityScreen"
        component={CommunityScreen}
        options={{
          title: "My Communities",
          headerRight: () => (
            <Pressable onPressIn={() => router.navigate("CreateCommunity")}>
              {({ pressed }) => (
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={25}
                  color={Colors[colorScheme ?? "light"].text}
                  style={{ marginRight: 1, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="CreateCommunity"
        component={CreateCommunity}
        options={{
          title: "Create Community",
          presentation: "modal",
          animation: "fade_from_bottom",
          headerTitleAlign: "center",
          headerBackTitle: "Cancel",
          
        }}
      />
      
      <Stack.Screen
        name="EditCommunityScreen"
        component={EditCommunityScreen}
        options={({ navigation }) => ({
          title: "Edit Community",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: themeColors.text, marginLeft: 5, fontSize: rMS(19) }}>
                Cancel
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* Save changes logic */}}>
              <Text style={{ color: themeColors.errorText, marginRight: 5, fontSize: rMS(19) }}>
                Done
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}