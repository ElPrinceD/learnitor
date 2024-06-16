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
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { router } from "expo-router";
import apiUrl from "../../../config.js";
import { useAuth } from "../../../components/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme.js";
import GameButton from "../../../components/GameButton";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";

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
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] =
    useState(false);
  const [updateAll, setUpdateAll] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  const handleSaveTime = async () => {
    const data = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time: time.toTimeString().split(" ")[0].slice(0, 5), // Only hours and minutes
      category: category_id,
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
      update_all: updateAll,
    };

    try {
      const response = await axios.post(
        `${apiUrl}:8000/api/learner/task/create/`,
        data,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      router.navigate("three");
      router.setParams({ newPlan: response.data });
    } catch (error) {
      console.error("Error adding schedule:", error);
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
    },
    picker: {
      flex: 0.7,
      color: themeColors.textSecondary,
      marginLeft: rS(18),
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
            placeholder="Add Title"
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
          <View style={styles.picker}>
            <Picker
              selectedValue={recurrenceOption}
              onValueChange={(itemValue) => setRecurrenceOption(itemValue)}
              style={{ color: themeColors.text }}
            >
              <Picker.Item label="Does not repeat" value="Does not repeat" />
              <Picker.Item label="Daily" value="Daily" />
              <Picker.Item label="Weekly" value="Weekly" />
            </Picker>
          </View>
        </View>

        {recurrenceOption !== "Does not repeat" && (
          <TouchableOpacity
            onPress={() => setShowRecurrenceEndDatePicker(true)}
          >
            <Animated.View
              entering={FadeInLeft.delay(200)
                .randomDelay()
                .reduceMotion(ReduceMotion.Never)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View style={styles.schedule}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={SIZES.xLarge}
                  color={themeColors.icon}
                />
                <View style={styles.dateTime}>
                  <Text style={{ color: themeColors.text }}>
                    {formatDateString(recurrenceEndDate)}
                  </Text>
                  {showRecurrenceEndDatePicker && (
                    <DateTimePicker
                      testID="recurrenceEndDatePicker"
                      value={recurrenceEndDate}
                      mode="date"
                      is24Hour={true}
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || recurrenceEndDate;
                        setShowRecurrenceEndDatePicker(false);
                        setRecurrenceEndDate(currentDate);
                      }}
                      textColor={themeColors.text}
                      accentColor={themeColors.icon}
                    />
                  )}
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.planItemLine} />
      <View style={styles.top}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: SIZES.large, height: rV(150) }]}
            placeholder="Add Note"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={themeColors.textSecondary}
            multiline
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateNewTime;
