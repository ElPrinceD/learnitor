import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import apiUrl from '../../../config';
import { useAuth } from "../../../components/AuthContext";

const ReportProblem: React.FC = () => {
    const [problem, setProblem] = useState('');

    const { userToken, userInfo } = useAuth();

    const handleReportProblem = async () => {
        const data = {
            problem,
            // You may include additional data such as user ID or device information if needed
        };
        try {
            const response = await axios.post(`${apiUrl}:8000/api/report/`, data, {
                headers: {
                    Authorization: `Token ${userToken?.token}`,
                },
            });
            console.log('Problem reported:', response.data);
            // Optionally, you can navigate to a success screen or display a confirmation message
        } catch (error) {
            console.error('Error reporting problem:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Problem Description</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Describe the problem..."
                    value={problem}
                    onChangeText={setProblem}
                    multiline
                />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleReportProblem}>
                <Text style={styles.saveButtonText}>Report Problem</Text>
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
        height: 120,
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

export default ReportProblem;
