import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "react-native-expo-image-cache";

interface AppImageProps {
  uri?: string | null;
  style?: object;
}

const AppImage: React.FC<AppImageProps> = ({ uri, style }) => {
  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image uri={uri} style={[styles.image, style]} />
      ) : (
        <ActivityIndicator size="small" color="#888" style={styles.loader} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
  },
});

export default AppImage;
