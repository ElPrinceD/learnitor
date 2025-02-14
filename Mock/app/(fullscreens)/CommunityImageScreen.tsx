// File: CommunityImagesScreen.tsx

import React from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  Text,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants";
import ImageView from "react-native-image-viewing";

type RouteParams = {
  id: string;
  images?: string[] | string; 
};

const CommunityImagesScreen: React.FC = () => {
  const route = useRoute();
  const { id, images } = route.params as RouteParams;

  // 1) Convert images to an array if it's a comma-separated string:
  let imagesToRender: string[] = [];

  if (typeof images === "string") {
    // We have a single string with comma-separated URLs
    imagesToRender = images.split(",").map((url) => url.trim());
  } else if (Array.isArray(images)) {
    // We already have an array of strings
    imagesToRender = images;
  }



  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const [visible, setIsVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentImageIndex(index);
        setIsVisible(true);
      }}
    >
      <Image source={{ uri: item }} style={styles.image} />
    </TouchableOpacity>
  );

  if (!imagesToRender.length) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text, padding: 20 }}>
          No images available.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={imagesToRender}
        renderItem={renderItem}
        keyExtractor={(_, index) => String(index)}
        numColumns={3}
        contentContainerStyle={styles.listContainer}
      />

      {/* Full-Screen Viewer */}
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <ImageView
          images={imagesToRender.map((uri) => ({ uri }))}
          imageIndex={currentImageIndex}
          visible={visible}
          onRequestClose={() => setIsVisible(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
        />
      </Modal>
    </View>
  );
};

export default CommunityImagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: rS(5),
  },
  image: {
    width: rV(100),
    height: rV(100),
    margin: rS(5),
    borderRadius: rMS(5),
    resizeMode: "cover",
  },
});
