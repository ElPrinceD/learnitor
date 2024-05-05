import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import datetimepicker
import { useGlobalSearchParams } from "expo-router";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from "../../../components/types"; 

import apiUrl from '@/config';

const CreateNewTime = ({ route }) => {
    const params = useGlobalSearchParams();
    const category_name = params.name;
    const category_id = params.category_id;
    const token = params.token;
    const learner_id = params.id
    const navigation = useNavigation();
    
   
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date()); // Initialize date state with current date
    const [time, setTime] = useState(new Date()); // Initialize time state with current time
    const [showDatePicker, setShowDatePicker] = useState(false); // State to control visibility of date picker
    const [showTimePicker, setShowTimePicker] = useState(false); // State to control visibility of time picker

    const datetime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );
  
    
    
    // Function to handle saving the new time
    const handleSaveTime = async () => {

    
      const data = {
        title,
        description,
        duedate: datetime.toISOString(),
        category: category_id,
        learner: learner_id
        
    };
      try {
      
    

    const response = await axios.post(`${apiUrl}:8000/api/learner/task/create/`, data, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    navigation.goBack();
    }  catch (error) {

    console.error('Error adding schedule:', error);
}}  

    return (
        <View style={styles.container}>
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
                    style={[styles.input, styles.input]}
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            {/* Date Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
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
                    placeholder={category_id}
                    value={category_name} // Display the category name
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
        </View>
    );
};

// Function to format time without seconds
const formatTime = (time) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
    },
});

export default CreateNewTime;
