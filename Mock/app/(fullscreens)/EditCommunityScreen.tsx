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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getCommunityDetails, updateCommunity } from "../../CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../webSocketProvider";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import * as ImagePicker from "expo-image-picker";
import { rMS } from "../../constants";
import { router } from "expo-router";

type RouteParams = {
  id: string;
};

const EditCommunityScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;
  const { userToken } = useAuth();
  const { sqliteSetItem, sqliteGetItem } = useWebSocket();
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
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
          setProfilePicture(data.image_url);
        }
      } catch (error) {
        console.error("Failed to load community details:", error);
      }
    };

    fetchCommunity();
  }, [id, userToken]);

  const handleSave = async () => {
    if (userToken && community) {
      try {
        const updateData: any = { name, description };
        let finalImageUrl = profilePicture;
  
        if (profilePicture && !profilePicture.startsWith("http")) {
          const uriParts = profilePicture.split(".");
          const fileType = uriParts[uriParts.length - 1];
          updateData.image_url = {
            uri: profilePicture,
            name: `photo_${id}_${Date.now()}.${fileType}`, // Unique filename
            type: `image/${fileType}`,
          };
        }
  
        const formData = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          formData.append(key, value);
        });
  
        const response = await updateCommunity(id, formData, userToken.token);
  
        const communityId = id.toString(); // Standardize as string
        const updatedCommunity = {
          ...community,
          id: parseInt(communityId),
          name,
          description,
          image_url: response.image_url || finalImageUrl || community.image_url,
          created_by: community.created_by,
          created_at: community.created_at,
          members: community.members || [],
          shareable_link: community.shareable_link,
        };
  
        // Update individual community cache
        await sqliteSetItem(`community_${communityId}`, JSON.stringify(updatedCommunity));
        // Update communities list cache
        const cachedCommunitiesRaw = await sqliteGetItem("communities");
        let cachedCommunities = cachedCommunitiesRaw ? JSON.parse(cachedCommunitiesRaw) : [];
        const communityIndex = cachedCommunities.findIndex((comm: Community) => comm.id.toString() === communityId);
        if (communityIndex !== -1) {
          cachedCommunities[communityIndex] = updatedCommunity;
        } else {
          cachedCommunities.push(updatedCommunity);
        }
        await sqliteSetItem("communities", JSON.stringify(cachedCommunities));
  
        router.dismiss(1);
      } catch (error) {
        console.error("Failed to update community details:", error);
        Alert.alert("Error", "Failed to save changes.");
      }
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