import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { rMS } from "../../constants"; // Assuming this is defined in the same place
import { Ionicons } from "@expo/vector-icons";
import CommunityDetailScreen from "./CommunityDetailScreen";

export default function ChatScreenLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaProvider>
      <Stack  screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center",
        headerShadowVisible: false,
      }}>
        <Stack.Screen
          name="ChatScreen"
          options={({ route, navigation }) => ({
            headerShown: true,
            headerBackTitle: "Back",
           
            headerTitle: () => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("CommunityDetailScreen", {
                    id: route.params?.communityId,
                  })
                }
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Image 
                  source={{ uri: route.params?.image }} 
                  style={{ width: 30, height: 30, marginRight: 10 }}
                />
                <Text
                  style={{
                    color: themeColors.text,
                    fontSize: rMS(19),
                    fontWeight: "bold",
                  }}
                >
                  {route.params?.name ?? "Chat"}
                </Text>
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: themeColors.reverseText,
            },
            
            headerTitleAlign: "center",
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          })}
        />

<Stack.Screen
        name="CommunityDetailScreen"
        
        options={({ route, navigation }) => {
          const communityName = route.params?.name ?? "Community";

          return {
            title: "Squad Info",
            headerBackTitle: "Back",
            headerRight: () => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EditCommunityScreen", {
                    id: route.params?.id,
                  })
                }
              >
                <Ionicons name="settings-outline" size={24} color={themeColors.text} />
              </TouchableOpacity>
            ),
          };
        }}
      />
      </Stack>
    </SafeAreaProvider>
  );
}