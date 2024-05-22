import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { ArticleMaterial } from "./types";

interface ArticlesProps {
  articleMaterials: ArticleMaterial[];
}

const handleMaterialPress = (articleMaterial: ArticleMaterial) => {
  if (articleMaterial.link) {
    Linking.openURL(articleMaterial.link).catch((error) =>
      console.error("Error opening link:", error)
    );
  } else {
    console.log("No link available for this articleMaterial");
  }
};

const Articles: React.FC<ArticlesProps> = ({ articleMaterials }) => {
  // Filter materials to only include books
  const books = articleMaterials.filter(
    (articleMaterial) => articleMaterial.type === "journal"
  );

  return (
    <View style={styles.container}>
      {books.map((articleMaterial, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleMaterialPress(articleMaterial)}
        >
          <View style={styles.articleMaterial}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{articleMaterial.name}</Text>
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
  articleMaterial: {
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

export default Articles;
