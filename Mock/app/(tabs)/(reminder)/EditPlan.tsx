import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import GameButton from "../../../components/GameButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { deleteTask, updateTask } from "../../../TimelineApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";

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
  const [date, setDate] = useState(new Date(oldDate));
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [time, setTime] = useState(parseTimeString(oldTime));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [affectAllRecurring, setAffectAllRecurring] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  function parseTimeString(timeString: string) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const now = new Date();
    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);
    return now;
  }

  const formatTime = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const updateTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, taskData, token }) => {
      await updateTask(taskId, taskData, token);
    },
    onSuccess: () => {
      router.navigate("three");
      setErrorMessage(null); // Clear error message on successful update
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error updating schedule");
    },
  });

  const handleSaveTime = () => {
    const formattedDueDate = date.toISOString().split("T")[0];
    const formattedDueTime = formatTime(time);
    const data = {
      title,
      description,
      due_date: formattedDueDate,
      due_time: formattedDueTime,
      category: params.category_id,
      learner: userInfo?.user.id,
      affect_all_recurring: affectAllRecurring,
    };


    updateTaskMutation.mutate({
      taskId: id,
      taskData: data,
      token: userToken?.token,
    });

    
  };

  const deleteTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskId, token }) => {
      await deleteTask(taskId, token);
    },
    onSuccess: () => {
      router.navigate("three");
      setErrorMessage(null); // Clear error message on successful delete
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error deleting schedule");
    },
  });

  const handleDeletePlan = () => {
    deleteTaskMutation.mutate({
      taskId: id,
      token: userToken?.token,
    });
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate) => {
    hideDatePicker();
    if (selectedDate) setDate(selectedDate);
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime) => {
    hideTimePicker();
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTime(newDate);
    }
  };

  const formatDateString = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
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
    label: {
      fontSize: SIZES.large,
      marginBottom: rV(5),
      color: themeColors.textSecondary,
    },
    title: {
      marginTop: rV(5),
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
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
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: rV(20),
    },
    button: {
      flex: 1,
      paddingVertical: rV(15),
      borderRadius: 20,
      backgroundColor: themeColors.tint,
      alignItems: "center",
      marginHorizontal: rS(10),
    },
    buttonText: {
      color: themeColors.text,
      fontSize: SIZES.large,
      fontWeight: "bold",
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(10),
      justifyContent: "space-between", // Ensure label is left and toggle is right
    },
    toggleLabel: {
      fontSize: SIZES.large,
      color: themeColors.text,
      marginLeft: rS(10), // Adjust left margin if needed
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
          <Text style={styles.title}>{formatTime(time)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          date={time}
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSaveTime}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleDeletePlan}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {(updateTaskMutation.isLoading || deleteTaskMutation.isLoading) && (
          <ActivityIndicator size="large" color={themeColors.tint} />
        )}
        {errorMessage && <ErrorMessage errorMessage={errorMessage} />}
      </ScrollView>
    </View>
  );
};

export default EditPlan;
