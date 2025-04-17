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
import EditCommunityScreen from "./EditCommunityScreen";

export default function ChatScreenLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;

  return (
    <SafeAreaProvider>
      <Stack
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
          name="ChatScreen"
          options={({ route, navigation }) => ({
            headerShown: true,
            headerBackTitle: "Back",
            headerTitle: () => (
              <TouchableOpacity
                onPressIn={() =>
                  navigation.navigate("CommunityDetailScreen", {
                    id: route.params?.communityId,
                  })
                }
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Image
                  source={{ uri: route.params?.image }}
                  style={{
                    width: rS(30),
                    height: rV(30),
                    marginRight: SIZES.small,
                    borderRadius: rMS(SIZES.xSmall),
                  }}
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
                <TouchableOpacity
                  onPressIn={() =>
                    navigation.navigate("EditCommunityScreen", {
                      id: route.params?.id,
                    })
                  }
                >
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
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
        <Stack.Screen
          name="ImagePreviewScreen"
          options={{
            title: "Photos",
            headerBackTitle: "Back",
          }}
        />
            <Stack.Screen
          name="TimeTableList"
          options={{
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "TimeTable",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="TimeTableDetails"
          options={{
            headerShown: true,
            presentation: "containedModal",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "Timetable",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
            
          }}
        />
        <Stack.Screen
          name="EditPeriods"
          options={{
            headerShown: true,
            presentation: "containedModal",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            headerTitle: "Edit Periods",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShadowVisible: false,
          }}
        />
         <Stack.Screen
          name="TimeTable"
          options={{
            headerShown: true,
            presentation: "card",
            headerStyle: {
              backgroundColor: themeColors.background,
            },
            // animation: "slide_from_bottom",
            headerTitle: "Create a TimeTable",
            headerTitleAlign: "center",
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="EditCommunityScreen"
          options={({ navigation }) => ({
            title: "Edit Community",
            presentation: "modal",
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text
                  style={{
                    color: themeColors.text,
                    marginLeft: 5,
                    fontSize: rMS(19),
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  /* Save changes logic */
                }}
              >
                <Text
                  style={{
                    color: themeColors.errorText,
                    marginRight: 5,
                    fontSize: rMS(19),
                  }}
                >
                  Done
                </Text>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
