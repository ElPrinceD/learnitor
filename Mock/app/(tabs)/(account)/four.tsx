import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Alert,
  useColorScheme,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext";
import * as ImagePicker from "expo-image-picker";
import ApiUrl from "../../../config";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const { logout, userToken, userInfo, setUserInfo } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleAccountSettings = () => {
    router.navigate("AccountSettings");
  };
  const clearUserDataCache = async () => {
    try {
      await AsyncStorage.clear();
      console.log("All AsyncStorage data cleared.");
    } catch (e) {
      console.error("Error clearing AsyncStorage:", e);
    }
  };

  const handleLogout = async () => {
    try {
      // await axios.post(
      //   `${ApiUrl}/api/logout/`,
      //   {},
      //   {
      //     headers: {
      //       Authorization: `Token ${userToken?.token}`,
      //     },
      //   }
      // );
      clearUserDataCache();
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access media library is required!");
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

        const fileName = uri.split("/").pop();
        const fileType = uri.split(".").pop();

        // Create form data for Imgur upload
        formData.append("image", {
          uri,
          name: fileName,
          type: `image/${fileType}`,
        });

        const imgurConfig = {
          headers: {
            Authorization: "5fa58c7d05ea125", // Replace with your Imgur client ID
            "Content-Type": "multipart/form-data",
          },
        };

        // Upload image to Imgur
        const imgurResponse = await axios.post(
          "https://api.imgur.com/3/upload",
          formData,
          imgurConfig
        );

        const imgurLink = imgurResponse.data.data.link;

        // Update user profile with Imgur image link
        const userUpdateData = new FormData();
        userUpdateData.append("profile_picture", imgurLink); // Send URL to the backend

        const userUpdateConfig = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
            "Content-Type": "multipart/form-data",
          },
        };

        const response = await axios.patch(
          `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
          { profile_picture: imgurLink },
          userUpdateConfig
        );

        // Update user info in frontend state
        if (userInfo) {
          setUserInfo({
            ...userInfo,
            user: {
              ...userInfo?.user,
              profile_picture: response.data.profile_picture,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // flexGrow: 1,
      paddingTop: rV(18),
      backgroundColor: themeColors.background,
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: rS(25),
      paddingBottom: rV(25),
    },
    profileImageContainer: {
      position: "relative",
    },
    profileImage: {
      width: 115,
      height: 115,
      borderRadius: rMS(50),
      backgroundColor: "#ccc",
    },
    cameraIcon: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: themeColors.background,
      borderRadius: 15,
      padding: 6,
    },
    title: {
      marginLeft: rS(20),
      flex: 1,
    },
    fullName: {
      color: themeColors.text,
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
    },
    email: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
    },
    editProfileButton: {
      marginTop: rV(10),
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 5,
      paddingVertical: rV(5),
      paddingHorizontal: rS(20),
      backgroundColor: "transparent",
      alignItems: "center",
    },
    editProfileButtonText: {
      color: themeColors.text,

      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    bottomContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rS(25),
      paddingTop: rV(10),
    },
    sectionTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(10),
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(15),
      paddingHorizontal: rS(10),
      backgroundColor: themeColors.card,
      borderRadius: 10,
      marginBottom: rV(10),
    },
    optionText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      marginLeft: rS(10),
    },
    icon: {
      marginRight: rS(10),
    },
    logoutContainer: {
      marginTop: "auto",
      paddingHorizontal: rS(25),
      paddingBottom: rV(25),
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <TouchableOpacity
          onPress={handleProfilePictureUpdate}
          style={styles.profileImageContainer}
        >
          <Image
            source={{ uri: userInfo?.user.profile_picture }}
            style={styles.profileImage}
            onError={() => console.log("Error loading image")}
          />
          <Ionicons
            name="camera-outline"
            size={SIZES.large}
            color={themeColors.icon}
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
        <View style={styles.title}>
          <Text style={styles.fullName}>
            {userInfo?.user.first_name} {userInfo?.user.last_name}
          </Text>
          <Text style={styles.email}>{userInfo?.user.email}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleAccountSettings}
          >
            <Text style={styles.editProfileButtonText}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={SIZES.medium}
                color={themeColors.text}
              />{" "}
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.option} onPress={handleReportProblem}>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Report a Problem</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleHelpCenter}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Help Center</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Terms</Text>
        <TouchableOpacity style={styles.option} onPress={handleTerms}>
          <Ionicons
            name="document-text-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Terms of Use</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handlePrivacy}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Privacy</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;
