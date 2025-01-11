import { Stack } from "expo-router";
import React from "react";
import { useColorScheme, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { rMS } from "../../constants"; // Assuming this is defined in the same place

export default function ChatScreenLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaProvider>
      <Stack>
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
      </Stack>
    </SafeAreaProvider>
  );
}