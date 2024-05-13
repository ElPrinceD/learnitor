import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import datetimepicker
import { useGlobalSearchParams } from "expo-router";
import axios from 'axios';
import {router} from 'expo-router'
import apiUrl from '../../../config';
import { useAuth } from "../../../components/AuthContext";

interface EditPlanProps {
    category_name: string;
  }
  const EditPlan: React.FC<EditPlanProps> = ({ category_name }) => {
    const [categoryName, setCategoryName] = useState(category_name || '');
    const params = useGlobalSearchParams();
    const category = params.category_name;
    const taskId = params.taskId;
    const oldDescription = params.description;
    const oldTitle = params.title;
    const oldDate = params.duedate;
    const oldTime = params.duetime;
    const categories = params.categoryNames;

    console.log(categories)

    function parseTimeString(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return new Date(0, 0, 0, hours, minutes, seconds);
    }
    const oldtime = parseTimeString(oldTime);

    const { userToken, userInfo } = useAuth();
    const [title, setTitle] = useState(oldTitle || '');
    const [task, setTask] = useState('');
    const [description, setDescription] = useState(oldDescription || '');
    const [category_id, setCategory_id] = useState(params.category_id || ''); // Initialize with the provided category ID
    const [date, setDate] = useState(new Date(oldDate)); // Initialize date state with the provided due date
    const [time, setTime] = useState(parseTimeString(oldTime)); // Initialize time state with the provided due time
    const [showDatePicker, setShowDatePicker] = useState(false); // State to control visibility of date picker
    const [showTimePicker, setShowTimePicker] = useState(false); // State to control visibility of time picker



    const formatTime = (time) => {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    const handleSaveTime = async () => {
        console.log(category_id)
        const formattedDueDate = date.toISOString().split('T')[0]; // Get the date portion
        const formattedDueTime = formatTime(time); // Format the time
        const data = {
            title,
            description,
            due_date: formattedDueDate,
            due_time: formattedDueTime,
            category: category_id,
            learner: userInfo?.user.id
        };
        try {
            const response = await axios.put(`${apiUrl}:8000/api/learner/tasks/update/${taskId}/`, data, {
                headers: {
                    Authorization: `Token ${userToken?.token}`,
                },
            });
            router.navigate("three")
            console.log('Schedule updated:', response.data);
        } catch (error) {
            console.error('Error updating schedule:', error);
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

            {/* Description Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            {/* Date Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                    <Text>{date.toDateString()}</Text>
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
            placeholder="Category"
            value={category}
            onChangeText={setCategoryName}
            editable={false} // Make the input non-editable
        />
    </View>

            {/* Time Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
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
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 20,
    },
    descriptionInput: {
        height: 120, // Increase height for multiline input
    },
    saveButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default EditPlan;
