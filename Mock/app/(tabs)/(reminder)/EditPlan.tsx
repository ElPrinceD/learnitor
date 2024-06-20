import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { router } from "expo-router";
import apiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import GameButton from "../../../components/GameButton";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const EditPlan = () => {
  const params = useLocalSearchParams();
  const id = params.taskId;
  const category_name = params.category_name as string;
  const oldDescription = params.description as string;
  const oldTitle = params.title as string;
  const oldDate = params.duedate as string;
  const oldTime = params.duetime as string;
  const categories = params.categoryNames as string[];
  const { userToken, userInfo } = useAuth();

  const [title, setTitle] = useState(oldTitle || "");
  const [description, setDescription] = useState(oldDescription || "");
  const [date, setDate] = useState(new Date(oldDate));
  const [time, setTime] = useState(parseTimeString(oldTime));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [updateAll, setUpdateAll] = useState(false);

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

  const handleSaveTime = async () => {
    const formattedDueDate = date.toISOString().split("T")[0];
    const formattedDueTime = formatTime(time);
    const data = {
      title,
      description,
      due_date: formattedDueDate,
      due_time: formattedDueTime,
      category: params.category_id,
      learner: userInfo?.user.id,
      update_all: updateAll,
    };
    try {
      const response = await axios.put(
        `${apiUrl}/api/learner/tasks/update/${id}/`,
        data,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      router.navigate("three");
      console.log("Schedule updated:", response.data);
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const handleDeletePlan = async () => {
    try {
      await axios.delete(`${apiUrl}/api/tasks/${id}/`, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      router.navigate("three");
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
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
    categoryName: {
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
      color: themeColors.selectedText,
      textAlign: "center",
      textDecorationLine: "underline",
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
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: rS(55),
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
    <ScrollView style={styles.container}>
      <View style={styles.top}>
        <GameButton
          onPress={handleSaveTime}
          title="Save"
          style={styles.button}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: SIZES.xxLarge, height: rV(60) }]}
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
                {time.toTimeString().split(" ")[0].slice(0, 5)}
              </Text>
              {showTimePicker && (
                <DateTimePicker
                  testID="timePicker"
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
        <View style={styles.schedule}>
          <Feather name="repeat" size={SIZES.xLarge} color={themeColors.icon} />

          <Text style={styles.dateTime}>Update All Recurring Tasks</Text>
          <Switch
            value={updateAll}
            onValueChange={setUpdateAll}
            trackColor={{
              false: themeColors.text,
              true: themeColors.buttonBackground,
            }}
            thumbColor={themeColors.icon}
            // style={{ c }}
          />
        </View>
      </View>
      <View style={styles.planItemLine} />
      <View style={styles.top}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: SIZES.large, height: rV(150) }]}
            placeholder="Edit Note"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={themeColors.textSecondary}
            multiline
          />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <GameButton
          onPress={handleDeletePlan}
          title="Delete"
          style={[styles.button, { backgroundColor: "#D22B2B" }]}
        />
      </View>
    </ScrollView>
  );
};

export default EditPlan;
