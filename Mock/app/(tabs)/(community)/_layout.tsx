import React, { useState, useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CommunityScreen from "../../(tabs)/(community)/CommunityScreen";
import CreateCommunity from "./CreateCommunity";
import CommunityDetailScreen from "./CommunityDetailScreen";
import EditCommunityScreen from "./EditCommunityScreen";
import Colors from "../../../constants/Colors";
import { useColorScheme, TouchableOpacity, Text, View } from "react-native";
import { rMS } from "../../../constants";
import CommunityChatScreen from "./ChatScreen"; // Make sure this is the correct path

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
        }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={CommunityChatScreen} // Changed to CommunityChatScreen
        options={({ route, navigation }) => ({
          title: route.params?.name || "Chat",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: themeColors.reverseText,
          },
          headerTitle: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("CommunityDetailScreen", {
                  id: route.params?.communityId,
                })
              }
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ color: themeColors.tint, fontSize: rMS(19) }}>
                {route.params?.name ?? "Chat"}
              </Text>
            </TouchableOpacity>
          ),
        })}
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
        name="CommunityDetailScreen"
        component={CommunityDetailScreen}
        options={({ route, navigation }) => {
          const communityName = route.params?.name ?? "Community";

          return {
            title: "",
            headerBackTitle: "Back",
            headerRight: () => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EditCommunityScreen", {
                    id: route.params?.id,
                  })
                }
              >
                <Text style={{ color: themeColors.tint, marginRight: 10, fontSize: rMS(19) }}>
                  Edit
                </Text>
              </TouchableOpacity>
            ),
          };
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
              <Text style={{ color: themeColors.tint, marginLeft: 5, fontSize: rMS(19) }}>
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