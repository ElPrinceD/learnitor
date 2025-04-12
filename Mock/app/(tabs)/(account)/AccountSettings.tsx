import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

const AccountSettings = () => {
  const { userInfo, userToken, setUserInfo } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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
    try {
      await axios.put(
        `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          dob: formData.dob,
        },
        config
      );

      if (userInfo) {
        setUserInfo({
          ...userInfo,
          user: {
            ...userInfo.user,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            dob: formData.dob,
            address: {
              ...userInfo.user.address,
              street_1: formData.street1,
              street_2: formData.street2,
              city: formData.city,
              region: formData.region,
              country: formData.country,
            },
          },
        });
      }
      Alert.alert("Success", "Your information has been updated.", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating information:", error);
      Alert.alert("Error", "There was an error updating your information.");
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
      flexGrow: 1,
      paddingHorizontal: rS(20),
      paddingTop: rV(20),
      alignItems: "center",
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
    },
    halfWidth: {
      width: "45%",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: rMS(10),
      paddingHorizontal: rS(10),
      marginBottom: rV(15),
      borderColor: themeColors.text,
      backgroundColor: themeColors.reverseText,
      width: "100%",
    },
    icon: {
      marginRight: rS(10),
      color: themeColors.textSecondary,
    },
    input: {
      flex: 1,
      height: rV(40),
      color: themeColors.text,
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
      paddingVertical: rV(10),
      backgroundColor: themeColors.background,
    },
    button: {
      borderRadius: rMS(10),
      paddingVertical: rV(10),
      alignItems: "center",
      backgroundColor: themeColors.buttonBackground,
      width: "100%",
    },
    buttonText: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Form fields scroll area */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          <DateSelector
            label="Date of Birth"
            initialDate={formData.dob}
            onDateChange={(selectedDate) => handleChange("dob", selectedDate)}
          />
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
      </View>
    </KeyboardAvoidingView>
  );
};

export default AccountSettings;
