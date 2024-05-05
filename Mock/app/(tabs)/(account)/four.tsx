import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext"; // Adjust the path

import ApiUrl from "../../../config.js";

const Profile = () => {
  const { logout, userToken, userInfo } = useAuth(); // Accessing login function from AuthProvider

  const handleAccountSettings = () => {
    router.navigate("AccountSettings");
  };

  const handleLogout = async () => {
    try {
      // Make a POST request to your logout endpoint
      await axios.post(
        `${ApiUrl}:8000/api/logout/`,
        {},
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      logout();
      router.navigate("Intro");
    } catch (error) {
      console.error("Error logging out:", error);
      // Handle error scenarios, such as displaying an error message to the user
    }
  };

  const handleTerms = () => {
    // Handle navigation to Terms screen
  };

  const handlePrivacy = () => {
    // Handle navigation to Privacy screen
  };
  const handleTellAFriend = async () => {
    try {
      const shareOptions = {
        message: "Check out this cool app Buddy!",
        url: "https://your-app-url.com",
        title: "Share with Friends",
      };
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        console.log("App shared successfully");
      } else if (result.action === Share.dismissedAction) {
        console.log("Share operation dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Handle error scenarios, such as displaying an error message to the user
    }
  };

  const handleReportProblem = () => {
    // Handle navigation to Report Problem screen
  };

  const handleHelpCenter = () => {
    // Handle navigation to Help Center screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {/* Profile Image */}
        <Image
          source={require("../../../assets/images/profile.png")}
          style={styles.profileImage}
        />

        {/* Full Name */}
        <Text style={styles.fullName}>
          {userInfo?.user.first_name} {userInfo?.user.last_name}
        </Text>
      </View>

      <TouchableOpacity style={styles.option} onPress={handleAccountSettings}>
        <Ionicons
          name="settings-outline"
          size={24}
          color="#767575"
          style={styles.icon}
        />
        <Text style={[styles.optionText, styles.textColor, styles.slenderText]}>
          Account Settings
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleReportProblem}>
        <Ionicons
          name="alert-circle-outline"
          size={24}
          color="#767575"
          style={styles.icon}
        />
        <Text style={[styles.optionText, styles.textColor, styles.slenderText]}>
          Report a Problem
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleTellAFriend}>
        <Ionicons
          name="share-social-outline"
          size={24}
          color="#767575"
          style={styles.icon}
        />
        <Text style={[styles.optionText, styles.textColor, styles.slenderText]}>
          Tell a Friend
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={24}
          color="#767575"
          style={styles.icon}
        />
        <Text style={[styles.optionText, styles.textColor, styles.slenderText]}>
          Log Out
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomOptions}>
        <TouchableOpacity style={styles.bottomOption} onPress={handleTerms}>
          <Text style={[styles.bottomOptionText, styles.textColor]}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomOption} onPress={handlePrivacy}>
          <Text style={[styles.bottomOptionText, styles.textColor]}>
            Privacy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomOption}
          onPress={handleHelpCenter}
        >
          <Text style={[styles.bottomOptionText, styles.textColor]}>
            Help Center
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  fullName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 18,
    marginLeft: 10,
  },
  bottomOptions: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
  },
  bottomOption: {
    marginHorizontal: 8,
  },
  bottomOptionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textColor: {
    color: "#767575",
  },
  slenderText: {
    fontWeight: "300",
  },
  icon: {
    marginRight: 10,
  },
});

export default Profile;
