import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "./components/AuthContext";
import ApiUrl from "./config";

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
  const { userToken } = useAuth();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.warn("[PushNotifications] Must use a physical device");
      return;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("[PushNotifications] Existing permission status:", existingStatus);

      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowSound: true,
            allowBadge: true,
            provideAppNotificationSettings: true,
          },
        });
        finalStatus = status;
        console.log("[PushNotifications] Requested permission status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        console.warn("[PushNotifications] Permission not granted");
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
      console.log("[PushNotifications] Expo Push Token:", token.data);
      return token;
    } catch (error) {
      console.error("[PushNotifications] Error registering for notifications:", error);
      return undefined;
    }
  }

  async function saveTokenToBackend(tokenData: string, authToken: string) {
    if (!authToken) {
      console.error("[PushNotifications] No auth token provided");
      return;
    }

    try {
      const response = await axios.post(
        `${ApiUrl}/api/register-device/`,
        { token: tokenData },
        {
          headers: { Authorization: `Token ${authToken}` },
        }
      );
      console.log("[PushNotifications] Token saved to backend:", response.data);
    } catch (error) {
      console.error("[PushNotifications] Failed to save token:", error);
    }
  }

  async function presentForegroundNotification(
    notification: Notifications.Notification
  ) {
    try {
      const content = notification.request.content;
      const data = content.data || {};
      const title = content.title || "New Notification";
      const body =
        content.body ||
        (data.image && !data.message
          ? "Photo"
          : data.document && !data.message
          ? "Document"
          : "No message content");

      console.log("[PushNotifications] Presenting notification:", { title, body, data });

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
          badge: content.badge ?? 1,
        },
        trigger: null, // Immediate trigger for foreground
        identifier: notification.request.identifier,
      });

      console.log("[PushNotifications] Foreground notification scheduled");
    } catch (error) {
      console.error("[PushNotifications] Error presenting notification:", error);
    }
  }

  useEffect(() => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        console.log("[PushNotifications] Handling notification in foreground");
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
  }, []);

  useEffect(() => {
    if (!userToken?.token) {
      console.log("[PushNotifications] Waiting for user token");
      return;
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token?.data) {
        setExpoPushToken(token);
        AsyncStorage.getItem("savedPushToken").then((storedToken) => {
          if (storedToken !== token.data) {
            saveTokenToBackend(token.data, userToken.token);
            AsyncStorage.setItem("savedPushToken", token.data);
          }
        });
      }
    });

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[PushNotifications] Notification received:", notification);
        setNotification(notification);
        presentForegroundNotification(notification);
      }
    );

    // Notification tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[PushNotifications] Notification tapped:", response);
        const data = response.notification.request.content.data;
        if (data?.community_id) {
          router.push({
            pathname: "ChatScreen",
            params: {
              communityId: data.community_id,
              name: data.community_name,
              image: data.community_image,
            },
          });
        }
      }
    );

    // Cleanup
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