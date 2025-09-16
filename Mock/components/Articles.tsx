import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ArticleMaterial } from "./types";
import Colors from "../constants/Colors"; // Adjusting Colors import
import { rMS, SIZES, rV } from "../constants";
import InAppBrowserLink from "./InAppBrowserLink";

interface ArticlesProps {
  articleMaterials: ArticleMaterial[];
}

const Articles: React.FC<ArticlesProps> = ({ articleMaterials }) => {
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
        <InAppBrowserLink
          key={index}
          url={articleMaterial.link || ""}
          style={{ marginBottom: rV(10) }}
        >
          <View style={styles.materialCard}>
            <FontAwesome6 name="newspaper" size={27} color={themeColors.icon} />
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{articleMaterial.name}</Text>
            </View>
          </View>
        </InAppBrowserLink>
      ))}
    </View>
  );
};

export default memo(Articles);
