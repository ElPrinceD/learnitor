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
import { useRoute, useNavigation } from "@react-navigation/native";
import { getCommunityDetails } from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../contexts/webSocketProvider"; // Import WebSocket context
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
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
  const { socket, isConnected, sendMessage } = useWebSocket(); // Use WebSocket context
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        if (userToken) {
          const data = await getCommunityDetails(id, userToken.token);
          setCommunity(data);
          setName(data.name);
          setDescription(data.description);
          setProfilePicture(data.image_url);
          setIsPublic(data.is_public);
        }
      } catch (error) {
        console.error("Failed to load community details:", error);
      }
    };

    fetchCommunity();
  }, [id, userToken]);

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
        communityData.image_url = {
          uri: profilePicture,
        };
      } else if (profilePicture) {
        communityData.image_url = profilePicture;
      }

      // Send WebSocket message
      sendMessage({
        type: 'update_community',
        community_id: id,
        community: communityData,
      });

      // Listen for success/error response
      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'community_updated' && data.community.id.toString() === id) {
            console.log('Community updated successfully:', data.community);
            router.dismiss(1); // Navigate back on success
          } else if (data.type === 'error' && data.message.includes('community')) {
            console.error('Community update error:', data.message);
            Alert.alert("Error", data.message || "Failed to update community.");
          }
        } catch (error) {
          console.error('Error processing WebSocket response:', error);
        }
      };

      socket.addEventListener('message', handleResponse);

      // Cleanup listener after a timeout or on component unmount
      const timeout = setTimeout(() => {
        socket.removeEventListener('message', handleResponse);
        Alert.alert("Error", "No response from server. Please try again.");
      }, 5000); // 5 seconds timeout

      return () => {
        clearTimeout(timeout);
        socket.removeEventListener('message', handleResponse);
      };
    } catch (error) {
      console.error("Failed to update community details:", error);
      Alert.alert("Error", "Failed to save changes.");
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