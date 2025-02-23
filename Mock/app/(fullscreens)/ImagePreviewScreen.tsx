import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useWebSocket } from "../../webSocketProvider";
import { useAuth } from "../../components/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImageEditor from "expo-image-editor";

const ImagePreviewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [images, setImages] = useState<string[]>(JSON.parse(route.params.uris));
  const [caption, setCaption] = useState("");
  const { userInfo } = useAuth();
  const user = userInfo?.user;
  const { sendMessage, isConnected } = useWebSocket();
  const communityId = route.params?.communityId;

  // Add more images
  const addMoreImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newUris]);
      }
    } catch (error) {
      console.error("Error adding more images:", error);
    }
  };

  // Edit image (crop or adjust)
  const editImage = async (uri) => {
    try {
      const { uri: editedUri } = await ImageEditor.launchImageEditorAsync({
        uri,
        allowsEditing: true,
        aspect: [4, 3], // Optional aspect ratio
      });
      return editedUri;
    } catch (error) {
      console.error("Image editing error:", error);
      return uri;
    }
  };

  // Remove selected image
  const removeImage = (uriToRemove) => {
    setImages((prev) => prev.filter((uri) => uri !== uriToRemove));
  };

  // Send images with caption
  const sendImages = async () => {
    for (const uri of images) {
      try {
        const file = await fetch(uri);
        const blob = await file.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result.split(",")[1];
          const imageBase64 = `data:${blob.type};base64,${base64data}`;
          const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

          const message = {
            type: "send_message",
            community_id: communityId,
            message: caption,
            sender: user?.first_name + " " + user?.last_name || "Unknown User",
            sender_id: user?.id || 1,
            temp_id: tempId,
            image: imageBase64,
          };

          if (isConnected) {
            await sendMessage(message);
          } else {
            const offlineMessage = {
              _id: tempId,
              tempId,
              text: caption,
              createdAt: new Date(),
              user: {
                _id: user?.id || 1,
                name: user?.first_name + " " + user?.last_name || "Unknown User",
              },
              image: imageBase64,
              status: "pending",
              communityId,
            };
            await AsyncStorage.setItem(`unsent_message_${tempId}`, JSON.stringify(offlineMessage));
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error sending image:", error);
      }
    }
    navigation.goBack();
  };

  // Render each image with edit and remove options
  const renderImage = ({ item }) => (
    <View style={{ width: Dimensions.get("window").width, height: "70%" }}>
      <Image source={{ uri: item }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeImage(item)}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.editButton}
        onPress={async () => {
          const editedUri = await editImage(item);
          setImages((prev) => prev.map((img) => (img === item ? editedUri : img)));
        }}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption..."
          placeholderTextColor="#888"
          value={caption}
          onChangeText={setCaption}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendImages}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addMoreButton} onPress={addMoreImages}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { width: "100%", height: "100%", resizeMode: "contain" },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1c1c1c",
  },
  captionInput: {
    flex: 1,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 10,
  },
  addMoreButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    padding: 10,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  editButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
});

export default ImagePreviewScreen;