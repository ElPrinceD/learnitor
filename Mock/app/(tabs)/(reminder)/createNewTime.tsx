import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme.js";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput.tsx";
import {
  createTask,
  getCategories,
} from "../../../services/TimelineApiCalls.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";
import CustomPicker from "../../../components/CustomPicker";
import DateSelector from "../../../components/DateSelector.tsx";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector.tsx";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import { useTimeline } from "../../../contexts/TimelineContext"; // Added for TimelineContext
import { useCache } from "../../../contexts/CacheContext"; // Added for CacheContext

interface Category {
  value: number;
  label: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  due_date: string;
  due_time_start: string;
  due_time_end: string;
  category?: number | null;
  learner?: number;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
}

const CreateNewTime = () => {
  const { userToken, userInfo } = useAuth();
  const {
    scheduleTaskNotification,
    scheduleTaskReminderNotification,
    storeNotificationId,
  } = useTimeline(); // Use TimelineContext
  const { removeItem } = useCache(); // Use CacheContext for cache invalidation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { status: categoriesStatus, data: categoriesData } = useQuery({
    queryKey: ["taskCategories", userToken?.token],
    queryFn: () => getCategories(userToken?.token),
    enabled: !!userToken?.token,
  });

  const createTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskData, token }) => {
      return await createTask(taskData, token);
    },
    onSuccess: async (createdTask) => {
      const dateString = formatDate(dueDate);
      const categoryId = selectedCategory?.value?.toString();

      // Schedule notifications for the created task
      try {
        // Schedule main notification (at start time)
        const notificationId = await scheduleTaskNotification(createdTask);
        if (notificationId) {
          await storeNotificationId(createdTask.id, notificationId);
        }

        // Schedule reminder notification (5 minutes before start time)
        const reminderNotificationId = await scheduleTaskReminderNotification(
          createdTask,
          5
        );
        if (reminderNotificationId) {
          await storeNotificationId(
            `${createdTask.id}_reminder`,
            reminderNotificationId
          );
        }
      } catch (error) {
        // Silently handle notification errors - don't block the user
      }

      router.dismiss(1);
      setErrorMessage(null);
    },
    onError: (error) => {
      // Use ErrorMessage instead of alert for better UX
      if (error?.response?.status === 400) {
        setErrorMessage("Please check your input and try again.");
      } else if (error?.response?.status === 401) {
        setErrorMessage("Please log in again to continue.");
      } else if (error?.response?.status >= 500) {
        setErrorMessage(
          "Something went wrong on our end. Please try again later."
        );
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
  });

  const parseTime = (timeString: string): Date => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(":").map(Number);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return new Date();
    }
    const newDate = new Date();
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const formatTime = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "00:00";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime()))
      return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  const handleSaveTime = () => {
    // Clear any previous error messages
    setErrorMessage(null);

    // Validate required fields
    if (!title.trim()) {
      setErrorMessage("Please enter a title for your task.");
      return;
    }

    if (!selectedCategory) {
      setErrorMessage("Please select a category for your task.");
      return;
    }

    if (!dueDate || isNaN(dueDate.getTime())) {
      setErrorMessage("Please select a valid due date for your task.");
      return;
    }

    if (!startTime || isNaN(startTime.getTime())) {
      setErrorMessage("Please select a valid start time for your task.");
      return;
    }

    if (!endTime || isNaN(endTime.getTime())) {
      setErrorMessage("Please select a valid end time for your task.");
      return;
    }

    // Check if end time is after start time
    if (endTime <= startTime) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    // Check if due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dueDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorMessage("Due date cannot be in the past.");
      return;
    }

    const dataToSave: CreateTaskData = {
      title: title.trim(),
      description: description.trim() || "", // Description is optional
      due_date: formatDate(dueDate),
      due_time_start: formatTime(startTime),
      due_time_end: formatTime(endTime),
      category: selectedCategory?.value,
      learner: userInfo?.user.id,
      is_recurring: recurrenceOption !== "Does not repeat",
      recurrence_interval:
        recurrenceOption !== "Does not repeat"
          ? recurrenceOption.toLowerCase()
          : null,
      recurrence_end_date:
        recurrenceOption !== "Does not repeat"
          ? formatDate(recurrenceEndDate)
          : null,
    };

    createTaskMutation.mutate({
      taskData: dataToSave,
      token: userToken?.token!,
    });
  };

  const recurrenceOptions = [
    { label: "Does not repeat", value: "Does not repeat" },
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
  ];
  const simplifiedRecurrenceOptions = recurrenceOptions.map(
    (option) => option.value
  );

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  // Check if form is valid for visual feedback
  const isFormValid = useCallback(() => {
    return !!(
      title.trim() &&
      selectedCategory &&
      dueDate &&
      !isNaN(dueDate.getTime()) &&
      startTime &&
      !isNaN(startTime.getTime()) &&
      endTime &&
      !isNaN(endTime.getTime()) &&
      endTime > startTime
    );
  }, [title, selectedCategory, dueDate, startTime, endTime]);

  // Check individual field validity for visual feedback
  const getFieldError = useCallback(
    (field: string) => {
      switch (field) {
        case "title":
          return !title.trim() ? "Title is required" : null;
        case "category":
          return !selectedCategory ? "Category is required" : null;
        case "dueDate":
          return !dueDate || isNaN(dueDate.getTime())
            ? "Due date is required"
            : null;
        case "startTime":
          return !startTime || isNaN(startTime.getTime())
            ? "Start time is required"
            : null;
        case "endTime":
          if (!endTime || isNaN(endTime.getTime()))
            return "End time is required";
          if (startTime && endTime <= startTime)
            return "End time must be after start time";
          return null;
        default:
          return null;
      }
    },
    [title, selectedCategory, dueDate, startTime, endTime]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(16),
      backgroundColor: themeColors.background,
    },
    sectionContainer: {
      backgroundColor: themeColors.cardGlass,
      padding: rV(16),
      borderRadius: rMS(20),
      marginBottom: rV(12),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    sectionHeader: {
      fontSize: rMS(14),
      fontWeight: "800",
      marginBottom: rV(10),
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(10),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + "20",
    },
    timeText: {
      fontSize: rMS(14),
      color: themeColors.text,
      fontWeight: "600",
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(16),
    },
    button: {
      width: "100%",
      paddingVertical: rV(14),
      borderRadius: rMS(24),
      backgroundColor: themeColors.tint,
      alignItems: "center",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionContainer}>
          <AnimatedRoundTextInput
            placeholderTextColor={themeColors.textSecondary}
            label="Title *"
            value={title}
            onChangeText={setTitle}
          />
          <AnimatedRoundTextInput
            placeholderTextColor={themeColors.textSecondary}
            label="Description"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.sectionContainer}>
          <DateSelector
            onDateChange={(selectedDate: string) => {
              const newDate = new Date(selectedDate);
              if (!isNaN(newDate.getTime())) {
                setDueDate(newDate);
              }
            }}
            label="Start Date *"
            minDate={true}
          />
          <CustomDateTimeSelector
            mode="time"
            label="Start Time *"
            value={formatTime(startTime)}
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) {
                setStartTime(newTime);
              } else {
              }
            }}
            buttonTitle="Pick Start Time"
          />
          <CustomDateTimeSelector
            mode="time"
            label="End Time *"
            value={formatTime(endTime)}
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) {
                setEndTime(newTime);
              } else {
              }
            }}
            buttonTitle="Pick End Time"
          />
        </View>

        <View style={styles.sectionContainer}>
          <CustomPicker
            label="Category *"
            options={categoriesData?.map((cat) => cat.label) || []}
            selectedValue={selectedCategory?.label || undefined}
            onValueChange={(value) =>
              setSelectedCategory(
                categoriesData?.find((cat) => cat.label === value) || null
              )
            }
          />
          <CustomPicker
            label="Recurrence"
            options={simplifiedRecurrenceOptions}
            selectedValue={recurrenceOption}
            onValueChange={setRecurrenceOption}
          />
          {recurrenceOption !== "Does not repeat" && (
            <Animated.View
              entering={FadeInLeft.delay(200)
                .randomDelay()
                .reduceMotion(ReduceMotion.Never)}
              style={{ marginTop: rV(10) }}
            >
              <DateSelector
                onDateChange={(selectedDate: string) => {
                  const newDate = new Date(selectedDate);
                  if (!isNaN(newDate.getTime())) {
                    setRecurrenceEndDate(newDate);
                  }
                }}
                label="End Date for Recurrence"
                minDate={true}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!isFormValid() && (
            <Text
              style={[
                {
                  fontSize: SIZES.small,
                  textAlign: "center",
                  marginBottom: rV(10),
                  fontStyle: "italic",
                },
                { color: themeColors.textSecondary },
              ]}
            >
              Please fill in all required fields marked with *
            </Text>
          )}
          <GameButton
            onPress={handleSaveTime}
            title={isFormValid() ? "Save" : "Fill Required Fields"}
            style={[styles.button, !isFormValid() ? { opacity: 0.6 } : {}]}
            disabled={createTaskMutation.isPending || !isFormValid()}
          >
            {createTaskMutation.isPending && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </GameButton>
        </View>
      </ScrollView>
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          visible={!!errorMessage}
          onDismiss={handleDismissError}
        />
      )}
    </View>
  );
};

export default CreateNewTime;
