import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
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
  createTimetable,
  createPeriod,
  getPeriod,
} from "../../../TimelineApiCalls.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";
import CustomPicker from "../../../components/CustomPicker"; // Custom picker component
import DateSelector from "../../../components/DateSelector.tsx";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector.tsx";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import TimetableCreator from "../../../components/TimeTableCreator.tsx";
import AnimatedTextInput from "../../../components/AnimatedTextInput.tsx";

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
}
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
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timetableCourses, setTimetableCourses] = useState<Course[]>([]); // Add this state for timetable courses

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const { status: categoriesStatus, data: categoriesData } = useQuery({
    queryKey: ["taskCategories", userToken?.token],
    queryFn: () => getCategories(userToken?.token),
    enabled: !!userToken?.token,
  });

  const createTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskData, token }) => {
      await createTask(taskData, token);
    },
    onSuccess: (taskData) => {
      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating schedule");
    },
  });

  const formatDateString = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short", // Must match allowed literal values
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const handleConfirmTime = (selectedTime) => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number); // Split string and convert to numbers
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  const handleConfirmEndTime = (selectedTime) => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number); // Split string and convert to numbers
      const newEndDate = new Date(endDate);
      newEndDate.setHours(hours);
      newEndDate.setMinutes(minutes);
      setEndDate(newEndDate);
    }
  };

  const handleSaveTime = () => {
    const data: CreateTaskData = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time_start: date.toTimeString().split(" ")[0].slice(0, 5),
      due_time_end: endDate.toTimeString().split(" ")[0].slice(0, 5),
      category: selectedCategory?.value,
      learner: userInfo?.user.id,
      is_recurring: recurrenceOption !== "Does not repeat",
      recurrence_interval:
        recurrenceOption !== "Does not repeat"
          ? recurrenceOption.toLowerCase()
          : null,
      recurrence_end_date:
        recurrenceOption !== "Does not repeat"
          ? recurrenceEndDate.toISOString().split("T")[0]
          : null,
    };

    createTaskMutation.mutate({
      taskData: data,
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(50),
    },
    tabContainer: {
      flexDirection: "row",
      fontSize: SIZES.small,
      fontWeight: "bold",
      backgroundColor: themeColors.reverseText,
      borderRadius: rMS(10),
      justifyContent: "center",
      paddingVertical: rV(1),
    },
    tab: {
      paddingHorizontal: rS(20),
      paddingVertical: rV(15),
      width: "50%",
    },
    activeTab: {
      backgroundColor: themeColors.normalGrey,
      borderRadius: rMS(10),
      color: themeColors.background,
      width: "50%",
    },
    tabText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    topSection: {
      flex: 1,
      backgroundColor: themeColors.tint,
      paddingHorizontal: rMS(20),
      paddingTop: rMS(20),
      paddingBottom: rV(50),
    },
    bottomSection: {
      flex: 2,
      borderRadius: 30,
    },
    inputContainer: {
      marginTop: rV(25),
      flex: 1,
      marginBottom: rV(1),
    },
    input: {
      flex: 1,
      height: rV(15),
      color: themeColors.textSecondary,
      overflow: "hidden",
      borderColor: "transparent",
    },
    categoryName: {
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
      color: themeColors.selectedText,
      textAlign: "center",
      textDecorationLine: "underline",
    },
    label: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: SIZES.large,

      paddingRight: rS(10),
      color: themeColors.textSecondary,
    },
    planItemLine: {
      height: rV(0.3),
      backgroundColor: "#ccc",
    },
    schedule: {
      flexDirection: "row",
      marginVertical: rV(15),
      alignItems: "center",
    },
    dateTime: {
      marginHorizontal: rS(3),
      paddingVertical: rMS(10),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      borderBottomWidth: rMS(1),
      borderColor: themeColors.reverseGrey,
    },
    dateTimeNoBorder: {
      // Style for when there's no recurrence
      marginHorizontal: rS(3),
      paddingVertical: rMS(10),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    dateTimeLast: {
      marginHorizontal: rS(3),
      paddingVertical: rMS(10),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    dateTimeLabel: {
      flex: 1,
    },
    dateTimeText: {
      textAlign: "right",
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    section: {
      marginVertical: rV(5),
      paddingVertical: rV(7),
      paddingLeft: rS(10),
      backgroundColor: themeColors.reverseText,
      borderRadius: rMS(10),
    },
    button: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 10,
      backgroundColor: themeColors.tint,
      alignItems: "center",
    },
    buttonText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    dropdownContainer: {
      marginVertical: rV(15),
      zIndex: 20, // Ensure dropdown is above other elements
    },
    dropdownTouchable: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderColor: "#ccc",
      borderRadius: 5,
      backgroundColor: themeColors.text,
    },
    dropdownText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
    },
    categoryContainer: {
      marginVertical: rV(15),
      zIndex: 10, // Ensure dropdown is above other elements
    },
    taskItem: {
      padding: rS(15),
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    taskTitle: {
      fontSize: SIZES.large,
      color: themeColors.text,
    },
    taskDetails: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <>
          <View style={styles.inputContainer}>
            <AnimatedTextInput
              placeholderTextColor={themeColors.textSecondary}
              label="Title"
              value={title}
              onChangeText={setTitle}
            />
            <AnimatedTextInput
              placeholderTextColor={themeColors.textSecondary}
              label="Description"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <View style={styles.section}>
            <DateSelector
              onDateChange={(selectedDate: string) =>
                setDate(new Date(selectedDate))
              }
              label="Start Date"
              minDate={true}
            />
            <CustomDateTimeSelector
              mode="time"
              label="Choose Start Time"
              onTimeChange={(time) => {
                handleConfirmTime(time);
              }}
              buttonTitle="Pick Time"
            />
            <CustomDateTimeSelector
              mode="time"
              label="Choose End Time"
              onTimeChange={(time) => {
                handleConfirmEndTime(time);
              }}
              buttonTitle="Pick Time"
            />
          </View>
          <View style={styles.section}>
            <CustomPicker
              label="Category"
              options={categoriesData?.map((cat) => cat.label) || []} // Array of strings
              selectedValue={selectedCategory?.label || undefined} // Use label as string or undefined
              onValueChange={(value) =>
                setSelectedCategory(
                  categoriesData?.find((cat) => cat.label === value) || null
                )
              }
            />
            <CustomPicker
              label="Recurrence"
              options={simplifiedRecurrenceOptions} // Simplify to strings
              selectedValue={recurrenceOption}
              onValueChange={setRecurrenceOption}
            />
            {recurrenceOption !== "Does not repeat" && (
              <Animated.View
                entering={FadeInLeft.delay(200)
                  .randomDelay()
                  .reduceMotion(ReduceMotion.Never)}
                style={{ flexDirection: "row", alignItems: "center" }}
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
        </>
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
