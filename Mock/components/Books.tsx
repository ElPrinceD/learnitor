import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { BookOpen, ExternalLink } from "lucide-react-native";
import { BookMaterial } from "./types";
import Colors from "../constants/Colors";
import { rMS, rS, rV, useShadows } from "../constants";
import InAppBrowserLink from "./InAppBrowserLink";

interface BooksProps {
  bookMaterials: BookMaterial[];
}

const Books: React.FC<BooksProps> = ({ bookMaterials }) => {
  const books = bookMaterials.filter(
    (bookMaterial) => bookMaterial.type === "book"
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
      {books.map((bookMaterial, index) => (
        <InAppBrowserLink
          key={index}
          url={bookMaterial.link || ""}
          style={{ marginBottom: rV(2) }}
        >
          <View style={styles.materialCard}>
            <View style={styles.iconContainer}>
              <BookOpen size={20} color={themeColors.tint} />
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName} numberOfLines={2}>
                {bookMaterial.name}
              </Text>
              <Text style={styles.materialType}>Book</Text>
            </View>
            <ExternalLink size={14} color={themeColors.textSecondary} />
          </View>
        </InAppBrowserLink>
      ))}
    </View>
  );
};

export default memo(Books);
