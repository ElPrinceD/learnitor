import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Entypo from "@expo/vector-icons/Entypo"; // Importing the icon for books
import { BookMaterial } from "./types";
import Colors from "../constants/Colors"; // Adjusting Colors import
import { rMS, SIZES, rV } from "../constants";
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
      {books.map((bookMaterial, index) => (
        <InAppBrowserLink
          key={index}
          url={bookMaterial.link || ""}
          style={{ marginBottom: rV(10) }}
        >
          <View style={styles.materialCard}>
            <Entypo name="book" size={27} color={themeColors.icon} />
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{bookMaterial.name}</Text>
            </View>
          </View>
        </InAppBrowserLink>
      ))}
    </View>
  );
};

export default memo(Books);
