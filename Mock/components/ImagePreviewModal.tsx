import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ToastAndroid,
  useColorScheme,
} from "react-native";
import { Sheet } from "@tamagui/sheet";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, rS, rV, rMS } from "../constants";
import Colors from "../constants/Colors";

const { width } = Dimensions.get("window");

interface ImagePreviewModalProps {
  visible: boolean;
  images: { uri: string; type: string; id: string }[];
  onClose: () => void;
  onSend: (uri: string) => Promise<void>;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  images,
  onClose,
  onSend,
}) => {
  const [previewImage, setPreviewImage] = useState<{
    uri: string;
    type: string;
    id: string;
  } | null>(null);
  const [isSendingImages, setIsSendingImages] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Sync previewImage with images prop
  useEffect(() => {
    if (images.length > 0) {
      setPreviewImage(images[0]);
    } else {
      setPreviewImage(null);
    }
  }, [images]);

  const handleSend = useCallback(async () => {
    if (!previewImage) {
      console.warn("No preview image available");
      ToastAndroid.show("No image selected", ToastAndroid.SHORT);
      return;
    }
    setIsSendingImages(true);
    try {
      await onSend(previewImage.uri);
      ToastAndroid.show("Image sent successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Failed to send image:", error);
      ToastAndroid.show("Failed to send image", ToastAndroid.SHORT);
    } finally {
      setIsSendingImages(false);
      onClose();
    }
  }, [previewImage, onSend, onClose]);

  const handleClose = useCallback(() => {
    setPreviewImage(null); // Clear preview image on close
    onClose();
  }, [onClose]);

  return (
    <Sheet
      modal
      open={visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
      animationConfig={{
        type: "spring",
        damping: 22,
        mass: 1.2,
        stiffness: 220,
      }}
      snapPoints={[100]}
      dismissOnSnapToBottom
    >
      <Sheet.Frame style={{ backgroundColor: themeColors.background }}>
        <Sheet.ScrollView>
          <View style={styles.previewModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPressIn={handleClose}
                disabled={isSendingImages}
                activeOpacity={0.7}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={rS(28)} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {isSendingImages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.tint} />
                <Text style={[styles.loadingText, { color: themeColors.text }]}>
                  Sending image...
                </Text>
              </View>
            ) : (
              <View style={styles.contentContainer}>
                {/* Image Preview */}
                {previewImage ? (
                  <View style={styles.previewImageContainer}>
                    <Image
                      source={{ uri: previewImage.uri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.noImagesContainer}>
                    <Text
                      style={[
                        styles.noImagesText,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      No image selected
                    </Text>
                  </View>
                )}

                {/* Footer */}
                <View style={styles.previewActionContainer}>
                  {previewImage && (
                    <TouchableOpacity
                      onPressIn={handleSend}
                      style={[
                        styles.sendButton,
                        { backgroundColor: themeColors.tint },
                      ]}
                      disabled={isSendingImages}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="send" size={SIZES.large} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </Sheet.ScrollView>
      </Sheet.Frame>
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  previewModalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rS(16),
    paddingVertical: rV(12),
    backgroundColor: "transparent",
  },
  closeButton: {
    width: rS(40),
    height: rS(40),
    borderRadius: rS(20),
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: rS(16),
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: rS(12),
    margin: rS(16),
  },
  previewImage: {
    width: width - rS(48),
    height: (width - rS(48)) * 1.5,
    maxHeight: Dimensions.get("window").height * 0.65,
    borderRadius: rS(8),
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImagesText: {
    fontSize: rMS(16),
    textAlign: "center",
    marginTop: rV(20),
    opacity: 0.7,
  },
  previewActionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: rS(16),
    backgroundColor: "transparent",
  },
  sendButton: {
    width: rS(48),
    height: rS(48),
    borderRadius: rS(21),
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: rV(12),
    fontSize: rMS(16),
    fontWeight: "500",
  },
});

export default React.memo(ImagePreviewModal, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.images === nextProps.images &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onSend === nextProps.onSend
  );
});
