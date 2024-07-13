// src/components/CreateNewTime.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme.js";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput.tsx";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { createTask, getCategories } from "../../../TimelineApiCalls.ts";
import { dataTagSymbol, useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../QueryClient.ts";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";

const CreateNewTime = () => {
  const params = useLocalSearchParams();
  const category_name = Array.isArray(params.name)
    ? params.name[0]
    : params.name || "Unknown Category";
  const category_id = Array.isArray(params.category_id)
    ? params.category_id[0]
    : params.category_id || "Unknown ID";
  const { userToken, userInfo } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [
    isRecurrenceEndDatePickerVisible,
    setRecurrenceEndDatePickerVisibility,
  ] = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [recurrenceItems, setRecurrenceItems] = useState([
    { label: "Does not repeat", value: "Does not repeat" },
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
  ]);
  const [categories, setCategories] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "DARK" : "LIGHT";

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate) => {
    hideDatePicker();
    if (selectedDate) setDate(selectedDate);
  };

  const handleConfirmTime = (selectedTime) => {
    hideTimePicker();
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const showRecurrenceEndDatePicker = () => {
    setRecurrenceEndDatePickerVisibility(true);
  };

  const hideRecurrenceEndDatePicker = () => {
    setRecurrenceEndDatePickerVisibility(false);
  };

  const handleConfirmRecurrenceEndDate = (selectedDate) => {
    hideRecurrenceEndDatePicker();
    if (selectedDate) setRecurrenceEndDate(selectedDate);
  };

  const {
    status: categoriesStatus,
    data: categoriesData,
    error: categoriesError,
  } = useQuery({
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
      router.setParams({ newPlan: taskData });
      setErrorMessage(null); // Clear error message on successful unenrollment
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating schedule");
    },
  });

  const handleSaveTime = () => {
    const data = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time: date.toTimeString().split(" ")[0].slice(0, 5), // Only hours and minutes
      category: selectedCategory,
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
      token: userToken?.token,
    });
  };

  const formatDateString = (date) => {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
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
      marginTop: rV(20),
      flex: 1,
      marginBottom: rV(15),
    },
    input: {
      flex: 1,
      height: rV(20),
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
      marginBottom: rV(5),
      color: themeColors.textSecondary,
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      marginTop: rV(5),
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
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
      marginTop: rV(25),
      marginBottom: rS(20),
      flexDirection: "row",
      justifyContent: "space-between",
      flex: 1,
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    button: {
      width: rS(150),
      paddingVertical: rV(10),
      borderRadius: 20,
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
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <AnimatedRoundTextInput
            placeholderTextColor={themeColors.textSecondary}
            style={styles.input}
            label="Title"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <AnimatedRoundTextInput
          placeholderTextColor={themeColors.textSecondary}
          style={styles.input}
          label="Description"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity style={styles.dateTime} onPress={showDatePicker}>
          <MaterialCommunityIcons
            name="calendar"
            size={30}
            color={themeColors.tint}
          />
          <Text style={styles.title}>{formatDateString(date)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          date={date}
          minimumDate={new Date()}
        />

        <Text style={styles.label}>Select Time</Text>
        <TouchableOpacity style={styles.dateTime} onPress={showTimePicker}>
          <MaterialCommunityIcons
            name="clock"
            size={30}
            color={themeColors.border}
          />
          <Text style={styles.title}>{date.toTimeString().slice(0, 5)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          date={date}
        />

        <Text style={styles.label}>Category</Text>
        <DropDownPicker
          open={categoriesOpen}
          value={selectedCategory}
          items={categoriesData || []}
          setOpen={setCategoriesOpen}
          setValue={setSelectedCategory}
          // setItems={setCategories||[]}
          placeholder="Select a category"
          containerStyle={styles.categoryContainer}
          textStyle={styles.dropdownText}
          dropDownDirection="TOP"
          theme={colorMode}
        />

        <Text style={styles.label}>Recurrence</Text>
        <DropDownPicker
          open={recurrenceOpen}
          value={recurrenceOption}
          items={recurrenceItems}
          setOpen={setRecurrenceOpen}
          setValue={setRecurrenceOption}
          setItems={setRecurrenceItems}
          placeholder="Does not repeat"
          containerStyle={styles.dropdownContainer}
          textStyle={styles.dropdownText}
          theme={colorMode}
        />

        {recurrenceOption !== "Does not repeat" && (
          <>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateTime}
              onPress={showRecurrenceEndDatePicker}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={30}
                color={themeColors.textSecondary}
              />
              <Text style={styles.title}>
                {formatDateString(recurrenceEndDate)}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isRecurrenceEndDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmRecurrenceEndDate}
              onCancel={hideRecurrenceEndDatePicker}
              date={recurrenceEndDate}
              minimumDate={new Date()}
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          <GameButton
            onPress={handleSaveTime}
            title={"Save"}
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
