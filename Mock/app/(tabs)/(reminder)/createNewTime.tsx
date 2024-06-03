import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { router } from "expo-router";
import apiUrl from "../../../config.js";
import { useAuth } from "../../../components/AuthContext";
import DatePicker from "../../../components/DatePicker"; // Adjust the import path as needed
import TimePicker from "../../../components/TimePicker"; // Adjust the import path as needed

const CreateNewTime: React.FC = () => {
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
  const [isRepetitive, setIsRepetitive] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState("daily"); // New state for recurrence interval
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date()); // New state for recurrence end date
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);

  const handleSaveTime = async () => {
    console.log(category_id)
    const data = {
      title,
      description,
      due_date: date.toISOString().split("T")[0],
      due_time: time.toISOString().split("T")[1].slice(0, 5),
      category: category_id,
      learner: userInfo?.user.id,
      is_recurring: isRepetitive, // Change this field to match backend naming
      recurrence_interval: isRepetitive ? recurrenceInterval : null, // Only include if repetitive
      recurrence_end_date: isRepetitive ? recurrenceEndDate.toISOString().split("T")[0] : null, // Only include if repetitive
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Schedule</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <DatePicker
          date={date}
          show={showDatePicker}
          onDateChange={(event, selectedDate) =>
            selectedDate && setDate(selectedDate)
          }
          setShow={setShowDatePicker}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder={category_id}
          value={category_name}
          editable={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time</Text>
        <TimePicker
          time={time}
          show={showTimePicker}
          onTimeChange={(event, selectedTime) =>
            selectedTime && setTime(selectedTime)
          }
          setShow={setShowTimePicker}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Repetitive</Text>
        <View style={styles.switchContainer}>
          <Switch
            value={isRepetitive}
            onValueChange={setIsRepetitive}
          />
          <Text style={styles.switchLabel}>{isRepetitive ? "Yes" : "No"}</Text>
        </View>
      </View>

      {isRepetitive && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Recurrence Interval</Text>
            <View style={styles.recurrenceContainer}>
              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrenceInterval === "daily" && styles.selectedRecurrenceButton,
                ]}
                onPress={() => setRecurrenceInterval("daily")}
              >
                <Text
                  style={[
                    styles.recurrenceButtonText,
                    recurrenceInterval === "daily" && styles.selectedRecurrenceButtonText,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrenceInterval === "weekly" && styles.selectedRecurrenceButton,
                ]}
                onPress={() => setRecurrenceInterval("weekly")}
              >
                <Text
                  style={[
                    styles.recurrenceButtonText,
                    recurrenceInterval === "weekly" && styles.selectedRecurrenceButtonText,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Recurrence End Date</Text>
            <DatePicker
              date={recurrenceEndDate}
              show={showRecurrenceEndDatePicker}
              onDateChange={(event, selectedDate) =>
                selectedDate && setRecurrenceEndDate(selectedDate)
              }
              setShow={setShowRecurrenceEndDatePicker}
            />
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTime}>
        <Text style={styles.saveButtonText}>Add Schedule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  descriptionInput: {
    height: 120,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  recurrenceContainer: {
    flexDirection: "row",
  },
  recurrenceButton: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  selectedRecurrenceButton: {
    backgroundColor: "#007BFF",
  },
  recurrenceButtonText: {
    color: "#000",
  },
  selectedRecurrenceButtonText: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateNewTime;
