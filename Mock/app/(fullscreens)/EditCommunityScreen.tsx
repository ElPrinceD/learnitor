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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getCommunityDetails, updateCommunity } from "../../CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import * as ImagePicker from "expo-image-picker";
import { rMS } from "../../constants";

type RouteParams = {
  id: string; // Community ID
};

const EditCommunityScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;
  const { userToken } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
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
          setProfilePicture(data.image_url); // Set the current image URL
        }
      } catch (error) {
        console.error("Failed to load community details:", error);
      }
    };

    fetchCommunity();
  }, [id, userToken]);

  const handleSave = async () => {
    if (userToken) {
      try {
        await updateCommunity(id, { name, description, image_url: profilePicture }, userToken.token);
        navigation.goBack(); // Go back to the previous screen after saving
      } catch (error) {
        console.error("Failed to update community details:", error);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setProfilePicture(result.assets[0].uri); // Set the selected image URI
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

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{ uri: profilePicture || 'https://img.freepik.com/free-vector/gradient-golden-linear-background_23-2148944136.jpg' }}
            style={[styles.profilePicture, { borderColor: themeColors.border }]}
          />
          <TouchableOpacity
            style={[styles.selectImageButton]}
            onPress={pickImage}
          >
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
      </ScrollView>
    </View>
  );
};

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
});

export default EditCommunityScreen;
