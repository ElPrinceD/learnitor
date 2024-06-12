import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Button,
  useColorScheme,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "../../../constants/Colors";

interface CourseFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (courses: Course[]) => void;
}

interface Course {
  subject: string;
  teacher: string;
  days: string[];
  time: string;
  duration: string;
  endTime: string;
}

const CourseForm: React.FC<CourseFormProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
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

      // Calculate end time if duration is already set
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
    onSubmit(newCourses);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View
        style={[
          styles.formContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Controller
          control={control}
          name="courseName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Course Name"
              placeholderTextColor={themeColors.textSecondary}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="teacherName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Teacher Name"
              placeholderTextColor={themeColors.textSecondary}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        <View style={styles.daysContainer}>
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(day)
                  ? { backgroundColor: themeColors.buttonBackground }
                  : null,
              ]}
              onPress={() =>
                setSelectedDays((prev) =>
                  prev.includes(day)
                    ? prev.filter((d) => d !== day)
                    : [...prev, day]
                )
              }
            >
              <Text style={{ color: themeColors.text }}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedDays.map((day) => (
          <View key={day} style={styles.timeInputContainer}>
            <Text style={[styles.dayText, { color: themeColors.text }]}>
              {day}
            </Text>
            <Controller
              control={control}
              name={`time-${day}`}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Time (HH:MM)"
                    placeholderTextColor={themeColors.textSecondary}
                    onFocus={() => {
                      setSelectedDate(new Date());
                      setSelectedDay(day);
                      setShowDatePicker(true);
                    }}
                    value={selectedTimes[day] ?? value}
                    onChangeText={(text) => {
                      setSelectedTimes((prev) => ({ ...prev, [day]: text }));
                      onChange(text);

                      const durationText = selectedDurations[day];
                      const duration = parseFloat(durationText);
                      if (!isNaN(duration)) {
                        const endTime = calculateEndTime(text, duration);
                        setEndTimes((prev) => ({ ...prev, [day]: endTime }));
                      }
                    }}
                  />
                  {showDatePicker && selectedDay === day && (
                    <DateTimePicker
                      value={selectedDate ?? new Date()}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}
            />
            <TextInput
              style={[
                styles.input,
                { color: themeColors.text, marginLeft: 10, width: 100 },
              ]}
              placeholder="Duration (hours)"
              placeholderTextColor={themeColors.textSecondary}
              onChangeText={(text) => handleDurationChange(day, text)}
              value={selectedDurations[day]}
              keyboardType="numeric"
            />
          </View>
        ))}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: themeColors.buttonBackground },
          ]}
          onPress={handleSubmit(addCourse)}
        >
          <Text style={{ color: themeColors.text }}>Add Course</Text>
        </TouchableOpacity>
        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
};

const TimetableDisplay: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>
        {item.time} - {item.endTime}
      </Text>
      <Text style={styles.cell}>{item.subject}</Text>
      <Text style={styles.cell}>{item.teacher}</Text>
    </View>
  );

  return (
    <FlatList
      data={daysOfWeek}
      keyExtractor={(item) => item}
      renderItem={({ item: day }) => {
        const dayCourses = courses.filter((course) =>
          course.days.includes(day)
        );
        if (dayCourses.length === 0) return null;

        dayCourses.sort((a, b) => {
          const [aHours, aMinutes] = a.time.split(":").map(Number);
          const [bHours, bMinutes] = b.time.split(":").map(Number);
          return aHours - bHours || aMinutes - bMinutes;
        });

        return (
          <View key={day}>
            <Text style={[styles.dayHeader, { color: themeColors.text }]}>
              {day}
            </Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Subject</Text>
              <Text style={styles.headerCell}>Teacher</Text>
            </View>
            <FlatList
              data={dayCourses}
              renderItem={renderCourse}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        );
      }}
    />
  );
};

const TimetableScreen: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formVisible, setFormVisible] = useState(false);

  const addCourse = (newCourses: Course[]) => {
    setCourses((prevCourses) => [...prevCourses, ...newCourses]);
    setFormVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="Add Course" onPress={() => setFormVisible(true)} />
      <CourseForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={addCourse}
      />
      <TimetableDisplay courses={courses} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "left",
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    backgroundColor: "#e9ecef",
  },
  dayButtonActive: {
    backgroundColor: "#007bff",
  },
  dayText: {
    marginRight: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
});

export default TimetableScreen;
