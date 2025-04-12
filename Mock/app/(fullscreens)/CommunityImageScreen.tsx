import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Text,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import AppImage from "../../components/AppImage"; // Adjust the path as needed
import FullScreenImageViewer from "../../components/FullScreenImageViewer";

type RouteParams = {
  id: string;
  images?: string[] | string;
};

const CommunityImagesScreen: React.FC = () => {
  const route = useRoute();
  const { id, images } = route.params as RouteParams;

  // Convert images to an array if it's a comma-separated string
  let imagesToRender: string[] = [];
  if (typeof images === "string") {
    imagesToRender = images.split(",").map((url) => url.trim());
  } else if (Array.isArray(images)) {
    imagesToRender = images;
  }

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const [visible, setIsVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        setCurrentImageIndex(index);
        setIsVisible(true);
      }}
    >
      <AppImage uri={item} style={styles.image} />
    </TouchableOpacity>
  );

  if (!imagesToRender.length) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text, padding: 20 }}>No images available.</Text>
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
      <FullScreenImageViewer
        visible={visible}
        images={imagesToRender}
        currentIndex={currentImageIndex}
        onRequestClose={() => setIsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { padding: rS(5) },
  image: {
    width: rV(100),
    height: rV(100),
    margin: rS(1),
    borderRadius: rMS(5),
  },
});

export default CommunityImagesScreen;
