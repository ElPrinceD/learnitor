import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import ApiUrl from "../../../config.js";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme.js";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput.tsx";
import {  MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";

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
  const [isRecurrenceEndDatePickerVisible, setRecurrenceEndDatePickerVisibility] = useState(false);
  const [open, setOpen] = useState(false);
  const [recurrenceItems, setRecurrenceItems] = useState([
    { label: 'Does not repeat', value: 'Does not repeat' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' }
  ]);
  const [selectedColor, setSelectedColor] = useState("red");
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  const handleSaveTime = async () => {
    const data = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time: date.toTimeString().split(" ")[0].slice(0, 5), // Only hours and minutes
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
      color: selectedColor, // Add color to data
    };

    try {
      const response = await axios.post(
        `${ApiUrl}/api/learner/task/create/`,
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
      marginBottom: rV(15)
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
      zIndex: 10, // Ensure dropdown is above other elements
    },
    dropdownTouchable: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderColor: '#ccc',
      borderRadius: 5,
      backgroundColor: themeColors.background,
    },
    dropdownText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
    },
    colorContainer: {
      width: '100%',
      flexDirection: "row",
      borderTopWidth: 1,
      paddingTop: 30,
      borderColor: themeColors.textSecondary,

      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: rV(15),
    },
    colorLabel: {
      fontSize: SIZES.large,
      color: themeColors.textSecondary,
    },
    colorOptions: {
      flexDirection: "row",
    },
    colorOption: {
      width: rS(20),
      height: rS(20),
      borderRadius: rS(15),
      marginHorizontal: rS(5),
    },
  });

  return (
    <ScrollView style={styles.container}>
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
          style={[styles.input, { borderRadius: 60, height: rV(20) }]}
          label="Description"
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.dateTime}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity onPress={showDatePicker}>
            <Text style={{ color: themeColors.text }}>
              {formatDateString(date)}{" "}
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={themeColors.textSecondary}
              />
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          textColor={themeColors.text}
          accentColor={themeColors.icon}
        />

        <View style={styles.dateTime}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity onPress={showTimePicker}>
            <Text style={{ color: themeColors.text }}>
              {date.toTimeString().split(" ")[0].slice(0, 5)}
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={themeColors.textSecondary}
              />
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          textColor={themeColors.text}
          accentColor={themeColors.icon}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Recurring</Text>
          <TouchableOpacity
            onPress={() => setOpen(!open)}
            style={styles.dropdownContainer}
          >
            <View style={styles.dropdownTouchable}>
              <Text style={styles.dropdownText}>{recurrenceOption}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={themeColors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {open && (
          <DropDownPicker
            open={open}
            value={recurrenceOption}
            items={recurrenceItems}
            setOpen={setOpen}
            setValue={(value) => setRecurrenceOption(value)}
            setItems={setRecurrenceItems}
            zIndex={1000} // Ensure dropdown is above other elements
            style={{ backgroundColor: themeColors.background }}
          />
        )}

        {recurrenceOption !== "Does not repeat" && (
          <TouchableOpacity onPress={showRecurrenceEndDatePicker}>
            <Animated.View
              entering={FadeInLeft.delay(200)
                .randomDelay()
                .reduceMotion(ReduceMotion.Never)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View style={styles.dateTime}>
                <Text style={styles.label}>End Date</Text>
                <Text style={{ color: themeColors.text }}>
                  {formatDateString(recurrenceEndDate)}{" "}
                
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={themeColors.textSecondary}
                />
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}

        <DateTimePickerModal
          isVisible={isRecurrenceEndDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmRecurrenceEndDate}
          onCancel={hideRecurrenceEndDatePicker}
          textColor={themeColors.text}
          accentColor={themeColors.icon}
        />

        <View style={styles.colorContainer}>
          <Text style={styles.colorLabel}>Color</Text>
          <View style={styles.colorOptions}>
            {["red", "blue", "green"].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && {
                    borderWidth: 2,
                    borderColor: themeColors.text,
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSaveTime}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      
    </ScrollView>
  );
};

export default CreateNewTime;

