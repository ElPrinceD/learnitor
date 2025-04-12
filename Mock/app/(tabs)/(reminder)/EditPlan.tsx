// EditPlan.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput.tsx";
import { deleteTask, updateTask, getCategories } from "../../../TimelineApiCalls.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";
import CustomPicker from "../../../components/CustomPicker";
import DateSelector from "../../../components/DateSelector.tsx";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector.tsx";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import { useWebSocket } from "../../../webSocketProvider";

interface Category {
  value: number;
  label: string;
}

interface UpdateTaskData {
  title: string;
  description: string;
  due_date: string;
  due_time_start: string; // Updated to match CreateNewTime
  due_time_end: string;   // Added for end time
  category?: number | null;
  affect_all_recurring?: boolean;
}

const EditPlan = () => {
  const params = useLocalSearchParams();
  const id = params.taskId as string;
  const oldDescription = params.description as string;
  const oldTitle = params.title as string;
  const oldDate = params.dueDate as string;       // e.g., "2025-04-10"
  const oldStartTime = params.dueTimeStart as string; // e.g., "09:00"
  const oldEndTime = params.dueTimeEnd as string;   // e.g., "10:00"
  const { userToken, userInfo } = useAuth();
  const { sqliteRemoveItem } = useWebSocket();

  // Initialize dueDate
  const [dueDate, setDueDate] = useState(new Date(oldDate));

  // Initialize startTime with actual date and time
  const initialStartTime = new Date(oldDate);
  const [startHours, startMinutes] = oldStartTime ? oldStartTime.split(":").map(Number) : [0, 0];
  initialStartTime.setHours(startHours, startMinutes, 0, 0);
  const [startTime, setStartTime] = useState(initialStartTime);

  // Initialize endTime with actual date and time
  const initialEndTime = new Date(oldDate);
  const [endHours, endMinutes] = oldEndTime ? oldEndTime.split(":").map(Number) : [0, 0];
  initialEndTime.setHours(endHours, endMinutes, 0, 0);
  const [endTime, setEndTime] = useState(initialEndTime);

  const [title, setTitle] = useState(oldTitle || "");
  const [description, setDescription] = useState(oldDescription || "");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [affectAllRecurring, setAffectAllRecurring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { status: categoriesStatus, data: categoriesData } = useQuery({
    queryKey: ["taskCategories", userToken?.token],
    queryFn: () => getCategories(userToken?.token),
    enabled: !!userToken?.token,
  });

  // Sync start and end times' date with dueDate changes
  useEffect(() => {
    const updateTimesWithNewDate = () => {
      const newStartTime = new Date(dueDate);
      newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      setStartTime(newStartTime);

      const newEndTime = new Date(dueDate);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      setEndTime(newEndTime);
    };
    updateTimesWithNewDate();
  }, [dueDate]);

  const updateTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, taskData, token }) => {
      await updateTask(taskId, taskData, token);
    },
    onSuccess: () => {
      const oldDateString = new Date(oldDate).toISOString().split("T")[0];
      const newDateString = formatDate(dueDate);
      const oldCategoryId = params.category_id as string;
      const newCategoryId = selectedCategory?.value?.toString() || oldCategoryId;

      sqliteRemoveItem(`todayPlans_${oldDateString}_all`);
      if (oldCategoryId) {
        sqliteRemoveItem(`todayPlans_${oldDateString}_${oldCategoryId}`);
      }
      if (oldDateString !== newDateString) {
        sqliteRemoveItem(`todayPlans_${newDateString}_all`);
        if (newCategoryId) {
          sqliteRemoveItem(`todayPlans_${newDateString}_${newCategoryId}`);
        }
      } else if (oldCategoryId !== newCategoryId) {
        if (newCategoryId) {
          sqliteRemoveItem(`todayPlans_${newDateString}_${newCategoryId}`);
        }
      }

      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error updating schedule");
    },
  });

  const deleteTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, token }) => {
      await deleteTask(taskId, token);
    },
    onSuccess: () => {
      const dateString = new Date(oldDate).toISOString().split("T")[0];
      const categoryId = params.category_id as string;

      sqliteRemoveItem(`todayPlans_${dateString}_all`);
      if (categoryId) {
        sqliteRemoveItem(`todayPlans_${dateString}_${categoryId}`);
      }

      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error deleting schedule");
    },
  });

  const parseTime = (timeString: string): Date => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`Invalid time string: ${timeString}`);
      return new Date();
    }
    const newDate = new Date(dueDate);
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
    if (!(date instanceof Date) || isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  const handleSaveTime = () => {
    const dataToSave: UpdateTaskData = {
      title,
      description,
      due_date: formatDate(dueDate),
      due_time_start: formatTime(startTime),
      due_time_end: formatTime(endTime),
      category: selectedCategory?.value || parseInt(params.category_id as string),
      affect_all_recurring: affectAllRecurring,
    };
    console.log(dataToSave);

    updateTaskMutation.mutate({
      taskId: id,
      taskData: dataToSave,
      token: userToken?.token!,
    });
  };

  const handleDeletePlan = () => {
    deleteTaskMutation.mutate({
      taskId: id,
      token: userToken?.token!,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(50),
      backgroundColor: themeColors.background,
    },
    sectionContainer: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
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
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
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
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionContainer}>
          <AnimatedRoundTextInput
            placeholderTextColor={themeColors.textSecondary}
            label="Title"
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
              } else {
                console.error(`Invalid due date: ${selectedDate}`);
              }
            }}
            label="Due Date"
            minDate={true}
          />
          <CustomDateTimeSelector
            mode="time"
            label="Start Time"
            value={formatTime(startTime)}
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) {
                setStartTime(newTime);
              } else {
                console.error(`Invalid start time: ${time}`);
              }
            }}
            buttonTitle="Pick Start Time"
          />
          <CustomDateTimeSelector
            mode="time"
            label="End Time"
            value={formatTime(endTime)}
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) {
                setEndTime(newTime);
              } else {
                console.error(`Invalid end time: ${time}`);
              }
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
              setSelectedCategory(categoriesData?.find((cat) => cat.label === value) || null)
            }
          />
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Affect All Recurring Tasks</Text>
            <Switch
              value={affectAllRecurring}
              onValueChange={setAffectAllRecurring}
              trackColor={{ false: "#767577", true: themeColors.tint }}
              thumbColor={affectAllRecurring ? themeColors.background : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={[styles.buttonContainer, { flexDirection: "row", justifyContent: "space-between" }]}>
          <GameButton
            onPress={handleSaveTime}
            title="Save"
            style={styles.button}
            disabled={updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </GameButton>
          <GameButton
            onPress={handleDeletePlan}
            title="Delete"
            style={styles.deleteButton}
            disabled={deleteTaskMutation.isPending}
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