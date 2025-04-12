import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ToastAndroid,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import Colors from "../constants/Colors"; // Adjust path as needed
import { SIZES, rS, rV } from "../constants"; // Adjust path as needed

type FullScreenImageViewerProps = {
  visible: boolean;
  images: string[];
  currentIndex: number;
  onRequestClose: () => void;
};

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  images,
  currentIndex,
  onRequestClose,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  // Sync currentImageIndex for save functionality
  useEffect(() => {
    if (visible) {
      setCurrentImageIndex(currentIndex);
    }
  }, [visible, currentIndex]);

  // Save image handler
  const handleSaveImage = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const imageUri = images[currentImageIndex];
      if (!imageUri) {
        ToastAndroid.show("No image selected", ToastAndroid.SHORT);
        return;
      }

      let localUri = imageUri;
      if (imageUri.startsWith("data:image")) {
        // Handle base64 image
        const base64Data = imageUri.split(",")[1];
        const fileName = `image_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        localUri = fileUri;
      } else if (imageUri.startsWith("http")) {
        // Handle remote image
        const fileName = `image_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const { uri } = await FileSystem.downloadAsync(imageUri, fileUri);
        localUri = uri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      ToastAndroid.show("Image saved to gallery", ToastAndroid.SHORT);

      if (localUri !== imageUri) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      }
    } catch (error) {
      console.error("Error saving image:", error);
      ToastAndroid.show("Failed to save image", ToastAndroid.SHORT);
    } finally {
      setIsSaving(false);
    }
  }, [currentImageIndex, images, isSaving]);

  // Map images to library format
  const formattedImages = images.map((uri) => ({ uri }));

  // Custom header (close button)
  const renderHeader = ({ imageIndex }: { imageIndex: number }) => (
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onRequestClose}
      accessibilityLabel="Close image viewer"
    >
      <Ionicons name="close" size={rS(30)} color="#fff" />
    </TouchableOpacity>
  );

  // Custom footer (save button and index indicator)
  const renderFooter = ({ imageIndex }: { imageIndex: number }) => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSaveImage}
        disabled={isSaving}
        accessibilityLabel="Save image to gallery"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download-outline" size={rS(30)} color="#fff" />
        )}
      </TouchableOpacity>
      <Text style={styles.indexIndicator}>
        {`${imageIndex + 1}/${images.length}`}
      </Text>
    </View>
  );

  // Handle empty image list
  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: "black" }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onRequestClose}
          accessibilityLabel="Close image viewer"
        >
          <Ionicons name="close" size={rS(30)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.errorText}>No images to display</Text>
      </View>
    );
  }

  return (
    <ImageViewing
      images={formattedImages}
      imageIndex={currentIndex}
      visible={visible}
      onRequestClose={onRequestClose}
      onImageIndexChange={setCurrentImageIndex}
      HeaderComponent={renderHeader}
      FooterComponent={renderFooter}
      backgroundColor="rgba(0, 0, 0, 0.9)"
      animationType="fade"
      doubleTapToZoom
      swipeToCloseEnabled
    />
  );
};

export default FullScreenImageViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: rV(40),
    right: rS(20),
    zIndex: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rS(20),
    paddingVertical: rV(40),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  saveButton: {
    zIndex: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  indexIndicator: {
    color: "#fff",
    fontSize: SIZES.medium,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: rS(10),
    paddingVertical: rV(5),
    borderRadius: rS(10),
  },
  errorText: {
    color: "#fff",
    fontSize: SIZES.large,
    textAlign: "center",
  },
});
