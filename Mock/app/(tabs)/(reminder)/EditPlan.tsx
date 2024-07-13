import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import GameButton from "../../../components/GameButton";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { deleteTask, updateTask } from "../../../TimelineApiCalls";
import ErrorMessage from "../../../components/ErrorMessage"; // Import ErrorMessage component

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
  const [time, setTime] = useState(parseTimeString(oldTime));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error message state

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

  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  const showTimePickerHandler = () => {
    setShowTimePicker(true);
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const onTimeChange = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
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
    },
    top: {
      padding: rMS(20),
      flex: 1,
    },
    inputContainer: {
      marginTop: rV(5),
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: rMS(10),
      paddingHorizontal: rS(10),
      marginBottom: rV(15),
      borderColor: "transparent",
      backgroundColor: themeColors.card,
      flex: 1,
    },
    icon: {
      marginRight: rS(10),
      color: themeColors.textSecondary,
    },
    input: {
      flex: 1,
      height: rV(40),
      color: themeColors.text,
      borderColor: "transparent",
    },
    label: {
      fontSize: SIZES.medium,
      marginBottom: rV(5),
      color: themeColors.text,
    },
    descriptionInput: {
      width: "100%",
      height: rV(95),
    },
    bottom: {
      padding: rMS(20),
      flex: 1,
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
      marginHorizontal: rS(30),
      flex: 1,
      color: themeColors.text,
    },
    picker: {
      flex: 0.7,
      color: themeColors.textSecondary,
      marginLeft: rS(35),
    },
    buttonContainer: {
      paddingHorizontal: rS(20),
      paddingBottom: rV(20),
    },
    button: {
      width: rS(60),
      marginHorizontal: 5,
      borderRadius: 20,
      backgroundColor: "#DAB499",
      alignSelf: "flex-end",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <GameButton
            onPress={handleSaveTime}
            title={"Save"}
            style={styles.button}
            disabled={updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </GameButton>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { fontSize: SIZES.xxLarge, height: rV(60) },
              ]}
              placeholder="Edit Title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>
        </View>
        <View style={styles.planItemLine} />
        <View style={styles.bottom}>
          <TouchableOpacity onPress={showDatePickerHandler}>
            <View style={styles.schedule}>
              <Ionicons
                name="calendar-outline"
                size={SIZES.xLarge}
                color={themeColors.icon}
              />
              <View style={styles.dateTime}>
                <Text style={{ color: themeColors.text }}>
                  {formatDateString(date)}
                </Text>
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="date"
                    is24Hour={true}
                    onChange={onDateChange}
                    textColor={themeColors.text}
                    accentColor={themeColors.icon}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={showTimePickerHandler}>
            <View style={styles.schedule}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={SIZES.xLarge}
                color={themeColors.icon}
              />
              <View style={styles.dateTime}>
                <Text style={{ color: themeColors.text }}>
                  {formatTime(time)}
                </Text>
                {showTimePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={time}
                    mode="time"
                    is24Hour={true}
                    onChange={onTimeChange}
                    textColor={themeColors.text}
                    accentColor={themeColors.icon}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.label}>Edit Description</Text>
            <View style={[styles.inputContainer, styles.descriptionInput]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Edit Description"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <GameButton
            onPress={handleDeletePlan}
            title={"Delete"}
            style={[styles.button, { backgroundColor: "#D22B2B" }]}
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
