import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import DateSelector from "../../../components/DateSelector"; // DateSelector component import
import { router } from "expo-router"; // Import the router from Expo Router
import { useAlert } from "../../../contexts/AlertContext";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AccountSettings = () => {
  const { userInfo, userToken, setUserInformation, setUserInfo, logout } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { showSuccessAlert, showDeleteAlert } = useAlert();
  const { handleError } = useErrorHandler();

  const [formData, setFormData] = useState({
    firstName: userInfo?.user.first_name || "",
    lastName: userInfo?.user.last_name || "",
    dob: userInfo?.user.dob || "",
    email: userInfo?.user.email || "",
    street1: userInfo?.user?.address?.street_1 || "",
    street2: userInfo?.user?.address?.street_2 || "",
    city: userInfo?.user?.address?.city || "",
    region: userInfo?.user?.address?.region || "",
    country: userInfo?.user?.address?.country || "",
    instituteName: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdateInfo = async () => {
    setLoading(true);

    const config = {
      headers: {
        Authorization: `Token ${userToken?.token}`,
      },
    };

    // Build only fields that were provided
    const updatedFields = {
      ...(formData.firstName && { first_name: formData.firstName }),
      ...(formData.lastName && { last_name: formData.lastName }),
      ...(formData.email && { email: formData.email }),
      ...(formData.dob && { dob: formData.dob }),
    };

    try {
      await axios.put(
        `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
        updatedFields,
        config
      );

      if (userInfo) {
        const updatedUser = {
          ...userInfo.user,
          ...(formData.firstName && { first_name: formData.firstName }),
          ...(formData.lastName && { last_name: formData.lastName }),
          ...(formData.email && { email: formData.email }),
          ...(formData.dob && { dob: formData.dob }),
          address: {
            ...userInfo.user.address,
            ...(formData.street1 && { street_1: formData.street1 }),
            ...(formData.street2 && { street_2: formData.street2 }),
            ...(formData.city && { city: formData.city }),
            ...(formData.region && { region: formData.region }),
            ...(formData.country && { country: formData.country }),
          },
        };

        setUserInformation({
          ...userInfo,
          user: updatedUser,
        });
        setUserInfo({
          ...userInfo,
          user: updatedUser,
        });
      }

      showSuccessAlert("Success", "Your information has been updated.", () => {
        router.back();
      });
    } catch (error) {
      handleError(error, "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    showDeleteAlert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      async () => {
        setLoading(true);
        
        const config = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        };

        try {
          await axios.delete(`${ApiUrl}/api/delete-account/`, config);
          
          // Clear user data
          await AsyncStorage.multiRemove(["token", "user"]);
          
          // Logout and redirect
          logout();
          router.replace("/(verification)/Intro");
        } catch (error) {
          handleError(error, "Delete Account Failed");
          setLoading(false);
        }
      },
      () => {
        // onCancel - do nothing, alert will close automatically
      },
      "Delete", // deleteText
      "Cancel"  // cancelText
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: rS(20),
      paddingTop: rV(20),
      paddingBottom: rV(20),
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(20),
      alignSelf: "flex-start",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: rS(10),
    },
    halfWidth: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: rMS(10),
      paddingHorizontal: rS(12),
      paddingVertical: rV(2),
      marginBottom: rV(15),
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
      width: "100%",
      minHeight: rV(44),
    },
    icon: {
      marginRight: rS(10),
      color: themeColors.textSecondary,
    },
    input: {
      flex: 1,
      height: rV(40),
      color: themeColors.text,
      fontSize: SIZES.medium,
    },
    dateSelectorWrapper: {
      flex: 1,
      marginLeft: rS(0),
    },
    subTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginTop: rV(20),
      marginBottom: rV(10),
      alignSelf: "flex-start",
    },
    footer: {
      paddingHorizontal: rS(20),
      paddingVertical: rV(15),
      backgroundColor: themeColors.background,
    },
    button: {
      borderRadius: rMS(10),
      paddingVertical: rV(12),
      alignItems: "center",
      backgroundColor: themeColors.buttonBackground,
      width: "100%",
    },
    buttonText: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    deleteButton: {
      marginTop: rV(10),
      backgroundColor: themeColors.errorBackground || "#DC2626",
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Form fields scroll area */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Personal Info</Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={formData.firstName}
                onChangeText={(value) => handleChange("firstName", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={formData.lastName}
                onChangeText={(value) => handleChange("lastName", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Replace DOB TextInput with DateSelector */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={rMS(18)}
            style={styles.icon}
          />
          <View style={styles.dateSelectorWrapper}>
            <DateSelector
              label="Date of Birth"
              initialDate={formData.dob}
              onDateChange={(selectedDate) => handleChange("dob", selectedDate)}
              minDate={false}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={rMS(18)} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(value) => handleChange("email", value)}
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        <Text style={styles.subTitle}>Institution Info</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="school-outline" size={rMS(18)} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="School Name"
            value={formData.instituteName}
            onChangeText={(value) => handleChange("instituteName", value)}
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>
      </ScrollView>

      {/* Sticky footer containing the update button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateInfo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AccountSettings;
