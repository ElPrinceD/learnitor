// CreateNewTime.tsx
import React, { useState, useEffect } from "react";
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
import { createTask, getCategories } from "../../../TimelineApiCalls.ts";
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
  const { sqliteRemoveItem } = useWebSocket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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
    onSuccess: (createdTask) => {
      console.log('Task created successfully:', createdTask);
      const dateString = formatDate(dueDate);
      const categoryId = selectedCategory?.value?.toString();

      // Invalidate caches
      sqliteRemoveItem(`todayPlans_${dateString}_all`);
      if (categoryId) {
        sqliteRemoveItem(`todayPlans_${dateString}_${categoryId}`);
      }

      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating schedule");
    },
  });

  const parseTime = (timeString: string): Date => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`Invalid time string: ${timeString}, Hours: ${hours}, Minutes: ${minutes}`);
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
    if (!(date instanceof Date) || isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  const handleSaveTime = () => {
    const dataToSave: CreateTaskData = {
      title,
      description,
      due_date: formatDate(dueDate),
      due_time_start: formatTime(startTime),
      due_time_end: formatTime(endTime),
      category: selectedCategory?.value,
      learner: userInfo?.user.id,
      is_recurring: recurrenceOption !== "Does not repeat",
      recurrence_interval: recurrenceOption !== "Does not repeat" ? recurrenceOption.toLowerCase() : null,
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
  const simplifiedRecurrenceOptions = recurrenceOptions.map((option) => option.value);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(20),
      backgroundColor: themeColors.background,
    },
    sectionContainer: {
      backgroundColor: themeColors.secondaryBackground,
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
    },
    sectionHeader: {
      fontSize: rMS(16),
      fontWeight: "bold",
      marginBottom: rV(10),
      color: themeColors.text,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(10),
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    timeText: {
      fontSize: rMS(16),
      color: themeColors.text,
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    button: {
      width: "100%",
      paddingVertical: rV(10),
      borderRadius: 10,
      backgroundColor: themeColors.tint,
      alignItems: "center",
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
            label="Start Date"
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
          <CustomPicker
            label="Recurrence"
            options={simplifiedRecurrenceOptions}
            selectedValue={recurrenceOption}
            onValueChange={setRecurrenceOption}
          />
          {recurrenceOption !== "Does not repeat" && (
            <Animated.View
              entering={FadeInLeft.delay(200).randomDelay().reduceMotion(ReduceMotion.Never)}
              style={{ marginTop: rV(10) }}
            >
              <DateSelector
                onDateChange={(selectedDate: string) => {
                  const newDate = new Date(selectedDate);
                  if (!isNaN(newDate.getTime())) {
                    setRecurrenceEndDate(newDate);
                  } else {
                    console.error(`Invalid recurrence end date: ${selectedDate}`);
                  }
                }}
                label="End Date for Recurrence"
                minDate={true}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <GameButton
            onPress={handleSaveTime}
            title="Save"
            style={styles.button}
            disabled={createTaskMutation.isPending}
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
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </View>
  );
};

export default CreateNewTime;