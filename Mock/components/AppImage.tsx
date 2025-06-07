import React, { memo, useRef } from "react";
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  ImageProps,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { Image as CachedImage } from "react-native-expo-image-cache";
import { isEqual } from "lodash";
import Colors from "../constants/Colors";
import { rS } from "../constants";

// Define props for CachedImage based on react-native-expo-image-cache
interface CachedImageProps {
  uri: string;
  style?: ImageProps["style"];
  defaultSource?: ImageProps["defaultSource"];
  preview?: { uri: string };
  options?: object;
}

interface AppImageProps {
  uri?: string;
  style?: ImageProps["style"];
  onPress?: (event: GestureResponderEvent) => void; // Add optional onPress prop
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

const AppImage: React.FC<AppImageProps> = ({ uri, style, onPress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const isLoadingRef = useRef(true);

  const handleLoad = () => {
    isLoadingRef.current = false;
  };

  const handleError = () => {
    isLoadingRef.current = false;
  };

  const isValidUri = uri && typeof uri === "string" && uri.startsWith("http");

  const renderImage = () => {
    if (isValidUri) {
      return (
        <CachedImage
          uri={uri}
          style={[styles.image, style]}
          // No onLoad/onError; rely on cache
        />
      );
    }
    return (
      <Image
        source={require("../assets/images/placeholder.png")} // Adjust path
        style={[styles.image, style]}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>{renderImage()}</TouchableOpacity>
      ) : (
        renderImage()
      )}
      {!isValidUri && isLoadingRef.current && (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: themeColors.background },
          ]}
        >
          <ActivityIndicator size="small" color={themeColors.tint} />
        </View>
      )}
    </View>
  );
};

export default memo(AppImage, (prevProps, nextProps) => {
  return (
    isEqual(prevProps.style, nextProps.style) &&
    prevProps.uri === nextProps.uri &&
    prevProps.onPress === nextProps.onPress // Include onPress in memo comparison
  );
});
