import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useCache } from "./CacheContext";
import { getCourseCategories, getCourses } from "../services/CoursesApiCalls";
import { getCategoryNames, getTodayPlans } from "../services/TimelineApiCalls";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

interface Task {
  id: number;
  title: string;
  due_date: string;
  due_time_start: string;
}

interface TimelineContextType {
  scheduleTaskNotification: (task: Task) => Promise<string | null>;
  cancelTaskNotification: (taskId: string) => Promise<void>;
  storeNotificationId: (
    taskId: string | number,
    notificationId: string
  ) => Promise<void>;
  getNotificationId: (taskId: string | number) => Promise<string | null>;
  checkNotificationPermissions: () => Promise<boolean>;
  requestNotificationPermissions: () => Promise<boolean>;
  cleanupOldNotifications: () => Promise<void>;
}

const TimelineContext = createContext<TimelineContextType | null>(null);

interface TimelineProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({
  token,
  children,
}) => {
  const { setItem, getItem, removeItem } = useCache();

  // Initialize notification categories and settings
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Notification handler is set in usePushNotifications.ts

        // No notification categories needed since we removed action buttons

        // Cleanup old notifications on app start
        try {
          const scheduledNotifications =
            await Notifications.getAllScheduledNotificationsAsync();
          const now = new Date();
          for (const notification of scheduledNotifications) {
            if (notification.trigger && "date" in notification.trigger) {
              const triggerDate = new Date(notification.trigger.date);
              if (triggerDate < now) {
                await Notifications.cancelScheduledNotificationAsync(
                  notification.identifier
                );
                console.log(
                  `Cleaned up old notification: ${notification.identifier}`
                );
              }
            }
          }
        } catch (error) {
          console.error("Failed to cleanup old notifications:", error);
        }
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };
    initializeNotifications();
  }, []);

  const checkNotificationPermissions =
    useCallback(async (): Promise<boolean> => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === "granted";
      } catch (error) {
        console.error("Failed to check notification permissions:", error);
        return false;
      }
    }, []);

  const cancelTaskNotification = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        const notificationId = await getItem(`notification_${taskId}`);
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          await removeItem(`notification_${taskId}`);
          console.log(`Cancelled notification for task ${taskId}`);
        }
      } catch (error) {
        console.error("Failed to cancel notification:", error);
      }
    },
    [getItem, removeItem]
  );

  const scheduleTaskNotification = useCallback(
    async (task: Task): Promise<string | null> => {
      try {
        // Validate task data
        if (
          !task ||
          !task.id ||
          !task.title ||
          !task.due_date ||
          !task.due_time_start
        ) {
          console.error("[TimelineContext] Invalid task data provided");
          return null;
        }

        // Check permissions first
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          console.warn(
            "[TimelineContext] Notification permissions not granted, cannot schedule notification"
          );
          return null;
        }

        // Parse and validate date/time
        console.log("[TimelineContext] Task data:", {
          due_date: task.due_date,
          due_time_start: task.due_time_start,
        });

        // Handle different date formats
        let dateParts: string[];
        if (task.due_date.includes("-")) {
          dateParts = task.due_date.split("-");
        } else if (task.due_date.includes("/")) {
          dateParts = task.due_date.split("/");
        } else {
          console.error(
            "[TimelineContext] Unsupported date format:",
            task.due_date
          );
          return null;
        }

        // Handle different time formats (HH:MM or HH:MM:SS)
        let timeParts: string[];
        if (task.due_time_start.includes(":")) {
          timeParts = task.due_time_start.split(":");
        } else {
          console.error(
            "[TimelineContext] Unsupported time format:",
            task.due_time_start
          );
          return null;
        }

        console.log("[TimelineContext] Parsed parts:", {
          dateParts,
          timeParts,
          datePartsLength: dateParts.length,
          timePartsLength: timeParts.length,
        });

        if (
          dateParts.length !== 3 ||
          (timeParts.length !== 2 && timeParts.length !== 3)
        ) {
          console.error("[TimelineContext] Invalid date/time format", {
            due_date: task.due_date,
            due_time_start: task.due_time_start,
            dateParts,
            timeParts,
          });
          return null;
        }

        let year, month, day: number;

        // Handle different date formats (YYYY-MM-DD vs MM/DD/YYYY)
        if (task.due_date.includes("-")) {
          // Assume YYYY-MM-DD format
          [year, month, day] = dateParts.map(Number);
        } else if (task.due_date.includes("/")) {
          // Assume MM/DD/YYYY format
          [month, day, year] = dateParts.map(Number);
        } else {
          console.error(
            "[TimelineContext] Unsupported date format:",
            task.due_date
          );
          return null;
        }

        // Handle both HH:MM and HH:MM:SS formats
        const [hours, minutes] = timeParts.slice(0, 2).map(Number);

        // Validate parsed values
        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          isNaN(hours) ||
          isNaN(minutes)
        ) {
          console.error("[TimelineContext] Invalid date/time values", {
            year,
            month,
            day,
            hours,
            minutes,
          });
          return null;
        }

        const triggerDate = new Date(year, month - 1, day, hours, minutes);

        // Check if date is valid
        if (isNaN(triggerDate.getTime())) {
          console.error("[TimelineContext] Invalid trigger date");
          return null;
        }

        const now = new Date();
        console.log(`[TimelineContext] Current time: ${now.toISOString()}`);
        console.log(
          `[TimelineContext] Trigger time: ${triggerDate.toISOString()}`
        );
        console.log(
          `[TimelineContext] Time difference: ${
            triggerDate.getTime() - now.getTime()
          }ms`
        );

        if (triggerDate <= now) {
          console.log(
            `[TimelineContext] Task ${task.id} is in the past, skipping notification`
          );
          return null;
        }

        // Cancel any existing notification for this task
        await cancelTaskNotification(task.id.toString());

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "📚 Plan Reminder",
            body: `"${task.title}" is due now!`,
            data: {
              taskId: task.id,
              type: "task_reminder",
              dueDate: task.due_date,
              dueTime: task.due_time_start,
            },
            sound: "default",
            badge: 1,
          },
          trigger: { type: "date", date: triggerDate } as any,
        });

        await setItem(`notification_${task.id}`, notificationId);
        console.log(
          `[TimelineContext] Scheduled notification for task ${
            task.id
          } at ${triggerDate.toISOString()} with ID: ${notificationId}`
        );

        return notificationId;
      } catch (error) {
        console.error(
          "[TimelineContext] Failed to schedule notification:",
          error
        );
        return null;
      }
    },
    [setItem, checkNotificationPermissions, cancelTaskNotification]
  );

  const requestNotificationPermissions =
    useCallback(async (): Promise<boolean> => {
      try {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            provideAppNotificationSettings: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        console.log(
          `[TimelineContext] Notification permission status: ${status}`
        );
        return status === "granted";
      } catch (error) {
        console.error("Failed to request notification permissions:", error);
        return false;
      }
    }, []);

  const cleanupOldNotifications = useCallback(async (): Promise<void> => {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      for (const notification of scheduledNotifications) {
        if (notification.trigger && "date" in notification.trigger) {
          const triggerDate = new Date(notification.trigger.date);
          if (triggerDate < now) {
            await Notifications.cancelScheduledNotificationAsync(
              notification.identifier
            );
            console.log(
              `Cleaned up old notification: ${notification.identifier}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old notifications:", error);
    }
  }, []);

  const storeNotificationId = useCallback(
    async (taskId: string | number, notificationId: string): Promise<void> => {
      await setItem(`notification_${taskId}`, notificationId);
    },
    [setItem]
  );

  const getNotificationId = useCallback(
    async (taskId: string | number): Promise<string | null> => {
      return await getItem(`notification_${taskId}`);
    },
    [getItem]
  );

  const contextValue: TimelineContextType = {
    scheduleTaskNotification,
    cancelTaskNotification,
    storeNotificationId,
    getNotificationId,
    checkNotificationPermissions,
    requestNotificationPermissions,
    cleanupOldNotifications,
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === null) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
};
