import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { ArticleMaterial } from "./types";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { rMS, SIZES, rV } from "../constants";

interface ArticlesProps {
  articleMaterials: ArticleMaterial[];
  handleArticlePress: (articleMaterial: ArticleMaterial) => void;
}

const Articles: React.FC<ArticlesProps> = ({
  articleMaterials,
  handleArticlePress,
}) => {
  // Filter materials to only include books
  const books = articleMaterials.filter(
    (articleMaterial) => articleMaterial.type === "journal"
  );
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      padding: rMS(20),
      borderRadius: 10,
    },
    title: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      marginBottom: rV(10),
    },
    material: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(10),
    },
    detailsContainer: {
      flex: 1,
    },
    materialName: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      {books.map((articleMaterial, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleArticlePress(articleMaterial)}
        >
          <View style={styles.material}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{articleMaterial.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(Articles);
