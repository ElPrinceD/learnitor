import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { FileText, ExternalLink } from "lucide-react-native";
import { ArticleMaterial } from "./types";
import Colors from "../constants/Colors";
import { rMS, rS, rV, useShadows } from "../constants";
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
  const shadow = useShadows();

  const styles = StyleSheet.create({
    container: {
      padding: rMS(16),
    },
    materialCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: rMS(14),
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      marginBottom: rV(10),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    iconContainer: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(14),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(12),
    },
    detailsContainer: {
      flex: 1,
    },
    materialName: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.1,
      lineHeight: rMS(18),
    },
    materialType: {
      fontSize: rMS(10),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginTop: rV(2),
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      {articles.map((articleMaterial, index) => (
        <InAppBrowserLink
          key={index}
          url={articleMaterial.link || ""}
          style={{ marginBottom: rV(2) }}
        >
          <View style={styles.materialCard}>
            <View style={styles.iconContainer}>
              <FileText size={20} color={themeColors.tint} />
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName} numberOfLines={2}>
                {articleMaterial.name}
              </Text>
              <Text style={styles.materialType}>Article</Text>
            </View>
            <ExternalLink size={14} color={themeColors.textSecondary} />
          </View>
        </InAppBrowserLink>
      ))}
    </View>
  );
};

export default memo(Articles);
