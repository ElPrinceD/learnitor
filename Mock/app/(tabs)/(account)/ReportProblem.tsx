import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import apiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";

const ReportProblem: React.FC = () => {
  const [problemType, setProblemType] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleReportProblem = async () => {
    setLoading(true);
    const data = {
      problemType,
      problemDescription,
      contactMethod,
      contactInfo,
    };
    try {
      const response = await axios.post(`${apiUrl}/api/report/`, data, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      console.log("Issue reported:", response.data);
      Alert.alert("Success", "Your issue has been reported.");
    } catch (error) {
      console.error("Error reporting issue:", error);
      Alert.alert("Error", "There was an error reporting your issue.");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rS(20),
      backgroundColor: themeColors.background,
    },
    inputContainer: {
      marginBottom: rV(20),
    },
    label: {
      fontSize: SIZES.large,
      marginBottom: rV(5),
      color: themeColors.text,
      fontWeight: "bold",
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: rMS(10),
      padding: rS(20),
      backgroundColor: themeColors.card,
      color: themeColors.text,
      justifyContent: "center",
    },
    descriptionInput: {
      height: rV(120),
      textAlignVertical: "top",
    },
    saveButton: {
      backgroundColor: themeColors.buttonBackground,
      paddingVertical: rV(10),
      marginBottom: rV(30),
      borderRadius: rMS(10),
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
      marginLeft: rS(10),
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          What type of issue are you experiencing?
        </Text>
        <View style={styles.input}>
          <TextInput
            placeholder="Ex. Login, Accessing content, etc."
            value={problemType}
            onChangeText={setProblemType}
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Please describe the problem you're facing in detail:
        </Text>
        <View style={[styles.input, styles.descriptionInput]}>
          <TextInput
            placeholder="Ex. I'm unable to log in with my credentials."
            value={problemDescription}
            onChangeText={setProblemDescription}
            placeholderTextColor={themeColors.textSecondary}
            multiline
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>How would you prefer to be contacted?</Text>
        <View style={styles.input}>
          <TextInput
            placeholder="Ex. Email, Phone call, Text message"
            value={contactMethod}
            onChangeText={setContactMethod}
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Please provide your contact information:
        </Text>
        <View style={styles.input}>
          <TextInput
            placeholder="Ex. john@example.com, 123-456-7890"
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleReportProblem}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Report Issue</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReportProblem;
