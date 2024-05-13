import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useGlobalSearchParams } from "expo-router";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { useNavigation } from "@react-navigation/native";

interface TaskResponse {
  title: string;
  // Add other task properties here
}

const EditTaskScreen: React.FC = () => {
  const params = useGlobalSearchParams();
  const taskId: string = params.taskId as string; // Assuming taskId is a string
  const { userToken } = useAuth();
  const [taskTitle, setTaskTitle] = useState<string>(""); // Assuming taskTitle is a string
  const navigation = useNavigation();

  // Fetch task details when component mounts
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const response = await axios.get<TaskResponse>(
          `${ApiUrl}:8000/api/learner/tasks/${taskId}/`,
          {
            headers: {
              Authorization: `Token ${userToken?.token}`,
            },
          }
        );
        setTaskTitle(response.data.title);
      } catch (error) {
        console.error("Error fetching task details:", error);
      }
    };

    fetchTaskDetails();
  }, [taskId, userToken]);

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `${ApiUrl}:8000/api/learner/tasks/${taskId}/`,
        {
          title: taskTitle,
          // Add other task details here if needed
        },
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      // Optionally, you can navigate back to the task list screen or perform other actions
      navigation.goBack(); // Navigate back to the previous screen
      Alert.alert("Success", "Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Task</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task title"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      {/* Add other input fields for task details */}
      <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditTaskScreen;
