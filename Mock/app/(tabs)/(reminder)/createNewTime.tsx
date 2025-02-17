import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Platform,
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
import CustomPicker from "../../../components/CustomPicker"; // Custom picker component
import DateSelector from "../../../components/DateSelector.tsx";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector.tsx";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import setSoftInputMode from "react-native-set-soft-input-mode";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // date will hold both the selected date and start time
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State to control the visibility of the time pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { status: categoriesStatus, data: categoriesData } = useQuery({
    queryKey: ["taskCategories", userToken?.token],
    queryFn: () => getCategories(userToken?.token),
    enabled: !!userToken?.token,
  });


  
  useEffect(() => {
    if (Platform.OS === "android" && setSoftInputMode) {
      setSoftInputMode.set(1); // 3 is typically for ADJUST_RESIZE
      return () => {
        setSoftInputMode.set(1); // 1 is typically for ADJUST_PAN
      };
    }
    return () => {};
  }, []);
  const createTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskData, token }) => {
      await createTask(taskData, token);
    },
    onSuccess: () => {
      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating schedule");
    },
  });

  // When a time is selected from the time picker modal, update the corresponding Date state
  const handleConfirmTime = (selectedTime: string) => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  const handleConfirmEndTime = (selectedTime: string) => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const newEndDate = new Date(endDate);
      newEndDate.setHours(hours);
      newEndDate.setMinutes(minutes);
      setEndDate(newEndDate);
    }
  };

  const handleSaveTime = () => {
    const dataToSave: CreateTaskData = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time_start: date.toTimeString().split(" ")[0].slice(0, 5),
      due_time_end: endDate.toTimeString().split(" ")[0].slice(0, 5),
      category: selectedCategory?.value,
      learner: userInfo?.user.id,
      is_recurring: recurrenceOption !== "Does not repeat",
      recurrence_interval: recurrenceOption !== "Does not repeat" ? recurrenceOption.toLowerCase() : null,
      recurrence_end_date:
        recurrenceOption !== "Does not repeat"
          ? recurrenceEndDate.toISOString().split("T")[0]
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
      color: "#333",
    },
    arrow: {
      fontSize: rMS(20),
      color: "#333",
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
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Task Details Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Task Details</Text>
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
          <Text style={styles.sectionHeader}>Time Details</Text>
          <DateSelector
            onDateChange={(selectedDate: string) => setDate(new Date(selectedDate))}
            label="Start Date"
            minDate={true}
          />
          <TouchableOpacity style={styles.timeRow} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.timeText}>
              {`Start Time: ${date.toTimeString().split(" ")[0].slice(0, 5)}`}
            </Text>
            <Text style={styles.arrow}>&gt;</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeRow} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.timeText}>
              {`End Time: ${endDate.toTimeString().split(" ")[0].slice(0, 5)}`}
            </Text>
            <Text style={styles.arrow}>&gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Other Details Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Other Details</Text>
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
                onDateChange={(selectedDate: string) =>
                  setRecurrenceEndDate(new Date(selectedDate))
                }
                label="End Date for Recurrence"
                minDate={true}
              />
            </Animated.View>
          )}
        </View>

        {/* Save Button */}
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
      {showStartPicker && (
        <CustomDateTimeSelector
          mode="time"
          onTimeChange={(time) => {
            handleConfirmTime(time);
            setShowStartPicker(false);
          }}
          onCancel={() => setShowStartPicker(false)}
        />
      )}
      {showEndPicker && (
        <CustomDateTimeSelector
          mode="time"
          onTimeChange={(time) => {
            handleConfirmEndTime(time);
            setShowEndPicker(false);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      )}
    </View>
  );
};

export default CreateNewTime;
