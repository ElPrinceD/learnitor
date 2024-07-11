// components/CarouselCard.js
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SIZES } from "../constants";

const CarouselCard = ({ item }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    height: 250,
    padding: 16,
    margin: 16,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: "bold",
  },
  description: {
    fontSize: SIZES.medium,
    color: "#444",
  },
});

export default CarouselCard;
