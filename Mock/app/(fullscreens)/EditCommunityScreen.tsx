import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Switch,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getCommunityDetails } from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../contexts/webSocketProvider"; // Import WebSocket context
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import { useCache } from "../../contexts/CacheContext";
import * as ImagePicker from "expo-image-picker";
import { rMS, rS, rV, SIZES } from "../../constants";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../contexts/AlertContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";

type RouteParams = {
  id: string;
};

const EditCommunityScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;
  const { userToken } = useAuth();
  const { getItem } = useCache();
  const { socket, isConnected, sendMessage } = useWebSocket(); // Use WebSocket context
  const { showErrorAlert, showSuccessAlert, showAlert } = useAlert();
  const { handleError } = useErrorHandler();
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState<string>("");
  const [currentCommunityData, setCurrentCommunityData] = useState<any | null>(
    null
  );
  const [description, setDescription] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true); // Default to true, will be updated when data loads
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityDetails = await getItem(`community_${id}`);
        if (communityDetails) {
          const parsedCommunity = JSON.parse(communityDetails);
          setCommunity(parsedCommunity);
          setCurrentCommunityData(parsedCommunity);
          setName(parsedCommunity.name);
          setDescription(parsedCommunity.description);
          setProfilePicture(parsedCommunity.image_url);
          // Ensure is_public is properly set, default to true if undefined
          setIsPublic(
            parsedCommunity.is_public !== undefined
              ? parsedCommunity.is_public
              : true
          );
        } else if (userToken) {
          const data = await getCommunityDetails(id, userToken.token);
          setCommunity(data);
          setName(data.name);
          setDescription(data.description);
          setProfilePicture(data.image_url);
          // Ensure is_public is properly set, default to true if undefined
          setIsPublic(data.is_public !== undefined ? data.is_public : true);
        }
      } catch (error) {
        console.error("Failed to fetch community details:", error);
      }
    };

    fetchCommunity();
  }, [id, userToken, getItem]);

  // Update getChangedFields to handle image_url comparison
  const getChangedFields = (original: any, updated: any) => {
    const changes: any = {};
    for (const key in updated) {
      if (key === "image_url") {
        // Compare image_url specifically
        const originalImage = original[key] || null;
        const updatedImage = updated[key];
        if (
          typeof updatedImage === "object" &&
          updatedImage.uri !== originalImage
        ) {
          changes[key] = updatedImage;
        } else if (
          typeof updatedImage === "string" &&
          updatedImage !== originalImage
        ) {
          changes[key] = updatedImage;
        }
      } else if (updated[key] !== original[key]) {
        changes[key] = updated[key];
      }
    }
    return changes;
  };

  const handleSave = async () => {
    if (!userToken || !community || !isConnected || !socket) {
      showErrorAlert("Error", "Not connected or missing authentication.");
      return;
    }

    try {
      const communityData: any = {
        name,
        description,
        is_public: isPublic,
      };

      // Handle image if it's a local URI (not a remote URL)
      if (profilePicture && !profilePicture.startsWith("http")) {
        const fileInfo = await FileSystem.getInfoAsync(profilePicture);
        if (!fileInfo.exists) {
          throw new Error("Image file does not exist");
        }

        // Read the file and convert to Base64
        const base64 = await FileSystem.readAsStringAsync(profilePicture, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fileName = profilePicture.split("/").pop() || "image.jpg";
        const fileType = fileName.split(".").pop() || "jpeg";
        const mimeType = `image/${
          fileType.toLowerCase() === "jpg" ? "jpeg" : fileType.toLowerCase()
        }`;

        // Create Base64 data URI
        const dataUri = `data:${mimeType};base64,${base64}`;

        // Send as a dictionary with uri key
        communityData.image_url = {
          uri: dataUri,
        };
      } else if (profilePicture) {
        communityData.image_url = profilePicture; // Remote URL
      }

      // Send only the changed data
      const changedData = getChangedFields(currentCommunityData, communityData);
      console.log("Current community data:", currentCommunityData);
      console.log("New community data:", communityData);
      console.log("Changed data:", changedData);
      console.log("isPublic value:", isPublic);

      if (Object.keys(changedData).length > 0) {
        sendMessage({
          type: "update_community",
          community_id: id,
          community: changedData, // Send only the changed fields
        });

        router.back();
        showSuccessAlert("Success", "Community updated successfully.");
      } else {
        showAlert("Info", "No changes detected.");
      }
    } catch (error) {
      handleError(error, "Save Failed");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      try {
        const { uri } = result.assets[0];

        // Compress the image
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [],
          {
            compress: 0.5, // 0.5 represents 50% compression (adjust as needed)
            format: ImageManipulator.SaveFormat.JPEG, // You can choose JPEG, PNG, etc.
          }
        );

        // Set the compressed image as the profile picture
        setProfilePicture(compressedImage.uri);
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text
          style={[styles.doneButton, { color: themeColors.tint }]}
          onPress={handleSave}
        >
          Done
        </Text>
      ),
      headerLeft: () => (
        <Text
          style={[styles.cancelButton, { color: themeColors.textSecondary }]}
          onPress={() => navigation.goBack()}
        >
          Cancel
        </Text>
      ),
    });
  }, [navigation, handleSave, themeColors, isPublic]); // Added isPublic to dependencies

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    profilePictureContainer: {
      alignItems: "center",
      marginVertical: 20,
      paddingTop: 10,
      position: "relative",
    },
    profilePicture: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1,
      backgroundColor: "lightgray",
    },
    selectImageButton: {
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    selectImageButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    inputContainer: {
      marginVertical: 10,
    },
    input: {
      height: 50,
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 10,
    },
    descriptionInput: {
      height: 100,
    },
    doneButton: {
      fontSize: rMS(19),
      fontWeight: "bold",
      marginRight: 10,
    },
    cancelButton: {
      fontSize: rMS(19),
      marginLeft: 10,
    },
    sectionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(10),
      borderBottomWidth: rS(1),
      borderBottomColor: themeColors.secondaryBackground,
      paddingHorizontal: rS(16),
    },
    icon: { marginRight: rS(10) },
    sectionTextContainer: { flex: 1 },
    sectionTitle: { fontSize: SIZES.medium, color: themeColors.text },
    sectionValue: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(16),
      marginTop: rV(30),
      marginBottom: rV(10),
    },
    sectionHeaderText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    infoRow: {
      paddingHorizontal: rS(16),
      marginTop: rV(20),
    },
    infoLeft: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(5),
    },
    infoTitle: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: themeColors.text,
    },
    infoSubtitle: {
      fontSize: SIZES.small,
      lineHeight: rV(20),
      color: themeColors.textSecondary,
    },
  });

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{
              uri:
                profilePicture ||
                "https://img.freepik.com/free-vector/gradient-golden-linear-background_23-2148944136.jpg",
            }}
            style={[styles.profilePicture, { borderColor: themeColors.border }]}
          />
          <TouchableOpacity
            style={[styles.selectImageButton]}
            onPress={pickImage}
          >
            <Text
              style={[
                styles.selectImageButtonText,
                { color: themeColors.tint },
              ]}
            >
              Change Picture
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.reverseText,
                color: themeColors.text,
              },
            ]}
            placeholder="Community Name"
            placeholderTextColor={themeColors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
              {
                backgroundColor: themeColors.reverseText,
                color: themeColors.text,
              },
            ]}
            placeholder="Description"
            placeholderTextColor={themeColors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        <View style={styles.sectionItem}>
          <Ionicons
            name="search-outline"
            size={24}
            color={themeColors.text}
            style={styles.icon}
          />
          <View style={styles.sectionTextContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Channel Visibility
            </Text>
            <Text
              style={[
                styles.sectionValue,
                { color: themeColors.textSecondary },
              ]}
            >
              {isPublic
                ? "Public - Anyone can find and join"
                : "Private - Hidden from search, invite-only"}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(value) => {
              console.log("Toggle changed from", isPublic, "to", value);
              setIsPublic(value);
            }}
            trackColor={{ true: themeColors.tint, false: "#999" }}
            thumbColor={themeColors.background}
          />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={themeColors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>
              Privacy Settings
            </Text>
          </View>
          <Text
            style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}
          >
            {isPublic
              ? "Public channels appear in search results and can be joined by anyone. Private channels are hidden from search and require invitation links to join."
              : "Private channels are hidden from global search and can only be joined through invitation links shared by existing members."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditCommunityScreen;
