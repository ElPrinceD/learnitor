import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useCache } from "./CacheContext";
import * as Notifications from "expo-notifications";

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
              }
            }
          }
        } catch (error) {
          // Silent cleanup failure
        }
      } catch (error) {
        // Silent initialization failure
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
        }
      } catch (error) {
        // Silent cancellation failure
      }
    },
    [getItem, removeItem]
  );

  const scheduleTaskReminderNotification = useCallback(
    async (task: Task, minutesBefore: number = 10): Promise<string | null> => {
      try {
        // Validate task data
        if (
          !task ||
          !task.id ||
          !task.title ||
          !task.due_date ||
          !task.due_time_start
        ) {
          return null;
        }

        // Check permissions first
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          return null;
        }

        // Use the simple parsing logic from the working version
        const [year, month, day] = task.due_date.split("-").map(Number);
        const [hours, minutes] = task.due_time_start.split(":").map(Number);

        // Calculate reminder time (minutes before start time)
        const startDate = new Date(year, month - 1, day, hours, minutes - 5);
        const reminderDate = new Date(
          startDate.getTime() - minutesBefore * 60 * 1000
        );

        // Check if reminder date is valid and in the future
        if (isNaN(reminderDate.getTime())) {
          return null;
        }

        const now = new Date();
        if (reminderDate <= now) {
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
            body: `"${task.title}" starts soon (at ${formattedStartTime})`,
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
        return notificationId;
      } catch (error) {
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
          return null;
        }

        // Check permissions first
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          return null;
        }

        // Use the simple parsing logic from the working version
        const [year, month, day] = task.due_date.split("-").map(Number);
        const [hours, minutes] = task.due_time_start.split(":").map(Number);

        const triggerDate = new Date(year, month - 1, day, hours, minutes - 3);

        // Check if date is valid
        if (isNaN(triggerDate.getTime())) {
          return null;
        }

        const now = new Date();
        if (triggerDate <= now) {
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
            title: "📚 Task Reminder",
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
        return notificationId;
      } catch (error) {
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
        return status === "granted";
      } catch (error) {
        return false;
      }
    }, []);

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    } catch (error) {
      // Silent cancellation failure
    }
  }, []);

  const listScheduledNotifications = useCallback(async (): Promise<void> => {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      // Function exists for debugging purposes but doesn't log
    } catch (error) {
      // Silent failure
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
          }
        }
      }
    } catch (error) {
      // Silent cleanup failure
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
