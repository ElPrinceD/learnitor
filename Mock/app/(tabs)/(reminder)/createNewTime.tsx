import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
  FlatList,
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
import { createTask, getCategories} from "../../../TimelineApiCalls.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorMessage from "../../../components/ErrorMessage.tsx";
import GameButton from "../../../components/GameButton.tsx";

// Import for Android
let ActionSheet;
if (Platform.OS === 'android') {
  ActionSheet = require('react-native-actionsheet').default;
}

const CreateNewTime = () => {
  const [activeTab, setActiveTab] = useState('Task');
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
  const [endDate, setEndDate] = useState(new Date()); // For due_time_end
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false); // For end time picker
  const [recurrenceOption, setRecurrenceOption] = useState("Does not repeat");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [
    isRecurrenceEndDatePickerVisible,
    setRecurrenceEndDatePickerVisibility,
  ] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to manage error message

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "DARK" : "LIGHT";

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);
  const showEndTimePicker = () => setEndTimePickerVisibility(true);
  const hideEndTimePicker = () => setEndTimePickerVisibility(false);

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

  const handleConfirmEndTime = (selectedTime) => {
    hideEndTimePicker();
    if (selectedTime) {
      const newEndDate = new Date(endDate);
      newEndDate.setHours(selectedTime.getHours());
      newEndDate.setMinutes(selectedTime.getMinutes());
      setEndDate(newEndDate);
    }
  };

  const showRecurrenceEndDatePicker = () => setRecurrenceEndDatePickerVisibility(true);
  const hideRecurrenceEndDatePicker = () => setRecurrenceEndDatePickerVisibility(false);
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

  const {
    status: tasksStatus,
    data: tasksData,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks", userToken?.token],
    
    enabled: !!userToken?.token && activeTab === 'TimeTable',
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

  

  const formatDateString = (date) => {
    const options = {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const showCategoryPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...(categoriesData?.map(cat => cat.label) || [])],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex !== 0 && categoriesData) {
            setSelectedCategory(categoriesData[buttonIndex - 1]);
          }
        }
      );
    } else {
      ActionSheet.showActionSheetWithOptions({
        options: ['Cancel', ...(categoriesData?.map(cat => cat.label) || [])],
        cancelButtonIndex: 0,
      }, buttonIndex => {
        if (buttonIndex !== 0 && categoriesData) {
          setSelectedCategory(categoriesData[buttonIndex - 1]);
        }
      });
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDetails}>{item.due_date}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
    },
    tabContainer: {
      flexDirection: 'row',
      fontSize: SIZES.small,
      fontWeight: "bold",
      backgroundColor: themeColors.reverseText,
      borderRadius: rMS(10),
      justifyContent: 'center',
      
      paddingVertical: rV(1),
    },
    tab: {
      paddingHorizontal: rS(20),
      paddingVertical: rV(5),
      width: "50%",
      
    },
    activeTab: {
     
      backgroundColor: themeColors.normalGrey,
      borderRadius: rMS(10),
      color: themeColors.background,
      width: "50%"
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
      marginVertical: rV(20),
      paddingTop: rV(7),
      paddingLeft: rS(10),
      backgroundColor: themeColors.reverseText,
      borderRadius: rMS(10)
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
    taskItem: {
      padding: rS(15),
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    taskTitle: {
      fontSize: SIZES.large,
      color: themeColors.text,
    },
    taskDetails: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    timetableList: {
      padding: rS(15),
    }
  });

 
  const handleSaveTime = () => {
    // Modify this function to handle both Task and TimeTable tab
    const data = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time_start: date.toTimeString().split(" ")[0].slice(0, 5), // Only hours and minutes
      due_time_end: endDate.toTimeString().split(" ")[0].slice(0, 5), // Only hours and minutes
    };

    if (activeTab === 'Task') {
      data.category = selectedCategory || null;
      data.learner = userInfo?.user.id;
      data.is_recurring = recurrenceOption !== "Does not repeat";
      data.recurrence_interval = recurrenceOption !== "Does not repeat" ? recurrenceOption.toLowerCase() : null;
      data.recurrence_end_date = recurrenceOption !== "Does not repeat" ? recurrenceEndDate.toISOString().split("T")[0] : null;
    }

    createTaskMutation.mutate({
      taskData: data,
      token: userToken?.token,
    });
  };



  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Task' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('Task')}
        >
          <Text style={styles.tabText}>Task</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'TimeTable' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('TimeTable')}
        >
          <Text style={styles.tabText}>TimeTable</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'Task' || activeTab === 'TimeTable' ? (
          <>
            <View>
              <View style={styles.inputContainer}>
                <AnimatedRoundTextInput
                  placeholderTextColor={themeColors.textSecondary}
                  style={styles.input}
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                />
                <AnimatedRoundTextInput
                  placeholderTextColor={themeColors.textSecondary}
                  style={styles.input}
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
            <View style={styles.section}>
              {/* Date and Time Selection */}
              <View style={styles.dateTime}>
                <Text style={[styles.label, styles.dateTimeLabel]}>Select Date</Text>
                <TouchableOpacity style={styles.dateTimeText} onPress={showDatePicker}>
                  <Text style={styles.title}>{formatDateString(date)}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                date={date}
                minimumDate={new Date()}
              />

              <View style={styles.dateTime}>
                <Text style={[styles.label, styles.dateTimeLabel]}>Select Time</Text>
                <TouchableOpacity style={styles.dateTimeText} onPress={showTimePicker}>
                  <Text style={styles.title}>{date.toTimeString().slice(0, 5)}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
                date={date}
              />

              <View style={styles.dateTimeLast}>
                <Text style={[styles.label, styles.dateTimeLabel]}>Select End Time</Text>
                <TouchableOpacity style={styles.dateTimeText} onPress={showEndTimePicker}>
                  <Text style={styles.title}>{endDate.toTimeString().slice(0, 5)}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePickerModal
                isVisible={isEndTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmEndTime}
                onCancel={hideEndTimePicker}
                date={endDate}
              />
            </View>

            {activeTab === 'Task' && (
              <View style={styles.section}>
                {/* Category and Recurrence for Task Tab */}
                <View style={styles.dateTime}>
                  <Text style={[styles.label, styles.dateTimeLabel]}>Category</Text>
                  <TouchableOpacity style={styles.dateTimeText} onPress={showCategoryPicker}>
                    <Text style={styles.title}>{selectedCategory ? selectedCategory.label : "Select a category"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={recurrenceOption === "Does not repeat" ? styles.dateTimeNoBorder : styles.dateTime}>
                  <Text style={[styles.label, styles.dateTimeLabel]}>Recurrence</Text>
                  <TouchableOpacity style={styles.dateTimeText} onPress={() => {
                    ActionSheetIOS.showActionSheetWithOptions(
                      {
                        options: ['Cancel', 'Does not repeat', 'Daily', 'Weekly'],
                        cancelButtonIndex: 0,
                      },
                      buttonIndex => {
                        if (buttonIndex !== 0) {
                          setRecurrenceOption(['Does not repeat', 'Daily', 'Weekly'][buttonIndex - 1]);
                        }
                      }
                    );
                  }}>
                    <Text style={styles.title}>{recurrenceOption}</Text>
                  </TouchableOpacity>
                </View>

                {recurrenceOption !== "Does not repeat" && (
                  <View style={styles.dateTimeLast}>
                    <Text style={[styles.label, styles.dateTimeLabel]}>End Date</Text>
                    <TouchableOpacity style={styles.dateTimeText} onPress={showRecurrenceEndDatePicker}>
                      <Text style={styles.title}>{formatDateString(recurrenceEndDate)}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <DateTimePickerModal
                  isVisible={isRecurrenceEndDatePickerVisible}
                  mode="date"
                  onConfirm={handleConfirmRecurrenceEndDate}
                  onCancel={hideRecurrenceEndDatePicker}
                  date={recurrenceEndDate}
                  minimumDate={new Date()}
                />
              </View>
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
          </>
        ) : (
          tasksStatus === 'success' ? (
            <FlatList
              data={tasksData || []}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.timetableList}
            />
          ) : (
            <Text style={styles.title}>Loading tasks...</Text>
          )
        )}
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