import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";

interface Material {
  name: string;
  type: "video" | "book" | "journal";
  link: string;
  thumbnail?: string; // Add thumbnail property
}

interface MaterialsProps {
  topicMaterials: Material[];
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

const Materials: React.FC<MaterialsProps> = ({ topicMaterials }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Materials</Text>
      {topicMaterials.map((material, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleMaterialPress(material)}
        >
          <View style={styles.material}>
            {material.thumbnail && (
              <Image
                source={{ uri: material.thumbnail }}
                style={styles.thumbnail}
              />
            )}
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{material.name}</Text>
              <Text style={styles.materialType}>
                Type:{" "}
                {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
              </Text>
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
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 5,
  },
  detailsContainer: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  materialType: {
    fontSize: 14,
  },
});

export default Materials;
