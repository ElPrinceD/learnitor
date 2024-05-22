import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Material } from "./types";

interface VideosProps {
  videoMaterials: Material[];
}

const handleMaterialPress = (material: Material) => {
  if (material.link) {
    Linking.openURL(material.link).catch((error) =>
      console.error("Error opening link:", error)
    );
  } else {
    console.log("No link available for this material");
  }
};

const Videos: React.FC<VideosProps> = ({ videoMaterials }) => {
  // Filter materials to only include videos
  const videos = videoMaterials.filter((material) => material.type === "video");

  return (
    <View style={styles.container}>
      {videos.map((material, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleMaterialPress(material)}
        >
          <View style={styles.material}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{material.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  material: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailsContainer: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Videos;
