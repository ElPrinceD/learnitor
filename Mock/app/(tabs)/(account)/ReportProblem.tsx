import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import * as Device from "expo-device";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import { useAlert } from "../../../contexts/AlertContext";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import CustomPicker from "../../../components/CustomPicker";
import GameButton from "../../../components/GameButton";
import { createIssueReport } from "../../../services/IssueReportApiCalls";

const ReportProblem: React.FC = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { userToken, userInfo } = useAuth();
  const { showSuccessAlert } = useAlert();
  const { handleError } = useErrorHandler();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Form options
  const categoryOptions = [
    "Bug",
    "Feature Request",
    "UI/UX Issue",
    "Performance Issue",
    "Security Issue",
    "Other",
  ];

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim())
      newErrors.title = "Please provide a title for your issue";
    if (!description.trim())
      newErrors.description = "Please describe what's happening";
    if (!category)
      newErrors.category = "Please select what type of issue this is";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReportProblem = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Map display names to backend values
      const categoryMapping: { [key: string]: string } = {
        Bug: "bug",
        "Feature Request": "feature_request",
        "UI/UX Issue": "ui_issue",
        "Performance Issue": "performance",
        "Security Issue": "security",
        Other: "other",
      };

      // Get device information automatically
      const deviceInfo = {
        os: Platform.OS,
        osVersion: Platform.Version,
        deviceName: Device.deviceName || "Unknown Device",
        deviceType: Device.deviceType || "Unknown",
        brand: Device.brand || "Unknown",
        modelName: Device.modelName || "Unknown Model",
      };

      // Create JSON data matching backend expectations
      const issueData = {
        title: title,
        description: description,
        category: categoryMapping[category] || "other",
        priority: "medium", // Default priority for customer reports
        // Optional fields - we'll add these later when we expand the form
        steps_to_reproduce: "",
        expected_behavior: "",
        actual_behavior: "",
        environment: `${deviceInfo.os} ${deviceInfo.osVersion}`,
        device_info: `${deviceInfo.brand} ${deviceInfo.modelName} (${deviceInfo.deviceType})`,
      };

      // Send issue report to backend
      const response = await createIssueReport(issueData, userToken?.token);

      showSuccessAlert("Success", "Your issue has been reported successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
    } catch (error: any) {
      // Provide more specific error messages
      if (error.response?.status === 401) {
        handleError(error, "Please log in again to continue.");
      } else if (error.response?.status >= 500) {
        handleError(error, "Server error. Please try again later.");
      } else {
        handleError(
          error,
          "Failed to submit report. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      padding: rS(20),
    },
    section: {
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: rMS(12),
      padding: rV(16),
      marginBottom: rV(16),
    },
    sectionTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(12),
    },
    inputContainer: {
      marginBottom: rV(16),
    },
    label: {
      fontSize: SIZES.medium,
      marginBottom: rV(6),
      color: themeColors.text,
      fontWeight: "600",
    },
    required: {
      color: themeColors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.textSecondary,
      borderRadius: rMS(8),
      padding: rS(12),
      backgroundColor: themeColors.background,
      color: themeColors.text,
      fontSize: SIZES.medium,
    },
    multilineInput: {
      height: rV(100),
      textAlignVertical: "top",
    },
    errorText: {
      color: "#ff4444",
      fontSize: SIZES.small,
      marginTop: rV(4),
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    button: {
      width: "100%",
      paddingVertical: rV(10),
      borderRadius: 10,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.textSecondary,
      borderRadius: rMS(8),
      backgroundColor: themeColors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* What's the Problem Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's the Problem?</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              What's happening? <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., App keeps crashing when I try to login"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={themeColors.textSecondary}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Tell us more <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe what's happening in detail. When does it occur? What were you trying to do?"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={themeColors.textSecondary}
              multiline
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              What type of issue is this? <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <CustomPicker
                label=""
                options={categoryOptions}
                selectedValue={category}
                onValueChange={setCategory}
              />
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          {(!title.trim() || !description.trim() || !category) && (
            <Text
              style={[
                styles.label,
                {
                  marginBottom: rV(8),
                  fontSize: SIZES.small,
                  color: themeColors.textSecondary,
                  textAlign: "center",
                },
              ]}
            >
              Fill Required Fields
            </Text>
          )}
          <GameButton
            onPress={handleReportProblem}
            title={loading ? "Sending..." : "Send Report"}
            style={[
              styles.button,
              loading || !title.trim() || !description.trim() || !category
                ? { opacity: 0.6 }
                : {},
            ]}
            disabled={
              loading || !title.trim() || !description.trim() || !category
            }
          >
            {loading && <ActivityIndicator color="#fff" />}
          </GameButton>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportProblem;
