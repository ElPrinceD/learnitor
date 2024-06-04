import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext"; // Adjust the path
import * as ImagePicker from 'expo-image-picker';
import ApiUrl from "../../../config.js";

const Profile = () => {
  const { logout, userToken, userInfo, setUserInfo } = useAuth(); // Accessing setUserInfo from AuthProvider

  const handleAccountSettings = () => {
    router.navigate("AccountSettings");
  };

  const handleLogout = async () => {
    try {
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
      router.replace("Intro");
    } catch (error) {
      console.error("Error logging out:", error);
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
    }
  };

  const handleReportProblem = () => {
    router.navigate("ReportProblem");
  };

  const handleHelpCenter = () => {
    // Handle navigation to Help Center screen
  };

  const handleProfilePictureUpdate = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const formData = new FormData();
        
        const fileName = uri.split('/').pop();
        const fileType = uri.split('.').pop();

        formData.append('profile_picture', {
          uri,
          name: fileName,
          type: `image/${fileType}`,
        });

        const config = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        };

        const response = await axios.patch(
          `${ApiUrl}:8000/api/update/user/${userInfo?.user.id}/`,
          formData,
          config
        );

        setUserInfo({ ...userInfo, user: { ...userInfo?.user, profile_picture: response.data.profile_picture } });
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {/* Profile Image */}
        <TouchableOpacity onPress={handleProfilePictureUpdate}>
          <Image
            source={{ uri: userInfo?.user.profile_picture }}
            style={styles.profileImage}
            onError={() => console.log("Error loading image")}
          />
          <Ionicons
            name="camera-outline"
            size={24}
            color="#000000"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>

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
    backgroundColor: "#ccc", // Add a background color for better visibility
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
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 4,
  },
});

export default Profile;
