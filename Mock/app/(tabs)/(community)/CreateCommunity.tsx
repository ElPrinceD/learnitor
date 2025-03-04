import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import { useMutation } from "@tanstack/react-query";
import { createCommunity } from "../../../CommunityApiCalls";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocket } from "../../../webSocketProvider";

const CreateCommunity = () => {
  const { userToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { joinAndSubscribeToCommunity } = useWebSocket(); // Add WebSocket context

  const createCommunityMutation = useMutation({
    mutationFn: async ({ communityData, token }) => {
      console.log("Submitting Community Data:", communityData);
      const community = await createCommunity(communityData, token);
      return community;
    },
    onSuccess: async (communityData) => {
      await updateCommunityCache(communityData);
      await joinAndSubscribeToCommunity(communityData.id); // Subscribe to the new community
      navigation.goBack();
      router.setParams({ newCommunity: communityData }); // Pass new community data
      setErrorMessage(null);
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message || "Error creating community";
      console.error("Error creating community:", errorDetail);
      setErrorMessage(errorDetail);
    },
  });

  const handleSaveCommunity = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);

      if (imageUrl) {
        const fileInfo = await FileSystem.getInfoAsync(imageUrl);
        if (!fileInfo.exists) {
          throw new Error("Image file does not exist");
        }

        const fileName = imageUrl.split("/").pop() || "image.jpg";
        const fileType = fileName.split(".").pop() || "jpeg";
        const mimeType = `image/${fileType.toLowerCase() === "jpg" ? "jpeg" : fileType.toLowerCase()}`;

        const fileData = {
          uri: imageUrl,
          name: fileName,
          type: mimeType,
        } as any;

        formData.append("image_url", fileData);

        console.log("FormData contents:", {
          name,
          description,
          image: { uri: imageUrl, name: fileName, type: mimeType },
        });
      } else {
        console.log("FormData contents:", { name, description });
      }

      createCommunityMutation.mutate({
        communityData: formData,
        token: userToken?.token,
      });
    } catch (error) {
      console.error("Error creating community:", error);
      setErrorMessage("Failed to create community. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
        setImageUrl(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const isButtonDisabled = !name.trim();

  const updateCommunityCache = async (newCommunity) => {
    try {
      let communities = await AsyncStorage.getItem("communities");
      communities = communities ? JSON.parse(communities) : [];
      if (!communities.some((c) => c.id === newCommunity.id)) {
        communities.push(newCommunity);
        await AsyncStorage.setItem("communities", JSON.stringify(communities));
      }
    } catch (error) {
      console.error("Error updating community cache:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
      paddingTop: rV(10),
    },
    inputContainer: {
      marginVertical: rV(10),
    },
    input: {
      height: rV(50),
      borderRadius: 10,
      paddingHorizontal: rMS(15),
      color: themeColors.text,
      backgroundColor: themeColors.reverseText,
      marginBottom: rV(10),
    },
    buttonContainer: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    button: {
      width: rMS(150),
      paddingVertical: rV(15),
      borderRadius: 10,
      backgroundColor: isButtonDisabled ? themeColors.buttonDisabled : themeColors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    profilePictureContainer: {
      alignItems: "center",
      marginVertical: rV(2),
      paddingTop: rMS(30),
      position: "relative",
    },
    profilePicture: {
      width: rMS(100),
      height: rMS(100),
      borderRadius: 50,
      borderColor: themeColors.border,
      borderWidth: 1,
      backgroundColor: themeColors.background,
    },
    selectImageButton: {
      marginTop: rV(1),
      padding: rV(10),
      borderRadius: 10,
      alignItems: "center",
    },
    selectImageButtonText: {
      color: themeColors.tint,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    errorMessage: {
      color: themeColors.error,
      textAlign: "center",
      marginVertical: rV(10),
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{
              uri:
                imageUrl ||
                "https://img.freepik.com/free-vector/gradient-golden-linear-background_23-2148944136.jpg?t=st=1724077139~exp=1724080739~hmac=cae3beee0d078efb83e45041999354ce1a4ffacb8d08bb7ea3e13608b54d52cf&w=826",
            }}
            style={styles.profilePicture}
          />
          <TouchableOpacity style={styles.selectImageButton} onPress={pickImage}>
            <Text style={styles.selectImageButtonText}>Select Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Community name"
            placeholderTextColor={themeColors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { height: rV(100) }]}
            placeholder="Enter community description"
            placeholderTextColor={themeColors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveCommunity}
            disabled={isButtonDisabled}
          >
            {createCommunityMutation.isLoading ? (
              <ActivityIndicator color={themeColors.text} />
            ) : (
              <Text style={styles.buttonText}>Create Community</Text>
            )}
          </TouchableOpacity>
        </View>
        {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
      </ScrollView>
    </View>
  );
};

export default CreateCommunity;