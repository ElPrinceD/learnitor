import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, Linking } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "./components/AuthContext";
import ApiUrl from "./config";
import { useConsent } from "./contexts/ConsentContext";

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
  const { hasConsent } = useConsent();

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
        { 
          token: tokenData,
          platform: Platform.OS,
          consent_types: {
            notifications: hasConsent("notifications"),
            marketing: hasConsent("marketing"),
            analytics: hasConsent("analytics")
          }
        },
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

    // Check if user has consented to notifications
    if (!hasConsent("notifications")) {
      console.log("[PushNotifications] User has not consented to notifications");
      return;
    }

    try {
      // Check if we're in Expo Go (which doesn't support FCM)
      if (Constants.appOwnership === 'expo') {
        console.warn("[PushNotifications] Push notifications not supported in Expo Go");
        return;
      }

      // Check if we have the required configuration
      if (!Constants.expoConfig?.extra?.eas?.projectId) {
        console.warn("[PushNotifications] No EAS project ID found, push notifications may not work");
        return;
      }
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
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[PushNotifications] Notification permissions not granted");
        return;
      }

      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas.projectId,
          applicationId: Constants.expoConfig?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier,
        });
      } catch (tokenError) {
        console.error("[PushNotifications] Failed to get Expo push token:", tokenError);
        // Try without applicationId as fallback
        try {
          token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas.projectId,
          });
        } catch (fallbackError) {
          console.error("[PushNotifications] Fallback token request also failed:", fallbackError);
          throw fallbackError;
        }
      }

      const savedToken = await AsyncStorage.getItem("savedPushToken");
      if (savedToken !== token.data && userToken?.token) {
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
      
      // Check consent for different notification types
      if (data.type === "marketing" && !hasConsent("marketing")) {
        console.log("[PushNotifications] Ignoring marketing notification - no consent");
        return;
      }
      
      if (data.type === "analytics" && !hasConsent("analytics")) {
        console.log("[PushNotifications] Ignoring analytics notification - no consent");
        return;
      }

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
      handleNotification: async (notification) => {
        const data = notification.request.content.data || {};
        
        // Check consent for different notification types
        if (data.type === "marketing" && !hasConsent("marketing")) {
          return {
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }
        
        if (data.type === "analytics" && !hasConsent("analytics")) {
          return {
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }

        return {
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }, [hasConsent]);

  useEffect(() => {
    if (!userToken?.token) return;

    let isMounted = true;

    // Only register for push notifications if user has consented
    if (hasConsent("notifications")) {
      registerForPushNotificationsAsync(false).then((token) => {
        if (isMounted && token?.data) {
          setExpoPushToken(token);
        }
      });
    }

    // Clean up existing listeners before adding new ones
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (isMounted) {
          setNotification(notification);
          presentForegroundNotification(notification);
        }
      }
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        
        // Handle different notification types
        if (data?.type === "task_reminder" && data?.taskId) {
          router.push("/(tabs)/(reminder)/three");
        } else if (data?.type === "course_update" && data?.courseId) {
          router.push({ 
            pathname: "/(tabs)/(two)/CourseDetails", 
            params: { courseId: String(data.courseId) } 
          });
        } else if (data?.community_id) {
          router.push({
            pathname: "ChatScreen",
            params: {
              communityId: String(data.community_id),
              name: String(data.community_name || ""),
              image: String(data.community_image || ""),
            },
          });
        } else if (data?.type === "announcement") {
          router.push("/(tabs)/home");
        }
      });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
    };
  }, [userToken, hasConsent]);

  return {
    expoPushToken,
    notification,
    registerForPushNotificationsAsync,
  };
};
