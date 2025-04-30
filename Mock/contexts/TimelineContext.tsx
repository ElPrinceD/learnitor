import React, { createContext, useContext, useCallback } from 'react';
import { useCache } from './CacheContext';
import { getCourseCategories, getCourses } from '../services/CoursesApiCalls';
import { getCategoryNames, getTodayPlans } from '../services/TimelineApiCalls';
import * as Notifications from 'expo-notifications';

interface Task {
  id: number;
  title: string;
  due_date: string;
  due_time_start: string;
}

interface TimelineContextType {
 
  fetchAndCacheTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  getCachedTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  fetchAndCacheCategoryNames: () => Promise<Record<number, string>>;
  getCachedCategoryNames: () => Promise<Record<number, string>>;
  scheduleTaskNotification: (task: Task) => Promise<string | null>;
  cancelTaskNotification: (taskId: string) => Promise<void>;
  storeNotificationId: (taskId: string | number, notificationId: string) => Promise<void>;
  getNotificationId: (taskId: string | number) => Promise<string | null>;
}

const TimelineContext = createContext<TimelineContextType | null>(null);

interface TimelineProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ token, children }) => {
  const { setItem, getItem, removeItem } = useCache();





  const fetchAndCacheTodayPlans = useCallback(
    async (date: Date, category?: string) => {
      if (token) {
        try {
          const dateString = date.toISOString().split('T')[0];
          const normalizedCategory = category || 'all';
          const cacheKey = `todayPlans_${dateString}_${normalizedCategory}`;
          const cachedPlans = await getItem(cacheKey);
          if (cachedPlans) {
            return JSON.parse(cachedPlans);
          }
          const plans = await getTodayPlans(token, date, normalizedCategory === 'all' ? undefined : normalizedCategory);
          await setItem(cacheKey, JSON.stringify(plans));
          return plans;
        } catch (error) {
          console.error("Failed to fetch or cache today's plans:", error);
          throw error;
        }
      }
      return [];
    },
    [token, getItem, setItem]
  );

  const getCachedTodayPlans = useCallback(
    async (date: Date, category?: string) => {
      const dateString = date.toISOString().split('T')[0];
      const normalizedCategory = category || 'all';
      const cacheKey = `todayPlans_${dateString}_${normalizedCategory}`;
      const cachedData = await getItem(cacheKey);
      return cachedData ? JSON.parse(cachedData) : [];
    },
    [getItem]
  );

  const fetchAndCacheCategoryNames = useCallback(
    async () => {
      if (token) {
        try {
          const cachedCategories = await getItem('categoryNames');
          if (cachedCategories) {
            return JSON.parse(cachedCategories);
          }
          const categories = await getCategoryNames(token);
          await setItem('categoryNames', JSON.stringify(categories));
          return categories;
        } catch (error) {
          console.error('Failed to fetch or cache category names:', error);
          throw error;
        }
      }
      return {};
    },
    [token, getItem, setItem]
  );

  const getCachedCategoryNames = useCallback(async (): Promise<Record<number, string>> => {
    const cachedData = await getItem('categoryNames');
    return cachedData ? JSON.parse(cachedData) : {};
  }, [getItem]);

  const scheduleTaskNotification = useCallback(
    async (task: Task): Promise<string | null> => {
      try {
        const [year, month, day] = task.due_date.split('-').map(Number);
        const [hours, minutes] = task.due_time_start.split(':').map(Number);
        const triggerDate = new Date(year, month - 1, day, hours, minutes);

        if (triggerDate <= new Date()) {
          console.log(`Task ${task.id} is in the past, skipping notification`);
          return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Plan Reminder',
            body: `Your plan "${task.title}" is due now!`,
            data: { taskId: task.id },
            sound: 'default',
          },
          trigger: triggerDate,
        });

        console.log(`Scheduled notification for task ${task.id} at ${triggerDate.toISOString()}`);
        await setItem(`notification_${task.id}`, notificationId);
        return notificationId;
      } catch (error) {
        console.error('Failed to schedule notification:', error);
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
          console.log(`Canceled notification for task ${taskId}`);
        }
      } catch (error) {
        console.error('Failed to cancel notification:', error);
      }
    },
    [getItem, removeItem]
  );

  const storeNotificationId = useCallback(
    async (taskId: string | number, notificationId: string): Promise<void> => {
      await setItem(`notification_${taskId}`, notificationId);
      console.log(`Stored notification ID ${notificationId} for task ${taskId}`);
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
    fetchAndCacheTodayPlans,
    getCachedTodayPlans,
    fetchAndCacheCategoryNames,
    getCachedCategoryNames,
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
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};