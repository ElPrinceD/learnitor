import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import ApiUrl from './config';
import { useAuth } from "./components/AuthContext";
import { router } from "expo-router";
import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const { userToken } = useAuth();
  
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
      await Notifications.setNotificationChannelAsync("default", {
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
        { token: tokenData },
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

  // Set up notification handler
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  // Handle foreground notifications
  async function presentForegroundNotification(notification: Notifications.Notification) {
    if (!notification) return;

    const data = notification.request.content.data || {};
    const imageUrl = data.community_image || null;
    // Determine content type for notification body
    let notificationBody = notification.request.content.body || "";
    if (data.image && !data.message) {
      notificationBody = "Photo";
    } else if (data.document && !data.message) {
      notificationBody = "Document";
    }

    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync("default", [
        {
          identifier: "default",
          buttonTitle: "Open",
          options: { opensAppToForeground: true },
        },
      ]);
    }

    // Construct notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: notification.request.content.title,
      body: notificationBody,
      data: notification.request.content.data,
      subtitle: notification.request.content.subtitle || undefined,
      sound: notification.request.content.sound || "default",
      // Only include attachments if imageUrl is valid
      attachments: imageUrl ? [{ url: imageUrl }] : [],
      badge: notification.request.content.badge || undefined,
      categoryIdentifier: notification.request.content.categoryIdentifier || "default",
      threadIdentifier: notification.request.content.threadIdentifier || "",
    };

    try {
      // Schedule notification to display immediately
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Immediate display
      });
    } catch (error) {
      console.error("Error scheduling foreground notification:", error);
    }
  }

  useEffect(() => {
    if (!userToken?.token) {
      console.log("Waiting for user token...");
      return;
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);

        // Save token if it has changed
        AsyncStorage.getItem("savedPushToken").then((storedToken) => {
          if (storedToken !== token.data) {
            saveTokenToBackend(token.data, userToken.token);
            AsyncStorage.setItem("savedPushToken", token.data);
          }
        });
      }
    });

    // Handle foreground notifications
    if (!notificationListener.current) {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);
        // Present notification in foreground
        presentForegroundNotification(notification);
      });
    }

    // Handle notification interactions
    if (!responseListener.current) {
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        const { data } = response.notification.request.content;
        if (data && data.community_id) {
          router.push({
            pathname: "ChatScreen",
            params: { communityId: data.community_id, name: data.community_name, image: data.community_image },
          });
        }
      });
    }

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = undefined;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = undefined;
      }
    };
  }, [userToken]);

  return {
    expoPushToken,
    notification,
  };
};