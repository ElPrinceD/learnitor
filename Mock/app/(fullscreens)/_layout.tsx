import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../components/AuthContext";
import CommunityDetailScreen from "./CommunityDetailScreen";
import CommunityImagesScreen from "./CommunityImageScreen";

export default function ChatScreenLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{
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
                  style={{ width: rS(30), height: rV(30), marginRight: SIZES.small, borderRadius: rMS(SIZES.xSmall) }}
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
            const isCreator = route.params?.created_by === user?.email; // Assume userEmail is passed or stored in navigation state

            return {
              title: "Squad Info",
              headerBackTitle: "Back",
              headerRight: () => (
                isCreator ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditCommunityScreen", {
                        id: route.params?.id,
                      })
                    }
                  >
                    <Ionicons name="settings-outline" size={24} color={themeColors.text} />
                  </TouchableOpacity>
                ) : null
              ),
            };
          }}
        />
         <Stack.Screen
          name="CommunityImageScreen"
          
          options={{
            title: "Photos",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}