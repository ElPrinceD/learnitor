import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, Alert, Linking } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "./components/AuthContext";
import ApiUrl from "./config";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
  registerForPushNotificationsAsync: (
    showSettingsPrompt?: boolean
  ) => Promise<Notifications.ExpoPushToken | undefined>;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const { userToken } = useAuth();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  async function saveTokenToBackend(tokenData: string, authToken: string) {
    if (!authToken) {
      console.error("[PushNotifications] No auth token provided");
      return;
    }
    try {
      const response = await axios.post(
        `${ApiUrl}/api/register-device/`,
        { token: tokenData },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      console.log("[PushNotifications] Token saved to backend:", response.data);
    } catch (error) {
      console.error("[PushNotifications] Failed to save token:", error);
    }
  }

  async function registerForPushNotificationsAsync(
    showSettingsPrompt = false
  ): Promise<Notifications.ExpoPushToken | undefined> {
    if (!Device.isDevice) {
      console.warn("[PushNotifications] Must use a physical device");
      return;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

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
      }

      if (finalStatus !== "granted") {
        if (showSettingsPrompt) {
          Alert.alert(
            "Enable Notifications",
            "Please enable notifications in Settings to stay updated.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        }
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });

      const savedToken = await AsyncStorage.getItem("savedPushToken");
      if (savedToken !== token.data) {
        await saveTokenToBackend(token.data, userToken.token);
        await AsyncStorage.setItem("savedPushToken", token.data);
      }

      return token;
    } catch (error) {
      console.error("[PushNotifications] Error registering for notifications:", error);
      return undefined;
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

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
          badge: content.badge ?? 1,
        },
        trigger: null,
        identifier: notification.request.identifier,
      });
    } catch (error) {
      console.error("[PushNotifications] Error presenting notification:", error);
    }
  }

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!userToken?.token) return;

    registerForPushNotificationsAsync(false).then((token) => {
      if (token?.data) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        presentForegroundNotification(notification);
      }
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = null;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
    };
  }, [userToken]);

  return {
    expoPushToken,
    notification,
    registerForPushNotificationsAsync,
  };
};
