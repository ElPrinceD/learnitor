import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { useCacheStore } from './cacheStore';

// ── Types ──────────────────────────────────────────────────────────────
interface Task {
  id: number;
  title: string;
  due_date: string;
  due_time_start: string;
}

interface TimelineState {
  // Actions
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
  /** Run once on app start to clean stale notifications. */
  _initializeNotifications: () => void;
}

// ── Cache helpers (cross-store access) ─────────────────────────────────
const cacheSetItem = (key: string, value: string) =>
  useCacheStore.getState().setItem(key, value);
const cacheGetItem = (key: string) =>
  useCacheStore.getState().getItem(key);
const cacheRemoveItem = (key: string) =>
  useCacheStore.getState().removeItem(key);

// ── Store ──────────────────────────────────────────────────────────────
export const useTimelineStore = create<TimelineState>()((_set, _get) => ({
  _initializeNotifications: () => {
    (async () => {
      try {
        const scheduledNotifications =
          await Notifications.getAllScheduledNotificationsAsync();
        const now = new Date();
        for (const notification of scheduledNotifications) {
          if (notification.trigger && 'date' in notification.trigger) {
            const triggerDate = new Date(notification.trigger.date);
            if (triggerDate < now) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
          }
        }
      } catch {
        // Silent cleanup failure
      }
    })();
  },

  checkNotificationPermissions: async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  requestNotificationPermissions: async () => {
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
      } as any);
      return status === 'granted';
    } catch {
      return false;
    }
  },

  cancelTaskNotification: async (taskId) => {
    try {
      // Cancel main notification
      const notificationId = await cacheGetItem(`notification_${taskId}`);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await cacheRemoveItem(`notification_${taskId}`);
      }

      // Cancel reminder notification if it exists
      const reminderNotificationId = await cacheGetItem(
        `notification_${taskId}_reminder`
      );
      if (reminderNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          reminderNotificationId
        );
        await cacheRemoveItem(`notification_${taskId}_reminder`);
      }
    } catch {
      // Silent cancellation failure
    }
  },

  scheduleTaskReminderNotification: async (task, minutesBefore = 10) => {
    try {
      if (!task || !task.id || !task.title || !task.due_date || !task.due_time_start) {
        return null;
      }

      const hasPermission = await _get().checkNotificationPermissions();
      if (!hasPermission) return null;

      const [year, month, day] = task.due_date.split('-').map(Number);
      const [hours, minutes] = task.due_time_start.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hours, minutes - 5);
      const reminderDate = new Date(
        startDate.getTime() - minutesBefore * 60 * 1000
      );

      if (isNaN(reminderDate.getTime())) return null;
      if (reminderDate <= new Date()) return null;

      await _get().cancelTaskNotification(`${task.id}_reminder`);

      const timeString = task.due_time_start;
      const [startHours, startMinutes] = timeString.split(':').map(Number);
      const formattedStartTime = new Date(
        2000, 0, 1, startHours, startMinutes
      ).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Reminder',
          body: `"${task.title}" starts soon (at ${formattedStartTime})`,
          data: {
            taskId: task.id,
            type: 'task_reminder_advance',
            dueDate: task.due_date,
            dueTime: task.due_time_start,
            startTime: formattedStartTime,
            minutesBefore: minutesBefore,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: { type: 'date', date: reminderDate } as any,
      });

      await cacheSetItem(`notification_${task.id}_reminder`, notificationId);
      return notificationId;
    } catch {
      return null;
    }
  },

  scheduleTaskNotification: async (task) => {
    try {
      if (!task || !task.id || !task.title || !task.due_date || !task.due_time_start) {
        return null;
      }

      const hasPermission = await _get().checkNotificationPermissions();
      if (!hasPermission) return null;

      const [year, month, day] = task.due_date.split('-').map(Number);
      const [hours, minutes] = task.due_time_start.split(':').map(Number);

      const triggerDate = new Date(year, month - 1, day, hours, minutes - 3);

      if (isNaN(triggerDate.getTime())) return null;
      if (triggerDate <= new Date()) return null;

      await _get().cancelTaskNotification(task.id.toString());

      const timeString = task.due_time_start;
      const [displayHours, displayMinutes] = timeString.split(':').map(Number);
      const formattedTime = new Date(
        2000, 0, 1, displayHours, displayMinutes
      ).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Task Reminder',
          body: `"${task.title}" starts at ${formattedTime}`,
          data: {
            taskId: task.id,
            type: 'task_reminder',
            dueDate: task.due_date,
            dueTime: task.due_time_start,
            startTime: formattedTime,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: { type: 'date', date: triggerDate } as any,
      });

      await cacheSetItem(`notification_${task.id}`, notificationId);
      return notificationId;
    } catch {
      return null;
    }
  },

  cancelAllNotifications: async () => {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    } catch {
      // Silent cancellation failure
    }
  },

  listScheduledNotifications: async () => {
    try {
      await Notifications.getAllScheduledNotificationsAsync();
      // Function exists for debugging purposes
    } catch {
      // Silent failure
    }
  },

  cleanupOldNotifications: async () => {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      for (const notification of scheduledNotifications) {
        if (notification.trigger && 'date' in notification.trigger) {
          const triggerDate = new Date(notification.trigger.date);
          if (triggerDate < now) {
            await Notifications.cancelScheduledNotificationAsync(
              notification.identifier
            );
          }
        }
      }
    } catch {
      // Silent cleanup failure
    }
  },

  storeNotificationId: async (taskId, notificationId) => {
    await cacheSetItem(`notification_${taskId}`, notificationId);
  },

  getNotificationId: async (taskId) => {
    return await cacheGetItem(`notification_${taskId}`);
  },
}));

// Initialize notification cleanup on module load
useTimelineStore.getState()._initializeNotifications();

// ── Backward-compatible hook ───────────────────────────────────────────
export const useTimeline = () => {
  const store = useTimelineStore();
  return {
    scheduleTaskNotification: store.scheduleTaskNotification,
    scheduleTaskReminderNotification: store.scheduleTaskReminderNotification,
    cancelTaskNotification: store.cancelTaskNotification,
    cancelAllNotifications: store.cancelAllNotifications,
    listScheduledNotifications: store.listScheduledNotifications,
    storeNotificationId: store.storeNotificationId,
    getNotificationId: store.getNotificationId,
    checkNotificationPermissions: store.checkNotificationPermissions,
    requestNotificationPermissions: store.requestNotificationPermissions,
    cleanupOldNotifications: store.cleanupOldNotifications,
  };
};
