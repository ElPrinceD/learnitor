import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import GameButton from "../../../components/GameButton";
import { useMutation } from "@tanstack/react-query";
import { deleteTask, updateTask } from "../../../TimelineApiCalls";
import ErrorMessage from "../../../components/ErrorMessage";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";
import DateSelector from "../../../components/DateSelector";
import CustomDateTimeSelector from "../../../components/CustomDateTimeSelector";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";

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
  const [time, setTime] = useState(new Date(`2000-01-01T${oldTime}`)); // Parse time string to Date
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [affectAllRecurring, setAffectAllRecurring] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
    console.log(data);

    updateTaskMutation.mutate({
      taskId: id,
      taskData: data,
      token: userToken?.token,
    });
  };
  const handleDeletePlan = () => {
    deleteTaskMutation.mutate({
      taskId: id,
      token: userToken?.token,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
    },
    section: {
      marginVertical: rV(5),
      paddingVertical: rV(7),
      paddingLeft: rS(10),
      borderRadius: rMS(10),
      backgroundColor: themeColors.background,
    },
    inputContainer: {
      marginTop: rV(25),
      flex: 1,
      marginBottom: rV(1),
    },
    input: {
      flex: 1,
      height: rV(45),
      color: themeColors.textSecondary,
      overflow: "hidden",
      borderColor: "transparent",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: rV(60),
    },
    button: {
      flex: 1,
      borderRadius: 10,
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
      justifyContent: "space-between",
    },
    toggleLabel: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
      marginLeft: rS(10),
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <AnimatedRoundTextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={themeColors.textSecondary}
            style={styles.input}
          />
          <AnimatedRoundTextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { height: rV(130) }]}
          />
        </View>
        <View style={styles.section}>
          <DateSelector
            onDateChange={(selectedDate: string) =>
              setDate(new Date(selectedDate))
            }
            label="Select Date"
            minDate={true}
            buttonTitle={oldDate}
          />
          <CustomDateTimeSelector
            mode="time"
            label="Select Time"
            onTimeChange={(time) => setTime(new Date(`2000-01-01T${time}`))}
            buttonTitle={formatTime(time)}
          />
        </View>
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
            style={[
              styles.button,
              { backgroundColor: themeColors.errorBackground },
            ]}
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
