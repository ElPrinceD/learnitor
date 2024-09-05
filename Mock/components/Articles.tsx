import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ArticleMaterial } from "./types";
import Colors from "../constants/Colors"; // Adjusting Colors import
import { rMS, SIZES, rV } from "../constants";

interface ArticlesProps {
  articleMaterials: ArticleMaterial[];
  handleArticlePress: (articleMaterial: ArticleMaterial) => void;
}

const Articles: React.FC<ArticlesProps> = ({
  articleMaterials,
  handleArticlePress,
}) => {
  const articles = articleMaterials.filter(
    (articleMaterial) => articleMaterial.type === "journal"
  );
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      padding: rMS(20),
    },
    materialCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: rMS(16),
      backgroundColor: themeColors.card,
      borderRadius: 10,
      marginBottom: rV(10),
    },
    detailsContainer: {
      flex: 1,
      marginLeft: rMS(10),
    },
    materialName: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
  });

  return (
    <View style={styles.container}>
      {articles.map((articleMaterial, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.5}
          onPress={() => handleArticlePress(articleMaterial)}
        >
          <View style={styles.materialCard}>
            <FontAwesome6 name="newspaper" size={27} color={themeColors.icon} />
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
