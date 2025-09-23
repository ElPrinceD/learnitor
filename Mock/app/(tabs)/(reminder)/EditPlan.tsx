import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
  useColorScheme,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput.tsx";
import {
  deleteTask,
  updateTask,
  getCategories,
} from "../../../services/TimelineApiCalls.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";
import CustomPicker from "../../../components/CustomPicker";
import DateSelector from "../../../components/DateSelector.tsx";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector.tsx";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutRight,
  ReduceMotion,
} from "react-native-reanimated";
import { useTimeline } from "../../../contexts/TimelineContext"; // Added for TimelineContext
import { useCache } from "../../../contexts/CacheContext"; // Added for CacheContext

interface Category {
  value: number;
  label: string;
}
interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  due_time_start?: string;
  due_time_end?: string;
  category?: number | null;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
  affect_all_recurring?: boolean;
  learner?: number;
}

interface DeleteOptions {
  deleteScope: "single" | "future" | "all";
  showConfirmation: boolean;
}

const EditPlan = () => {
  const params = useLocalSearchParams();
  console.log("EditPlan params:", params);
  const id = params.taskId as string;
  const oldTitle = params.title as string;
  const oldDescription = params.description as string;
  const oldDate = params.duedate as string;
  const oldStartTime = params.due_time_start as string;
  const oldEndTime = params.due_time_end as string;
  const oldCategoryId = params.category_id as string;
  const oldIsRecurring = params.is_recurring === "true";
  const oldRecurrenceInterval = (params.recurrence_interval as string) || null;
  const oldRecurrenceEndDate = (params.recurrence_end_date as string) || null;

  console.log("Task details:", {
    id,
    oldTitle,
    oldDescription,
    oldDate,
    oldStartTime,
    oldEndTime,
    oldCategoryId,
    oldIsRecurring,
    oldRecurrenceInterval,
    oldRecurrenceEndDate,
  });

  const { userToken, userInfo } = useAuth();
  const {
    scheduleTaskNotification,
    cancelTaskNotification,
    storeNotificationId,
  } = useTimeline(); // Use TimelineContext
  const { removeItem } = useCache(); // Use CacheContext for cache invalidation

  // Initialize dueDate with the plan's oldDate
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date(oldDate);
    return isNaN(date.getTime()) ? new Date() : date; // Fallback to today only if oldDate is invalid
  });

  // Initialize startTime with oldStartTime or default to 12:00
  const [startTime, setStartTime] = useState(() => {
    if (oldStartTime) {
      const [hours, minutes] = oldStartTime.split(":").map(Number);
      if (
        !isNaN(hours) &&
        !isNaN(minutes) &&
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        const date = new Date(dueDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }
    const date = new Date(dueDate);
    date.setHours(12, 0, 0, 0); // Default to 12:00
    return date;
  });

  // Initialize endTime with oldEndTime or default to 13:00
  const [endTime, setEndTime] = useState(() => {
    if (oldEndTime) {
      const [hours, minutes] = oldEndTime.split(":").map(Number);
      if (
        !isNaN(hours) &&
        !isNaN(minutes) &&
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        const date = new Date(dueDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }
    const date = new Date(dueDate);
    date.setHours(13, 0, 0, 0); // Default to 13:00
    return date;
  });

  const [title, setTitle] = useState(oldTitle || "");
  const [description, setDescription] = useState(oldDescription || "");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isRecurring, setIsRecurring] = useState(oldIsRecurring);
  const [recurrenceOption, setRecurrenceOption] = useState(
    oldRecurrenceInterval
      ? oldRecurrenceInterval.charAt(0).toUpperCase() +
          oldRecurrenceInterval.slice(1)
      : "Does not repeat"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(() => {
    const date = oldRecurrenceEndDate
      ? new Date(oldRecurrenceEndDate)
      : new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  });
  const [affectAllRecurring, setAffectAllRecurring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState<DeleteOptions>({
    deleteScope: "single",
    showConfirmation: true,
  });

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { data: categoriesData } = useQuery({
    queryKey: ["taskCategories", userToken?.token],
    queryFn: () => getCategories(userToken?.token),
    enabled: !!userToken?.token,
  });

  useEffect(() => {
    if (categoriesData && oldCategoryId) {
      const category = categoriesData.find(
        (cat) => cat.value.toString() === oldCategoryId
      );
      if (category) setSelectedCategory(category);
    }
  }, [categoriesData, oldCategoryId]);

  useEffect(() => {
    // Update startTime and endTime when dueDate changes to keep hours/minutes
    const newStartTime = new Date(dueDate);
    newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    setStartTime(newStartTime);
    const newEndTime = new Date(dueDate);
    newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    setEndTime(newEndTime);
  }, [dueDate]);

  const updateTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, taskData, token, updateScope }) =>
      updateTask(taskId, taskData, token, updateScope),
    onSuccess: async (updatedTask) => {
      const oldDateString = new Date(oldDate).toISOString().split("T")[0];
      const newDateString = formatDate(dueDate);
      const newCategoryId =
        selectedCategory?.value?.toString() || oldCategoryId;
      await removeItem(`todayPlans_${oldDateString}_all`);
      if (oldCategoryId)
        await removeItem(`todayPlans_${oldDateString}_${oldCategoryId}`);
      if (oldDateString !== newDateString) {
        await removeItem(`todayPlans_${newDateString}_all`);
        if (newCategoryId)
          await removeItem(`todayPlans_${newDateString}_${newCategoryId}`);
      } else if (oldCategoryId !== newCategoryId) {
        if (newCategoryId)
          await removeItem(`todayPlans_${newDateString}_${newCategoryId}`);
      }
      try {
        await cancelTaskNotification(id);
        const notificationId = await scheduleTaskNotification(updatedTask);
        if (notificationId) await storeNotificationId(id, notificationId);
      } catch (error) {
        console.error("Error updating notification:", error);
      }
      router.dismiss(1);
      setErrorMessage(null);
    },
    onError: (error) =>
      setErrorMessage(error.message || "Error updating schedule"),
  });

  const deleteTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, token, deleteScope }) =>
      deleteTask(taskId, token, deleteScope),
    onSuccess: async () => {
      const dateString = new Date(oldDate).toISOString().split("T")[0];
      const categoryId = params.category_id as string;
      await removeItem(`todayPlans_${dateString}_all`);
      if (categoryId)
        await removeItem(`todayPlans_${dateString}_${categoryId}`);
      try {
        await cancelTaskNotification(id);
      } catch (error) {
        console.error("Error canceling notification:", error);
      }
      router.dismiss(1);
      setErrorMessage(null);
    },
    onError: (error) =>
      setErrorMessage(error.message || "Error deleting schedule"),
  });

  const parseTime = (timeString: string): Date => {
    if (!timeString) {
      const defaultDate = new Date(dueDate);
      defaultDate.setHours(12, 0, 0, 0);
      return defaultDate;
    }
    const [hours, minutes] = timeString.split(":").map(Number);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.error(`Invalid time string: ${timeString}`);
      const defaultDate = new Date(dueDate);
      defaultDate.setHours(12, 0, 0, 0);
      return defaultDate;
    }
    const newDate = new Date(dueDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const formatTime = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "12:00";
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime()))
      return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  const handleSaveTime = () => {
    const dataToSave: UpdateTaskData = {
      // Always include required fields
      title: title,
      learner: userInfo?.user?.id,
    };

    // Add changed fields
    if (description !== oldDescription) dataToSave.description = description;
    if (formatDate(dueDate) !== oldDate)
      dataToSave.due_date = formatDate(dueDate);
    if (formatTime(startTime) !== oldStartTime)
      dataToSave.due_time_start = formatTime(startTime);
    if (formatTime(endTime) !== oldEndTime && formatTime(endTime) !== "12:00")
      dataToSave.due_time_end = formatTime(endTime);
    if (
      selectedCategory?.value?.toString() !== oldCategoryId &&
      selectedCategory !== null
    )
      dataToSave.category = selectedCategory?.value || null;
    if (isRecurring !== oldIsRecurring) dataToSave.is_recurring = isRecurring;
    if (
      recurrenceOption !== "Does not repeat" &&
      recurrenceOption.toLowerCase() !== oldRecurrenceInterval
    )
      dataToSave.recurrence_interval = recurrenceOption.toLowerCase();
    if (
      recurrenceOption !== "Does not repeat" &&
      formatDate(recurrenceEndDate) !== oldRecurrenceEndDate
    )
      dataToSave.recurrence_end_date = formatDate(recurrenceEndDate);
    if (affectAllRecurring && isRecurring)
      dataToSave.affect_all_recurring = affectAllRecurring;

    // Check if there are any changes beyond the required fields
    const hasChanges =
      Object.keys(dataToSave).length > 2 ||
      title !== oldTitle ||
      description !== oldDescription ||
      formatDate(dueDate) !== oldDate ||
      formatTime(startTime) !== oldStartTime ||
      formatTime(endTime) !== oldEndTime ||
      selectedCategory?.value?.toString() !== oldCategoryId ||
      isRecurring !== oldIsRecurring ||
      (recurrenceOption !== "Does not repeat" &&
        recurrenceOption.toLowerCase() !== oldRecurrenceInterval) ||
      (recurrenceOption !== "Does not repeat" &&
        formatDate(recurrenceEndDate) !== oldRecurrenceEndDate);

    if (hasChanges) {
      // Determine update scope based on recurring status and user choice
      const updateScope = isRecurring && affectAllRecurring ? "all" : "single";

      updateTaskMutation.mutate({
        taskId: id,
        taskData: dataToSave,
        token: userToken?.token!,
        updateScope: updateScope,
      });
    } else {
      setErrorMessage("No changes to save.");
    }
  };

  const handleDeletePlan = () => {
    if (isRecurring) {
      setShowDeleteOptions(true);
    } else {
      showDeleteConfirmation("single");
    }
  };

  const showDeleteConfirmation = (scope: "single" | "future" | "all") => {
    const messages = {
      single: "Are you sure you want to delete this task?",
      future:
        "Are you sure you want to delete this task and all future occurrences?",
      all: "Are you sure you want to delete this task and all its occurrences?",
    };

    Alert.alert("Delete Task", messages[scope], [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTaskMutation.mutate({
            taskId: id,
            token: userToken?.token!,
            deleteScope: scope,
          });
        },
      },
    ]);
  };

  const handleDeleteOptionSelect = (scope: "single" | "future" | "all") => {
    setShowDeleteOptions(false);
    showDeleteConfirmation(scope);
  };

  const recurrenceOptions = [
    { label: "Does not repeat", value: "Does not repeat" },
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
  ];
  const simplifiedRecurrenceOptions = recurrenceOptions.map(
    (option) => option.value
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(50),
      backgroundColor: themeColors.background,
    },
    headerContainer: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rV(20),
      borderRadius: rMS(12),
      marginBottom: rV(20),
      borderLeftWidth: 4,
      borderLeftColor: themeColors.tint,
    },
    headerTitle: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(8),
    },
    headerSubtitle: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      marginBottom: rV(4),
    },
    sectionContainer: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
    },
    sectionTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(10),
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(10),
      justifyContent: "space-between",
      paddingHorizontal: rS(16),
    },
    toggleLabel: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
    },
    deleteOptionsContainer: {
      backgroundColor: themeColors.errorBackground,
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
    },
    deleteOptionsTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(10),
    },
    deleteOptionButton: {
      paddingVertical: rV(12),
      paddingHorizontal: rS(16),
      borderRadius: rMS(6),
      marginBottom: rV(8),
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.text,
    },
    deleteOptionButtonActive: {
      backgroundColor: themeColors.tint,
      borderColor: themeColors.tint,
    },
    deleteOptionText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      textAlign: "center",
    },
    deleteOptionTextActive: {
      color: themeColors.background,
      fontWeight: "bold",
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    button: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      backgroundColor: themeColors.tint,
      alignItems: "center",
      marginHorizontal: rS(5),
    },
    deleteButton: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      backgroundColor: themeColors.errorBackground,
      alignItems: "center",
      marginHorizontal: rS(5),
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(8),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.text,
    },
    infoLabel: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      fontWeight: "bold",
      flex: 1,
      textAlign: "right",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Edit Task Form */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Edit Task Details</Text>
          <Animated.View
            key={`title-${title}`}
            entering={FadeInRight}
            exiting={FadeOutRight}
          >
            <AnimatedRoundTextInput
              placeholderTextColor={themeColors.textSecondary}
              label="Title"
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>
          <Animated.View
            key={`description-${description}`}
            entering={FadeInRight}
            exiting={FadeOutRight}
          >
            <AnimatedRoundTextInput
              placeholderTextColor={themeColors.textSecondary}
              label="Description"
              value={description}
              onChangeText={setDescription}
            />
          </Animated.View>
        </View>
        <View style={styles.sectionContainer}>
          <DateSelector
            onDateChange={(selectedDate: string) => {
              const newDate = new Date(selectedDate);
              if (!isNaN(newDate.getTime())) setDueDate(newDate);
              else console.error(`Invalid due date: ${selectedDate}`);
            }}
            label="Due Date"
            initialDate={oldDate} // Use plan's date
            minDate={true}
          />
          <CustomDateTimeSelector
            mode="time"
            label="Start Time"
            value={formatTime(startTime)}
            initialValue={oldStartTime || "12:00"} // Use plan's start time or default
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) setStartTime(newTime);
              else console.error(`Invalid start time: ${time}`);
            }}
            buttonTitle="Pick Start Time"
          />
          <CustomDateTimeSelector
            mode="time"
            label="End Time"
            value={formatTime(endTime)}
            initialValue={oldEndTime || "13:00"} // Use plan's end time or default
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) setEndTime(newTime);
              else console.error(`Invalid end time: ${time}`);
            }}
            buttonTitle="Pick End Time"
          />
        </View>
        <View style={styles.sectionContainer}>
          <CustomPicker
            label="Category"
            options={categoriesData?.map((cat) => cat.label) || []}
            selectedValue={selectedCategory?.label || undefined}
            onValueChange={(value) =>
              setSelectedCategory(
                categoriesData?.find((cat) => cat.label === value) || null
              )
            }
          />
          {/* Temporarily disabled recurring task editing
          <CustomPicker
            label="Recurrence"
            options={simplifiedRecurrenceOptions}
            selectedValue={recurrenceOption}
            onValueChange={(value) => {
              setRecurrenceOption(value);
              setIsRecurring(value !== "Does not repeat");
            }}
          />
          */}
          {/* Temporarily disabled recurring task editing
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
                  if (!isNaN(newDate.getTime())) setRecurrenceEndDate(newDate);
                  else
                    console.error(
                      `Invalid recurrence end date: ${selectedDate}`
                    );
                }}
                label="End Date for Recurrence"
                initialDate={oldRecurrenceEndDate || formatDate(new Date())} // Use plan's recurrence end date
                minDate={true}
              />
            </Animated.View>
          )}
          */}
          {/* Temporarily disabled recurring task editing
          {isRecurring && (
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Affect All Recurring Tasks</Text>
              <Switch
                value={affectAllRecurring}
                onValueChange={setAffectAllRecurring}
                trackColor={{ false: "#767577", true: themeColors.tint }}
                thumbColor={
                  affectAllRecurring ? themeColors.background : "#f4f3f4"
                }
              />
            </View>
          )}
          */}
        </View>

        {/* Delete Options for Recurring Tasks */}
        {showDeleteOptions && isRecurring && (
          <View style={styles.deleteOptionsContainer}>
            <Text style={styles.deleteOptionsTitle}>Delete Options</Text>
            <Text style={[styles.infoLabel, { marginBottom: rV(10) }]}>
              This is a recurring task. Choose what you want to delete:
            </Text>

            <TouchableOpacity
              style={[
                styles.deleteOptionButton,
                deleteOptions.deleteScope === "single" &&
                  styles.deleteOptionButtonActive,
              ]}
              onPress={() =>
                setDeleteOptions({ ...deleteOptions, deleteScope: "single" })
              }
            >
              <Text
                style={[
                  styles.deleteOptionText,
                  deleteOptions.deleteScope === "single" &&
                    styles.deleteOptionTextActive,
                ]}
              >
                Delete this task only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteOptionButton,
                deleteOptions.deleteScope === "future" &&
                  styles.deleteOptionButtonActive,
              ]}
              onPress={() =>
                setDeleteOptions({ ...deleteOptions, deleteScope: "future" })
              }
            >
              <Text
                style={[
                  styles.deleteOptionText,
                  deleteOptions.deleteScope === "future" &&
                    styles.deleteOptionTextActive,
                ]}
              >
                Delete this task and all future occurrences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteOptionButton,
                deleteOptions.deleteScope === "all" &&
                  styles.deleteOptionButtonActive,
              ]}
              onPress={() =>
                setDeleteOptions({ ...deleteOptions, deleteScope: "all" })
              }
            >
              <Text
                style={[
                  styles.deleteOptionText,
                  deleteOptions.deleteScope === "all" &&
                    styles.deleteOptionTextActive,
                ]}
              >
                Delete all occurrences of this task
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: rV(10),
              }}
            >
              <GameButton
                onPress={() => setShowDeleteOptions(false)}
                title="Cancel"
                style={[styles.button, { width: rS(100) }]}
              />
              <GameButton
                onPress={() =>
                  handleDeleteOptionSelect(deleteOptions.deleteScope)
                }
                title="Confirm Delete"
                style={[styles.deleteButton, { width: rS(120) }]}
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending && (
                  <ActivityIndicator size="small" color={themeColors.text} />
                )}
              </GameButton>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <GameButton
            onPress={handleSaveTime}
            title="Save Changes"
            style={styles.button}
            disabled={updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </GameButton>
          <GameButton
            onPress={handleDeletePlan}
            title="Delete Task"
            style={styles.deleteButton}
            disabled={deleteTaskMutation.isPending || showDeleteOptions}
          >
            {deleteTaskMutation.isPending && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </GameButton>
        </View>
      </ScrollView>
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </View>
  );
};

export default EditPlan;
