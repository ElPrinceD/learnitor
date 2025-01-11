import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import Colors from "../constants/Colors";
import { rMS, rS, rV } from "../constants";
import AnimatedTextInput from "../components/AnimatedTextInput";
import GameButton from "../components/GameButton";
import TimetableDisplay from "../components/TimetableDisplay";
import { useAuth } from "../components/AuthContext";
import DateSelector from "../components/DateSelector"; // Assuming these paths are correct
import CustomDateTimeSelector from "../components/CustomDateTimeSelector";
import { useMutation } from "@tanstack/react-query";
import { createTask } from "../TimelineApiCalls";
import { router } from "expo-router";

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
  startDate: string;
  endDate: string;
}
interface CreateTaskData {
  title: string;
  description: string;
  due_date: string;
  due_time_start: string;
  due_time_end: string;
  category?: number | null;
  learner?: number;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_end_date?: string | null;
}

interface TimetableCreatorProps {
  onSubmit: (courses: Course[]) => void;
}

const TimetableCreator: React.FC<TimetableCreatorProps> = ({ onSubmit }) => {
  const { control, handleSubmit, reset } = useForm();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedDurations, setSelectedDurations] = useState<{
    [key: string]: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [endTimes, setEndTimes] = useState<{ [key: string]: string }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { userToken, userInfo } = useAuth();

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, 0, 0);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime.toTimeString().slice(0, 5);
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
    const newStartDate = calculateNearestStartDate(selectedDays[0] || "Monday");
    setStartDate(newStartDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + 6); // Set end date 6 months from start
    setEndDate(newEndDate);

    const newCourses = selectedDays.map((day) => {
      return {
        subject: courseName,
        teacher: teacherName,
        days: [day],
        time: selectedTimes[day] || "",
        duration: selectedDurations[day] || "",
        endTime: endTimes[day] || "",
        startDate: newStartDate.toISOString().split("T")[0],
        endDate: newEndDate.toISOString().split("T")[0],
      };
    });
    setCourses((prevCourses) => [...prevCourses, ...newCourses]);
    reset();
  };

  const createTaskMutation = useMutation<any, any, any>({
    mutationFn: async ({ taskData, token }) => {
      await createTask(taskData, token);
    },
    onSuccess: (taskData) => {
      router.navigate("three");
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating schedule");
    },
  });

  const calculateNearestStartDate = (day: string): Date => {
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const targetDay = days.indexOf(day);
    let diff = targetDay - now.getDay();
    if (diff <= 0) diff += 7; // If today or passed, add 7 days to get the next occurrence
    now.setDate(now.getDate() + diff);
    return now;
  };

  const handleSave = () => {
    for (const course of courses) {
      const scheduleData: CreateTaskData = {
        title: course.subject,
        description: course.teacher,
        due_date: course.startDate,
        due_time_start: course.time,
        due_time_end: course.endTime,
        category: 2,
        learner: userInfo?.user.id,
        is_recurring: true,
        recurrence_interval: "weekly",
        recurrence_end_date: course.endDate,
      };

      createTaskMutation.mutate({
        taskData: scheduleData,
        token: userToken?.token!,
      });
    }
    console.log("save");
  };

  const renderDayButton = (item: string) => (
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
      paddingVertical: rV(25),
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
    dayButtonContainer: {
      marginVertical: 10,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.tint,
      backgroundColor: "transparent",
      marginHorizontal: 5,
      marginBottom: 5,
    },
    selectedDayButton: {
      borderColor: themeColors.selectedItem,
      borderWidth: 3,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    preview: {
      marginTop: 20,
    },
  });

  return (
    <>
      <ScrollView style={styles.container}>
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
              label="Lecturer"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <View style={styles.dayButtonContainer}>
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map(renderDayButton)}
        </View>
        <DateSelector
          onDateChange={(selectedDate: string) =>
            setStartDate(new Date(selectedDate))
          }
          label="Start Date"
          minDate={true}
        />
        {selectedDays.map((day) => (
          <View key={day}>
            <CustomDateTimeSelector
              mode="time"
              label={`Select start time for ${day}`}
              onTimeChange={(time) =>
                setSelectedTimes((prev) => ({ ...prev, [day]: time }))
              }
              buttonTitle="Pick Start Time"
            />
            <TextInput
              style={styles.input}
              placeholder={`Enter duration for ${day} (minutes)`}
              keyboardType="numeric"
              onChangeText={(text) => handleDurationChange(day, text)}
            />
            <Text style={{ color: themeColors.text }}>
              End time for {day}: {endTimes[day] || "Not calculated"}
            </Text>
          </View>
        ))}
        <View style={styles.buttonContainer}>
          <GameButton onPress={handleSubmit(addCourse)} style={{ flex: 1 }}>
            <Text>Add Course</Text>
          </GameButton>
        </View>
        <View style={styles.buttonContainer}>
          <GameButton onPress={handleSave} style={{ flex: 1 }}>
            <Text>Save Timetable</Text>
          </GameButton>
        </View>
      </ScrollView>
      <View style={styles.preview}>
        <Text style={{ color: themeColors.text, fontSize: 16 }}>Preview:</Text>
        <TimetableDisplay courses={courses} />
      </View>
    </>
  );
};

export default TimetableCreator;
