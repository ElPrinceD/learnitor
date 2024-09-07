import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import ApiUrl from './config';
import { useAuth } from "./components/AuthContext";
import { router, useFocusEffect } from "expo-router";
import { Platform } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();
  const { userToken } = useAuth(); // Get userToken from auth context
  const navigation = useNavigation(); // For navigating to the chat screen

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification");
        return;
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
    } else {
      alert("Must be using a physical device for Push notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  async function saveTokenToBackend(tokenData: string, authToken: string) {
    if (!authToken) {
      console.error("User token is undefined, cannot save push token.");
      return;
    }

    try {
      const response = await axios.post(
        `${ApiUrl}/api/register-device/`,
        { token: tokenData.data },
        {
          headers: {
            Authorization: `Token ${authToken}`,
          },
        }
      );
      console.log("Push token saved:", response.data);
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  }

  useEffect(() => {
    if (!userToken?.token) {
      console.log("Waiting for user token...");
      return; // Wait until the userToken is available
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToBackend(token, userToken?.token); // Pass userToken directly here
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        if (data && data.community_id && data.message_id) {
          // Navigate to the chat screen with community_id and message_id
          console.log(data)
          router.navigate({ 
            pathname: 'ChatScreen', 
            params: { communityId: data.community_id, name: data.community_name},
          }
          );
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, [userToken, navigation]); // Effect runs when userToken updates

  return {
    expoPushToken,
    notification,
  };
};