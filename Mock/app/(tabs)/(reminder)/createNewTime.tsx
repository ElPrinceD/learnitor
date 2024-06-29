import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Switch,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import ApiUrl from "../../../config.js";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme.js";
import AnimatedRoundTextInput from "../../../components/AnimatedRoundTextInput";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInLeft, ReduceMotion } from "react-native-reanimated";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [isRecurrenceEndDatePickerVisible, setRecurrenceEndDatePickerVisibility] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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
      backgroundColor: themeColors.background,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
    },
    inputContainer: {
      marginTop: rV(20),
      flex: 1,
    },
    input: {
      flex: 1,
      height: rV(30),
      color: themeColors.text,
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
      fontSize: SIZES.medium,
      marginBottom: rV(5),
      color: themeColors.text,
    },
    descriptionInput: {
      width: "100%",
      height: rV(95),
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
      marginBottom: rS(20),
      flexDirection: "row",
      justifyContent: "space-between",
      flex: 1,
    },
    picker: {
      flex: 0.7,
      color: themeColors.textSecondary,
      backgroundColor: "transparent",
      marginLeft: rS(75),
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
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.bottomSection}>
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
          style={[styles.input, { borderRadius: 70, height: rV(30) }]}
          label="Description"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity onPress={showDatePicker}>
        <View style={styles.dateTime}>
        <Text style={styles.label}>Date</Text>
              <Text style={{ color: themeColors.text }}>
                {formatDateString(date)}{" "}
              </Text>
            </View>
         
          
          <View style={styles.dateTime}>
            
            <Text style={[styles.label,]}>Time</Text>
            <Text style={{ color: themeColors.text }}>

            
                {date.toTimeString().split(" ")[0].slice(0, 5)}
              </Text>
          </View>
          
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          textColor={themeColors.text}
          accentColor={themeColors.icon}
        />

        {/* <View style={styles.schedule}>
          <Feather name="repeat" size={SIZES.xLarge} color={themeColors.icon} />
          <View style={styles.picker}>
            <Picker
              selectedValue={recurrenceOption}
              mode="dropdown"
              onValueChange={(itemValue) => setRecurrenceOption(itemValue)}
              style={{ color: themeColors.text }}
            >
              <Picker.Item label="Does not repeat" value="Does not repeat" />
              <Picker.Item label="Daily" value="Daily" />
              <Picker.Item label="Weekly" value="Weekly" />
            </Picker>
          </View>
        </View> */}
        <View style={styles.switchContainer}>
          <Text>Recussive</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={recurrenceOption !== "Does not repeat" ? "#f4f3f4" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) =>
              setRecurrenceOption(value ? "Daily" : "Does not repeat")
            }
            value={recurrenceOption !== "Does not repeat"}
          />
        </View>

        {recurrenceOption !== "Does not repeat" && (
          <TouchableOpacity onPress={showRecurrenceEndDatePicker}>
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
                </View>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSaveTime}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateNewTime;
