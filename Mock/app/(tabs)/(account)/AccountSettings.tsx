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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";

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

  const handleChange = (name, value) => {
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

      await axios.put(
        `${ApiUrl}/api/update/user/address/`,
        {
          street_1: formData.street1,
          street_2: formData.street2,
          city: formData.city,
          region: formData.region,
          country: formData.country,
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
      Alert.alert("Success", "Your information has been updated.");
    } catch (error) {
      console.error("Error updating information:", error);
      Alert.alert("Error", "There was an error updating your information.");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    scrollViewContainer: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: rS(20),
      paddingTop: rV(20),
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(20),
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: rMS(10),
      paddingHorizontal: rS(10),
      marginBottom: rV(15),
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
      flex: 1,
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
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    halfWidth: {
      flex: 1,
      marginRight: rS(10),
    },
    button: {
      borderRadius: rMS(10),
      paddingVertical: rV(10),
      alignItems: "center",
      marginVertical: rV(20),
      backgroundColor: themeColors.buttonBackground,
    },
    buttonText: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
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
        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={rMS(18)}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Birth"
            value={formData.dob}
            onChangeText={(value) => handleChange("dob", value)}
            placeholderTextColor={themeColors.textSecondary}
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
        <Text style={styles.subTitle}>Address</Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Street 1"
                value={formData.street1}
                onChangeText={(value) => handleChange("street1", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Street 2"
                value={formData.street2}
                onChangeText={(value) => handleChange("street2", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => handleChange("city", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={rMS(18)}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Region"
                value={formData.region}
                onChangeText={(value) => handleChange("region", value)}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Ionicons
            name="location-outline"
            size={rMS(18)}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={formData.country}
            onChangeText={(value) => handleChange("country", value)}
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
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateInfo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Personal Info</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AccountSettings;
