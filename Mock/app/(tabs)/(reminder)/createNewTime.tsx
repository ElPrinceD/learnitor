import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker"; // Import datetimepicker
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

import apiUrl from "@/config";
import { useAuth } from "../../../components/AuthContext";

interface Params {
  name: string;
  category_id: number;
}

const CreateNewTime: React.FC = () => {
  const params = useGlobalSearchParams();
  const category_name = params.name;
  const category_id = params.category_id;

  const { userToken, userInfo } = useAuth();
  const navigation = useNavigation();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date()); // Initialize date state with current date
  const [time, setTime] = useState<Date>(new Date()); // Initialize time state with current time
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // State to control visibility of date picker
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false); // State to control visibility of time picker

  // Function to handle saving the new time
  const handleSaveTime = async (): Promise<void> => {
    const datetime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );

    const data = {
      title,
      description,
      duedate: datetime.toISOString(),
      category: category_id,
      learner: userInfo?.user.id,
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
      navigation.goBack();
    } catch (error) {
      console.error("Error adding schedule:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Schedule</Text>

      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={4}
        />
      </View>

      {/* Date Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Category Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder={category_id?.toString()}
          value={category_name} // Display the category name
          editable={false} // Make the input non-editable
        />
      </View>

      {/* Time Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>{formatTime(time)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="clock" // Use "clock" instead of "spinner"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setTime(selectedTime);
              }
            }}
          />
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTime}>
        <Text style={styles.saveButtonText}>Add Schedule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Function to format time without seconds
const formatTime = (time: Date): string => {
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 20,
  },
  descriptionInput: {
    height: 120, // Increase height for multiline input
  },
  saveButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 50,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateNewTime;
