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
} from "react-native";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rMS, rV } from "../../../constants/responsive";
import { SIZES } from "../../../constants/theme";
import { useMutation } from "@tanstack/react-query";
import { createCommunity } from "../../../CommunityApiCalls";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

const CreateCommunity = () => {
  const { userToken, userInfo } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const createCommunityMutation = useMutation({
    mutationFn: async ({ communityData, token }) => {
      console.log('Submitting Community Data:', communityData); // Debugging statement
      await createCommunity(communityData, token);
    },
    onSuccess: (communityData) => {
      router.navigate("CommunityScreen");
      router.setParams({ newCommunity: communityData });
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Error creating community");
    },
  });

  const handleSaveCommunity = () => {
    const data = {
      name,
      description,
      creator: userInfo?.user.id,
      image_url: profilePicture, // Ensure the field name matches what the API expects
    };

    console.log('Community Data:', data); // Log the data to verify

    createCommunityMutation.mutate({
      communityData: data,
      token: userToken?.token,
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    console.log('Image Picker Result:', result); // Log the result to verify

    if (!result.canceled && result.assets) {
      setProfilePicture(result.assets[0].uri); // Set the selected image URI
    }
  };

  const isButtonDisabled = !name.trim(); // Disable button if name is empty

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingHorizontal: rMS(20),
      paddingBottom: rV(20),
      paddingTop: rV(10),
    },
    header: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(20),
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
    label: {
      fontSize: SIZES.medium,
      marginBottom: rV(5),
      color: themeColors.textSecondary,
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
            source={{ uri: profilePicture || 'https://img.freepik.com/free-vector/gradient-golden-linear-background_23-2148944136.jpg?t=st=1724077139~exp=1724080739~hmac=cae3beee0d078efb83e45041999354ce1a4ffacb8d08bb7ea3e13608b54d52cf&w=826' }} 
            style={styles.profilePicture}
          />
          <TouchableOpacity
            style={styles.selectImageButton}
            onPress={pickImage}
          >
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
        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default CreateCommunity;
