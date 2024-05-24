import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { BookMaterial } from "./types";

interface BooksProps {
  bookMaterials: BookMaterial[];
  handleBookPress: (bookMaterial: BookMaterial) => void;
}

const Books: React.FC<BooksProps> = ({ bookMaterials, handleBookPress }) => {
  // Filter materials to only include books
  const books = bookMaterials.filter(
    (bookMaterial) => bookMaterial.type === "book"
  );

  return (
    <View style={styles.container}>
      {books.map((bookMaterial, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleBookPress(bookMaterial)}
        >
          <View style={styles.bookMaterial}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{bookMaterial.name}</Text>
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
  bookMaterial: {
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

export default Books;
