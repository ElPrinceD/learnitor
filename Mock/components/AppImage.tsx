import React, { memo } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  ImageProps,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { Image } from "expo-image";
import { isEqual } from "lodash";
import Colors from "../constants/Colors";

interface AppImageProps {
  uri?: string;
  style?: ImageProps["style"];
  onPress?: (event: GestureResponderEvent) => void;
  cacheKey?: string;
}

const blurhash = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

const AppImage: React.FC<AppImageProps> = ({
  uri,
  style,
  onPress,
  cacheKey,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const isValidUri = uri && typeof uri === "string" && uri.startsWith("http");
  const imageUri = isValidUri
    ? cacheKey
      ? `${uri}?cacheKey=${cacheKey}`
      : uri
    : undefined;

  const imageSource = imageUri
    ? { uri: imageUri }
    : require("../assets/images/placeholder.png");

  const renderImage = () => (
    <Image
      source={imageSource}
      style={[styles.image, style]}
      placeholder={{ blurhash }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );

  return (
    <View style={[styles.container, style]}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>{renderImage()}</TouchableOpacity>
      ) : (
        renderImage()
      )}
    </View>
  );
};

export default memo(AppImage, (prevProps, nextProps) => {
  return (
    prevProps.uri === nextProps.uri &&
    prevProps.onPress === nextProps.onPress &&
    isEqual(prevProps.style, nextProps.style)
  );
});
