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
  Alert,
  Switch,
} from "react-native";
import * as FileSystem from 'expo-file-system';
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

type RouteParams = {
  id: string;
};

const EditCommunityScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;
  const { userToken } = useAuth();
  const {getItem} = useCache();
  const { socket, isConnected, sendMessage } = useWebSocket(); // Use WebSocket context
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState<string>("");
  const [currentCommunityData, setCurrentCommunityData] = useState<any | null>(null);
  const [description, setDescription] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityDetails = await getItem(`community_${id}`);
        if (communityDetails) {
          const parsedCommunity = JSON.parse(communityDetails); // Parse the string into an object
          setCommunity(parsedCommunity); // Set the parsed object
          setCurrentCommunityData(parsedCommunity);
          setName(parsedCommunity.name);
          setDescription(parsedCommunity.description);
          setProfilePicture(parsedCommunity.image_url);
          setIsPublic(parsedCommunity.is_public);
        }
   
        else if (userToken) {
          const data = await getCommunityDetails(id, userToken.token);
          setCommunity(data);
          setName(data.name);
          setDescription(data.description);
          setProfilePicture(data.image_url);
          setIsPublic(data.is_public);
        }
      } catch (error) {
        console.error("Failed to fetch community details:", error);
      }
    };
  
    fetchCommunity();
  }, [id, userToken, getItem]);

  const getChangedFields = (original: any, updated: any) => {
    const changes: any = {};
    for (const key in updated) {
      if (updated[key] !== original[key]) {
        changes[key] = updated[key];
      }
    }
    return changes;
  };



const handleSave = async () => {
  if (!userToken || !community || !isConnected || !socket) {
    Alert.alert("Error", "Not connected or missing authentication.");
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

      const fileName = profilePicture.split("/").pop() || "image.jpg";
      const fileType = fileName.split(".").pop() || "jpeg";
      const mimeType = `image/${fileType.toLowerCase() === "jpg" ? "jpeg" : fileType.toLowerCase()}`;

      const fileData = {
        uri: profilePicture,
        name: fileName,
        type: mimeType,
      } as any;
      communityData.image_url = fileData; 
    } else if (profilePicture) {
      communityData.image_url = profilePicture;
    }

    // Send only the changed data
    const changedData = getChangedFields(currentCommunityData, communityData);
    console.log("Changed data:", changedData);

    if (Object.keys(changedData).length > 0) {
      sendMessage({
        type: 'update_community',
        community_id: id,
        community: changedData, // Send only the changed fields
      });

      console.log('Update community request sent for community ID:', id);
    } else {
      console.log('No changes detected, skipping update.');
    }
  } catch (error) {
    console.error("Failed to save community:", error);
    Alert.alert("Error", "Failed to save community.");
  }
};

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={[styles.doneButton, { color: themeColors.tint }]} onPress={handleSave}>
          Done
        </Text>
      ),
      headerLeft: () => (
        <Text style={[styles.cancelButton, { color: themeColors.textSecondary }]} onPress={() => navigation.goBack()}>
          Cancel
        </Text>
      ),
    });
  }, [navigation, handleSave, themeColors]);

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
      backgroundColor: 'lightgray',
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
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{ uri: profilePicture || 'https://img.freepik.com/free-vector/gradient-golden-linear-background_23-2148944136.jpg' }}
            style={[styles.profilePicture, { borderColor: themeColors.border }]}
          />
          <TouchableOpacity style={[styles.selectImageButton]} onPress={pickImage}>
            <Text style={[styles.selectImageButtonText, { color: themeColors.tint }]}>Change Picture</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.reverseText, color: themeColors.text }]}
            placeholder="Community Name"
            placeholderTextColor={themeColors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.descriptionInput, { backgroundColor: themeColors.reverseText, color: themeColors.text }]}
            placeholder="Description"
            placeholderTextColor={themeColors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        <View style={styles.sectionItem}>
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color={themeColors.text}
            style={styles.icon}
          />
          <View style={styles.sectionTextContainer}>
            <Text
              style={[styles.sectionTitle, { color: themeColors.text }]}
            >
              Lock chat
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={() => setIsPublic((prev) => !prev)}
            trackColor={{ true: themeColors.tint, false: "#999" }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default EditCommunityScreen;