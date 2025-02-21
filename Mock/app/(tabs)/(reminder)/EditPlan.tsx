import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
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
import setSoftInputMode from "react-native-set-soft-input-mode";

interface Category {
  value: number;
  label: string;
}

interface UpdateTaskData {
  title: string;
  description: string;
  due_date: string;
  due_time: string; // Renamed from due_time_start for consistency with params
  category?: number | null;
  affect_all_recurring?: boolean;
}

const EditPlan = () => {
  const params = useLocalSearchParams();
  const id = params.taskId as string;
  const oldDescription = params.description as string;
  const oldTitle = params.title as string;
  const oldDate = params.duedate as string;
  const oldTime = params.duetime as string;
  const { userToken, userInfo } = useAuth();

  const [title, setTitle] = useState(oldTitle || "");
  const [description, setDescription] = useState(oldDescription || "");
  const [dueDate, setDueDate] = useState(new Date(oldDate));
  const [dueTime, setDueTime] = useState(new Date(`2000-01-01T${oldTime}`)); // Parse time string to Date
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

  useEffect(() => {
    if (Platform.OS === "android" && setSoftInputMode) {
      setSoftInputMode.set(1); // ADJUST_PAN
      return () => {
        setSoftInputMode.set(1);
      };
    }
    return () => {};
  }, []);

  const updateTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, taskData, token }) => {
      await updateTask(taskId, taskData, token);
    },
    onSuccess: () => {
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
    const dataToSave: UpdateTaskData = {
      title,
      description,
      due_date: formatDate(dueDate),
      due_time: formatTime(dueTime),
      category: selectedCategory?.value || parseInt(params.category_id as string),
      affect_all_recurring: affectAllRecurring,
    };

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
      backgroundColor: "#f5f5f5",
      padding: rV(15),
      borderRadius: rMS(8),
      marginBottom: rV(15),
    },
    sectionHeader: {
      fontSize: rMS(16),
      fontWeight: "bold",
      marginBottom: rV(10),
      color: "#333",
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
        {/* Task Details Section */}
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

        {/* Time Details Section */}
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
            label="Due Time"
            value={formatTime(dueTime)}
            onTimeChange={(time) => {
              const newTime = parseTime(time);
              if (!isNaN(newTime.getTime())) {
                setDueTime(newTime);
              } else {
                console.error(`Invalid due time: ${time}`);
              }
            }}
            buttonTitle="Pick Due Time"
          />
        </View>

        {/* Other Details Section */}
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

        {/* Save and Delete Buttons */}
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