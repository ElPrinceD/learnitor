import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useColorScheme,
} from "react-native";
import { BookMaterial } from "./types";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { rMS, SIZES, rV } from "../constants";

interface BooksProps {
  bookMaterials: BookMaterial[];
  handleBookPress: (bookMaterial: BookMaterial) => void;
}

const Books: React.FC<BooksProps> = ({ bookMaterials, handleBookPress }) => {
  // Filter materials to only include books
  const books = bookMaterials.filter(
    (bookMaterial) => bookMaterial.type === "book"
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
      {books.map((bookMaterial, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleBookPress(bookMaterial)}
        >
          <View style={styles.material}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{bookMaterial.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(Books);
