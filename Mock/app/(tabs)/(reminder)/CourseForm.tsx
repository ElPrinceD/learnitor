import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Modal,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import apiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { rMS, rS, rV } from "../../../constants";
import AnimatedTextInput from "../../../components/AnimatedTextInput";
import GameButton from "../../../components/GameButton";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import TimetableDisplay from "../../../components/TimetableDisplay";

interface CourseFormProps {
  onSubmit: (timetable: Timetable) => void;
}

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
}

interface Timetable {
  name: string;
  courses: Course[];
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit }) => {
  const { control, handleSubmit, reset } = useForm();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedDurations, setSelectedDurations] = useState<{
    [key: string]: string;
  }>({});
  const [endTimes, setEndTimes] = useState<{ [key: string]: string }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetableName, setTimetableName] = useState<string>("");
  const { userToken, userInfo } = useAuth();

  const [previewVisible, setPreviewVisible] = useState(false);

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date && selectedDay) {
      const formattedTime = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSelectedTimes((prev) => ({ ...prev, [selectedDay]: formattedTime }));
      setSelectedDate(undefined);
      setSelectedDay(null);

      const durationText = selectedDurations[selectedDay];
      if (durationText) {
        const duration = parseFloat(durationText);
        if (!isNaN(duration)) {
          const endTime = calculateEndTime(formattedTime, duration);
          setEndTimes((prev) => ({ ...prev, [selectedDay]: endTime }));
        }
      }
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const isPM = startTime.includes("PM");
    let [hours, minutes] = startTime
      .replace(" AM", "")
      .replace(" PM", "")
      .split(":")
      .map(Number);
    if (isPM && hours < 12) hours += 12;

    const endTime = new Date();
    endTime.setHours(
      hours + Math.floor(duration),
      minutes + (duration % 1) * 60,
      0,
      0
    );
    return endTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDurationChange = (day: string, durationText: string) => {
    const duration = parseFloat(durationText);
    setSelectedDurations((prev) => ({ ...prev, [day]: durationText }));

    const startTime = selectedTimes[day];
    if (startTime && !isNaN(duration)) {
      const endTime = calculateEndTime(startTime, duration);
      setEndTimes((prev) => ({ ...prev, [day]: endTime }));
    }
  };

  const addCourse = (data: any) => {
    const { courseName, teacherName } = data;
    const newCourses = selectedDays.map((day) => {
      return {
        subject: courseName,
        teacher: teacherName,
        days: [day],
        time: selectedTimes[day] || "",
        duration: selectedDurations[day] || "",
        endTime: endTimes[day] || "",
      };
    });
    setCourses((prevCourses) => [...prevCourses, ...newCourses]);
    reset();
  };

  const handleSave = async (data: any) => {
    const { courseName, teacherName } = data;
    const day = selectedDays.length > 0 ? selectedDays[0] : "Monday";
    const nearestDate = new Date();
    nearestDate.setDate(
      nearestDate.getDate() +
        ((7 -
          nearestDate.getDay() +
          [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].indexOf(day)) %
          7)
    );

    const newTimetable = {
      name: timetableName,
      courses: courses,
    };
    onSubmit(newTimetable);

    const scheduleData = {
      title: courseName,
      description: teacherName,
      due_date: nearestDate.toISOString().split("T")[0],
      due_time: selectedTimes[day] || "",
      category: 2,
      learner: userInfo?.user.id,
      is_recurring: true,
      recurrence_interval: "weekly",
      recurrence_end_date: new Date(
        new Date().setMonth(new Date().getMonth() + 6)
      )
        .toISOString()
        .split("T")[0],
    };

    try {
      const response = await axios.post(
        `${apiUrl}:8000/api/learner/task/create/`,
        scheduleData,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error adding schedule:", error);
    }

    reset();
  };

  const previewTimetable = () => {
    setPreviewVisible(true);
  };

  const snapPoints = useMemo(() => ["20%", "50%", "100%"], []);
  const BottomSheetRef = useRef<BottomSheet>(null);

  const renderDayButton = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.dayButton,
        selectedDays.includes(item) ? styles.selectedDayButton : null,
      ]}
      onPress={() =>
        setSelectedDays((prev) =>
          prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
        )
      }
    >
      <Text style={{ color: themeColors.text }}>{item.substring(0, 3)}</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    formContainer: {
      flex: 1,
      padding: 20,
      // justifyContent: "center",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 20,
    },
    dayButtonContainer: {
      marginVertical: 10,
    },
    dayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.tint,
      backgroundColor: "transparent",
      marginHorizontal: 5,
    },
    selectedDayButton: {
      borderColor: themeColors.selectedItem,
      borderWidth: 3,
    },
    timeInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    gestureRecognizer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    safeAreaView: {
      flex: 1,
    },
    dayText: {
      color: themeColors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.tint,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      backgroundColor: "transparent",
      margin: rMS(10),
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
  });

  return (
    <>
      <BottomSheet
        ref={BottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: themeColors.tint }}
      >
        <SafeAreaView style={styles.container}>
          <BottomSheetScrollView style={styles.formContainer}>
            <Controller
              control={control}
              name="courseName"
              render={({ field: { onChange, value } }) => (
                <AnimatedTextInput
                  label="Course Name"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="teacherName"
              render={({ field: { onChange, value } }) => (
                <AnimatedTextInput
                  label="Teacher Name"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <View style={styles.dayButtonContainer}>
              <BottomSheetFlatList
                data={[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ]}
                renderItem={renderDayButton}
                keyExtractor={(item) => item}
                horizontal
              />
            </View>
            {selectedDays.map((day) => (
              <View key={day}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(new Date());
                    setSelectedDay(day);
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dayText}>
                    Select time for {day}:{" "}
                    {selectedTimes[day] || "Not selected"}
                  </Text>
                </TouchableOpacity>
                <Controller
                  control={control}
                  name={`${day}Duration`}
                  defaultValue={""}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter duration for ${day}`}
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        handleDurationChange(day, text);
                      }}
                    />
                  )}
                />
                <Text style={styles.dayText}>
                  End time for {day}: {endTimes[day] || "Not calculated"}
                </Text>
              </View>
            ))}
            {/* <View style={styles.buttonContainer}>
              <GameButton onPress={handleSubmit(addCourse)} style={{ flex: 1 }}>
                Add Course
              </GameButton>
            </View>
            <View style={styles.buttonContainer}>
              <GameButton
                onPress={handleSubmit(handleSave)}
                style={{ flex: 1 }}
              >
                Save Timetable
              </GameButton>
              <GameButton onPress={previewTimetable} style={{ flex: 1 }}>
                Preview Timetable
              </GameButton>
            </View> */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="time"
                display="default"
                onChange={onDateChange}
              />
            )}
          </BottomSheetScrollView>
        </SafeAreaView>
      </BottomSheet>
      <Modal visible={previewVisible} animationType="slide">
        <SafeAreaView style={styles.safeAreaView}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <TimetableDisplay courses={courses} />
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default CourseForm;
