import { useState, useEffect, useRef, useCallback } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import ApiUrl from "./config";
import { useAuth } from "./components/AuthContext";
import { router } from "expo-router";
import { Platform } from "react-native";
import axios from "axios";

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

  // Set up a notification handler once when the component mounts
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  // Update presentForegroundNotification so that it only schedules a notification if it hasn’t been scheduled already.
  async function presentForegroundNotification(notification: Notifications.Notification) {
    if (!notification) return;
    
    if (notification.request.content.data.presented) {
      // Already presented; do not schedule again.
      return;
    }

    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('default', [
        {
          identifier: 'default',
          buttonTitle: 'Open',
          options: { opensAppToForeground: true },
        },
      ]);
    }

    // Construct notification content, adding a flag to indicate it has been presented.
    const notificationContent = {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: { 
        ...notification.request.content.data,
        presented: true  // flag to avoid re-scheduling
      },
      subtitle: notification.request.content.subtitle || null,
      sound: notification.request.content.sound || "default",
      launchImageName: notification.request.content.launchImageName || "",
      badge: notification.request.content.badge || null,
      categoryIdentifier: notification.request.content.categoryIdentifier || "",
      threadIdentifier: notification.request.content.threadIdentifier || "",
      targetContentIdentifier: notification.request.content.targetContentIdentifier || null,
      interruptionLevel: notification.request.content.interruptionLevel || "active",
    };

    // Schedule the notification immediately.
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
  }

  useEffect(() => {
    if (!userToken?.token) {
      console.log("Waiting for user token...");
      return; // Wait until the userToken is available
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToBackend(token.data, userToken.token); 
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);
        
        // Present the notification when the app is in the foreground.
        // The presented flag prevents repeated scheduling.
        presentForegroundNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        if (data && data.community_id && data.message_id) {
          console.log("Notification response data:", data);
          router.push({
            pathname: 'ChatScreen',
            params: { communityId: data.community_id, name: data.community_name },
          });
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userToken]);

  return {
    expoPushToken,
    notification,
  };
};
