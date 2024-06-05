import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert, // Import Alert from react-native
} from "react-native";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import apiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import DatePicker from "../../../components/DatePicker";
import TimePicker from "../../../components/TimePicker";

interface EditPlanProps {
  category_name: string;
  taskId: string; // Add taskId prop
}

const EditPlan: React.FC<EditPlanProps> = ({ category_name, taskId }) => { // Pass taskId prop
  const [categoryName, setCategoryName] = useState(category_name || "");
  const params = useLocalSearchParams();
  const id = params.taskId
  const category = params.category_name as string;
  const oldDescription = params.description as string;
  const oldTitle = params.title as string;
  const oldDate = params.duedate as string;
  const oldTime = params.duetime as string;
  const categories = params.categoryNames as string[];

  const { userToken, userInfo } = useAuth();
  const [title, setTitle] = useState(oldTitle || "");
  const [description, setDescription] = useState(oldDescription || "");
  const [category_id, setCategory_id] = useState(params.category_id || "");
  const [date, setDate] = useState(new Date(oldDate));
  const [time, setTime] = useState(parseTimeString(oldTime));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [updateAll, setUpdateAll] = useState(false); 

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
      category: category_id,
      learner: userInfo?.user.id,
      update_all: updateAll,
    };
    try {
      const response = await axios.put(
        `${apiUrl}:8000/api/learner/tasks/update/${id}/`,
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
    console.log(id)
    try {
      await axios.delete(`${apiUrl}:8000/api/tasks/${id}/`, {
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

  return (
    <ScrollView style={styles.container}>
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
          onDateChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
          setShow={setShowDatePicker}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategoryName}
          editable={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time</Text>
        <TimePicker
          time={time}
          show={showTimePicker}
          onTimeChange={(event: any, selectedTime?: Date) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setTime(selectedTime);
            }
          }}
          setShow={setShowTimePicker}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Update All Recurring Tasks</Text>
        <Switch
          value={updateAll}
          onValueChange={setUpdateAll}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTime}>
        <Text style={styles.saveButtonText}>Save Schedule</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePlan}>
        <Text style={styles.deleteButtonText}>Delete Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  saveButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default EditPlan;
