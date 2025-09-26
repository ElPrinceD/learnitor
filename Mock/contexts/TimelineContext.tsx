import React, { createContext, useContext, useCallback } from "react";
import { useCache } from "./CacheContext";
import { getCourseCategories, getCourses } from "../services/CoursesApiCalls";
import { getCategoryNames, getTodayPlans } from "../services/TimelineApiCalls";
import * as Notifications from "expo-notifications";

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

  const scheduleTaskNotification = useCallback(
    async (task: Task): Promise<string | null> => {
      try {
        const [year, month, day] = task.due_date.split("-").map(Number);
        const [hours, minutes] = task.due_time_start.split(":").map(Number);
        const triggerDate = new Date(year, month - 1, day, hours, minutes);

        if (triggerDate <= new Date()) {
          return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Plan Reminder",
            body: `Your plan "${task.title}" is due now!`,
            data: { taskId: task.id },
            sound: "default",
          },
          trigger: {
            type: "date",
            date: triggerDate,
          },
        });

        await setItem(`notification_${task.id}`, notificationId);
        return notificationId;
      } catch (error) {
        console.error("Failed to schedule notification:", error);
        return null;
      }
    },
    [setItem]
  );

  const cancelTaskNotification = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        const notificationId = await getItem(`notification_${taskId}`);
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          await removeItem(`notification_${taskId}`);
        }
      } catch (error) {
        console.error("Failed to cancel notification:", error);
      }
    },
    [getItem, removeItem]
  );

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
