import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  useColorScheme,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { useAuth } from "../../../components/AuthContext";
import * as ImagePicker from "expo-image-picker";
import ApiUrl from "../../../config";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import { useCache } from "../../../contexts/CacheContext"; // New import for caching
import AsyncStorage from "@react-native-async-storage/async-storage";
// import AppImage from "../../../components/AppImage"; // Commented out for profile page
import InAppBrowserLink from "../../../components/InAppBrowserLink";
import { useAlert } from "../../../contexts/AlertContext";
import { useErrorHandler } from "../../../hooks/useErrorHandler";

const Profile = () => {
  const { logout, userToken, userInfo, setUserInformation } = useAuth();
  const { clear } = useCache(); // Access clear from CacheContext
  const { showErrorAlert } = useAlert();
  const { handleError } = useErrorHandler();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [imageUpdateKey, setImageUpdateKey] = useState(0); // Track image updates
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | undefined>(
    userInfo?.user.profile_picture
  );

  const handleAccountSettings = () => {
    router.navigate("AccountSettings");
  };

  const clearUserDataCache = async () => {
    try {
      await clear(); // Replace sqliteClear with clear from CacheContext
    } catch (e) {
      console.error("Error clearing SQLite storage:", e);
    }
  };

  const clearUserTokenDataCache = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } catch (e) {
      console.error("Error clearing AsyncStorage:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await clearUserDataCache(); // Ensure this is awaited
      await clearUserTokenDataCache();
      logout();
      router.replace("Intro");
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleReportProblem = () => {
    router.navigate("ReportProblem");
  };

  const handleHelpCenter = () => {
    router.navigate("FAQScreen");
  };

  const handlePrivacySettings = () => {
    router.navigate("ConsentSettings");
  };

  const handleProfilePictureUpdate = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showErrorAlert(
          "Permission Required",
          "Permission to access media library is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const formData = new FormData();

        const fileName = uri.split("/").pop() || "image";
        const fileType = fileName.split(".").pop() || "jpg";

        formData.append("profile_picture", {
          uri,
          name: fileName,
          type: `image/${fileType}`,
        } as any);

        const config = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
            "Content-Type": "multipart/form-data",
          },
        };

        const response = await axios.patch(
          `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
          formData,
          config
        );

        if (userInfo) {
          // Clear current image first
          setCurrentImageUri(undefined);
          setImageLoading(true);
          setImageError(false);

          // Update user info
          setUserInformation({
            ...userInfo,
            user: {
              ...userInfo?.user,
              profile_picture: response.data.profile_picture,
            },
          });

          // Force image cache invalidation and set new URI
          setImageUpdateKey((prev) => prev + 1);

          // Set new image URI after a small delay to ensure the old one is cleared
          setTimeout(() => {
            setCurrentImageUri(
              `${
                response.data.profile_picture
              }?t=${Date.now()}&v=${Math.random()}`
            );
          }, 100);
        }
      }
    } catch (error) {
      handleError(error, "Update Failed");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
    imageLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      borderRadius: rMS(50),
      justifyContent: "center",
      alignItems: "center",
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
      marginTop: rV(30),
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
          <View key={`profile-image-${imageUpdateKey}`}>
            <Image
              source={{
                uri: currentImageUri,
              }}
              style={styles.profileImage}
              defaultSource={require("../../../assets/images/placeholder.png")}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => {
                setImageLoading(false);
                setImageError(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color={themeColors.tint} />
              </View>
            )}
          </View>
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
          <Text style={styles.optionText}>FAQs</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <TouchableOpacity style={styles.option} onPress={handlePrivacySettings}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={themeColors.icon}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Privacy Settings</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Terms</Text>
        <InAppBrowserLink url={`${ApiUrl}/terms-and-conditions/`}>
          <View style={styles.option}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={themeColors.icon}
              style={styles.icon}
            />
            <Text style={styles.optionText}>Terms of Use</Text>
          </View>
        </InAppBrowserLink>
        <InAppBrowserLink url={`${ApiUrl}/privacy-policy/`}>
          <View style={styles.option}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={themeColors.icon}
              style={styles.icon}
            />
            <Text style={styles.optionText}>Privacy</Text>
          </View>
        </InAppBrowserLink>
      </View>
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={themeColors.errorBackground}
            style={styles.icon}
          />
          <Text style={styles.optionText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;
