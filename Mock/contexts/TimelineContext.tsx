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

// Configuration for notification timing buffers to compensate for system delays
const NOTIFICATION_BUFFERS = {
  MAIN_NOTIFICATION_MINUTES: 1, // Schedule main notification 1 minute early
  REMINDER_NOTIFICATION_MINUTES: 0, // No additional buffer for reminder (let it use the minutesBefore parameter)
};

interface Task {
  id: number;
  title: string;
  due_date: string;
  due_time_start: string;
}

interface TimelineContextType {
  scheduleTaskNotification: (task: Task) => Promise<string | null>;
  scheduleTaskReminderNotification: (
    task: Task,
    minutesBefore?: number
  ) => Promise<string | null>;
  cancelTaskNotification: (taskId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  listScheduledNotifications: () => Promise<void>;
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
        // Cancel main notification
        const notificationId = await getItem(`notification_${taskId}`);
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          await removeItem(`notification_${taskId}`);
          console.log(
            `[TimelineContext] Cancelled notification for task ${taskId}`
          );
        }

        // Cancel reminder notification if it exists
        const reminderNotificationId = await getItem(
          `notification_${taskId}_reminder`
        );
        if (reminderNotificationId) {
          await Notifications.cancelScheduledNotificationAsync(
            reminderNotificationId
          );
          await removeItem(`notification_${taskId}_reminder`);
          console.log(
            `[TimelineContext] Cancelled reminder notification for task ${taskId}`
          );
        }
      } catch (error) {
        console.error(
          `[TimelineContext] Failed to cancel notification for task ${taskId}:`,
          error
        );
      }
    },
    [getItem, removeItem]
  );

  const scheduleTaskReminderNotification = useCallback(
    async (task: Task, minutesBefore: number = 5): Promise<string | null> => {
      try {
        // Validate task data
        if (
          !task ||
          !task.id ||
          !task.title ||
          !task.due_date ||
          !task.due_time_start
        ) {
          console.error(
            "[TimelineContext] Invalid task data provided for reminder"
          );
          return null;
        }

        // Check permissions first
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          console.warn(
            "[TimelineContext] Notification permissions not granted, cannot schedule reminder notification"
          );
          return null;
        }

        // Use the simple parsing logic from the working version
        const [year, month, day] = task.due_date.split("-").map(Number);
        const [hours, minutes] = task.due_time_start.split(":").map(Number);

        // Calculate reminder time (minutes before start time)
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const reminderDate = new Date(
          startDate.getTime() - minutesBefore * 60 * 1000
        );

        // Ensure reminder is at least 2 minutes before main notification
        const mainNotificationTime = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes - NOTIFICATION_BUFFERS.MAIN_NOTIFICATION_MINUTES
        );
        const minGapMinutes = 2;
        const minReminderTime = new Date(
          mainNotificationTime.getTime() - minGapMinutes * 60 * 1000
        );

        if (reminderDate <= minReminderTime) {
          console.log(
            `[TimelineContext] Reminder too close to main notification, adjusting to ${minGapMinutes} minutes before main`
          );
          reminderDate.setTime(minReminderTime.getTime());
        }

        // Check if reminder date is valid and in the future
        if (isNaN(reminderDate.getTime())) {
          console.error("[TimelineContext] Invalid reminder date");
          return null;
        }

        const now = new Date();
        const reminderTimeDifferenceMs = reminderDate.getTime() - now.getTime();
        const reminderTimeDifferenceMinutes = Math.round(
          reminderTimeDifferenceMs / (1000 * 60)
        );

        console.log(
          `[TimelineContext] Reminder - Current time: ${now.toISOString()}`
        );
        console.log(
          `[TimelineContext] Reminder - Original task time: ${task.due_time_start}`
        );
        console.log(
          `[TimelineContext] Reminder - Trigger time (with buffer): ${reminderDate.toISOString()}`
        );
        console.log(
          `[TimelineContext] Reminder - Time difference: ${reminderTimeDifferenceMs}ms (${reminderTimeDifferenceMinutes} minutes)`
        );
        const totalReminderOffset =
          minutesBefore + NOTIFICATION_BUFFERS.REMINDER_NOTIFICATION_MINUTES;
        const reminderOffsetText =
          totalReminderOffset > 0
            ? `${totalReminderOffset} minutes early`
            : `${Math.abs(totalReminderOffset)} minutes late`;
        console.log(
          `[TimelineContext] Reminder - Scheduled ${reminderOffsetText} to compensate for system delays`
        );

        if (reminderDate <= now) {
          console.log(
            `[TimelineContext] Task ${task.id} reminder is in the past, skipping reminder notification`
          );
          return null;
        }

        // Cancel any existing reminder notification for this task
        await cancelTaskNotification(`${task.id}_reminder`);

        // Format the time for display
        const timeString = task.due_time_start;
        const [startHours, startMinutes] = timeString.split(":").map(Number);
        const formattedStartTime = new Date(
          2000,
          0,
          1,
          startHours,
          startMinutes
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "⏰ Task Reminder",
            body: `"${task.title}" starts in ${minutesBefore} minutes (at ${formattedStartTime})`,
            data: {
              taskId: task.id,
              type: "task_reminder_advance",
              dueDate: task.due_date,
              dueTime: task.due_time_start,
              startTime: formattedStartTime,
              minutesBefore: minutesBefore,
            },
            sound: "default",
            badge: 1,
          },
          trigger: { type: "date", date: reminderDate } as any,
        });

        await setItem(`notification_${task.id}_reminder`, notificationId);

        const currentTime = new Date();
        const timeUntilReminder = Math.round(
          (reminderDate.getTime() - currentTime.getTime()) / (1000 * 60)
        );
        const timeUntilMain = Math.round(
          (mainNotificationTime.getTime() - currentTime.getTime()) / (1000 * 60)
        );

        console.log(
          `[TimelineContext] Scheduled reminder notification for task ${task.id}:`
        );
        console.log(
          `  - Reminder at: ${reminderDate.toISOString()} (${timeUntilReminder} minutes from now)`
        );
        console.log(
          `  - Main notification at: ${mainNotificationTime.toISOString()} (${timeUntilMain} minutes from now)`
        );
        console.log(
          `  - Gap between notifications: ${
            timeUntilMain - timeUntilReminder
          } minutes`
        );
        console.log(`  - Notification ID: ${notificationId}`);

        return notificationId;
      } catch (error) {
        console.error(
          "[TimelineContext] Failed to schedule reminder notification:",
          error
        );
        return null;
      }
    },
    [setItem, checkNotificationPermissions, cancelTaskNotification]
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

        // Use the simple parsing logic from the working version
        const [year, month, day] = task.due_date.split("-").map(Number);
        const [hours, minutes] = task.due_time_start.split(":").map(Number);

        // Add small buffer to compensate for system delays
        const triggerDate = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes - NOTIFICATION_BUFFERS.MAIN_NOTIFICATION_MINUTES
        );

        // Check if date is valid
        if (isNaN(triggerDate.getTime())) {
          console.error("[TimelineContext] Invalid trigger date");
          return null;
        }

        const now = new Date();
        const timeDifferenceMs = triggerDate.getTime() - now.getTime();
        const timeDifferenceMinutes = Math.round(
          timeDifferenceMs / (1000 * 60)
        );

        console.log(`[TimelineContext] Current time: ${now.toISOString()}`);
        console.log(
          `[TimelineContext] Original task time: ${task.due_time_start}`
        );
        console.log(
          `[TimelineContext] Trigger time (with buffer): ${triggerDate.toISOString()}`
        );
        console.log(
          `[TimelineContext] Time difference: ${timeDifferenceMs}ms (${timeDifferenceMinutes} minutes)`
        );
        const mainOffsetText =
          NOTIFICATION_BUFFERS.MAIN_NOTIFICATION_MINUTES > 0
            ? `${NOTIFICATION_BUFFERS.MAIN_NOTIFICATION_MINUTES} minute(s) early`
            : `${Math.abs(
                NOTIFICATION_BUFFERS.MAIN_NOTIFICATION_MINUTES
              )} minute(s) late`;
        console.log(
          `[TimelineContext] Scheduled ${mainOffsetText} to compensate for system delays`
        );

        if (triggerDate <= now) {
          console.log(
            `[TimelineContext] Task ${task.id} is in the past, skipping notification`
          );
          return null;
        }

        // Cancel any existing notification for this task
        await cancelTaskNotification(task.id.toString());

        // Format the time for display
        const timeString = task.due_time_start;
        const [displayHours, displayMinutes] = timeString
          .split(":")
          .map(Number);
        const formattedTime = new Date(
          2000,
          0,
          1,
          displayHours,
          displayMinutes
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "📚 Task Starting Now",
            body: `"${task.title}" starts at ${formattedTime}`,
            data: {
              taskId: task.id,
              type: "task_reminder",
              dueDate: task.due_date,
              dueTime: task.due_time_start,
              startTime: formattedTime,
            },
            sound: "default",
            badge: 1,
          },
          trigger: { type: "date", date: triggerDate } as any,
        });

        await setItem(`notification_${task.id}`, notificationId);

        const currentTime = new Date();
        const timeUntilNotification = Math.round(
          (triggerDate.getTime() - currentTime.getTime()) / (1000 * 60)
        );

        console.log(
          `[TimelineContext] Scheduled main notification for task ${task.id}:`
        );
        console.log(
          `  - Notification at: ${triggerDate.toISOString()} (${timeUntilNotification} minutes from now)`
        );
        console.log(`  - Original task time: ${task.due_time_start}`);
        console.log(`  - Notification ID: ${notificationId}`);

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

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      console.log(
        "[TimelineContext] Cancelling all scheduled notifications..."
      );
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
        console.log(
          `[TimelineContext] Cancelled notification: ${notification.identifier}`
        );
      }

      // Clear all stored notification IDs
      // Note: This is a simplified approach - in a real app you might want to be more selective
      console.log("[TimelineContext] All notifications cancelled");
    } catch (error) {
      console.error(
        "[TimelineContext] Failed to cancel all notifications:",
        error
      );
    }
  }, []);

  const listScheduledNotifications = useCallback(async (): Promise<void> => {
    try {
      console.log("[TimelineContext] Listing all scheduled notifications...");
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      console.log(
        `[TimelineContext] Found ${scheduledNotifications.length} scheduled notifications:`
      );

      for (const notification of scheduledNotifications) {
        const data = notification.content.data || {};
        const trigger = notification.trigger as any;
        const triggerDate = trigger?.date ? new Date(trigger.date) : null;

        console.log(`[TimelineContext] Notification:`, {
          id: notification.identifier,
          title: notification.content.title,
          body: notification.content.body,
          taskId: data.taskId,
          type: data.type,
          triggerDate: triggerDate?.toISOString(),
          triggerDateReadable: triggerDate?.toLocaleString(),
        });
      }
    } catch (error) {
      console.error(
        "[TimelineContext] Failed to list scheduled notifications:",
        error
      );
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
    scheduleTaskReminderNotification,
    cancelTaskNotification,
    cancelAllNotifications,
    listScheduledNotifications,
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
