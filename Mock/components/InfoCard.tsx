import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SIZES, rMS, rS, rV } from "../constants";

const GradientCard = ({ card, handleCardPress }) => {
  return (
    <LinearGradient
      colors={card.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardCategory}>
        <Ionicons name="sparkles" size={rMS(15)} color="#D96B06" />
        <Text style={styles.categoryText}>{card.category}</Text>
      </View>

      <Image source={card.image} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{card.title}</Text>
      {/* <Text style={styles.cardDescription}>{card.description}</Text> */}

      <TouchableOpacity onPress={handleCardPress} style={styles.forward}>
        <Ionicons name="arrow-forward-circle" size={rMS(30)} color="#D96B06" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: rS(310),
    height: rV(140),
    borderRadius: 20,
    justifyContent: "center",
    // alignItems: "center",
    marginLeft: rMS(-10),
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardCategory: {
    backgroundColor: "#ffffff",
    opacity: 0.8,
    flexDirection: "row",
    alignItems: "center",
    padding: rMS(6),
    borderRadius: 20,
    position: "absolute",
    top: rMS(8),
    color: "#313030",
    left: rMS(13),
  },
  categoryText: {
    fontSize: SIZES.medium,
    fontWeight: "normal",
    paddingHorizontal: rMS(6),
  },
  cardTitle: {
    fontSize: SIZES.large,
    fontWeight: "bold",
    marginTop: rMS(25),
    alignSelf: "flex-start",
    marginLeft: rMS(8),
    textAlign: "left",
    flexWrap: "wrap",
    maxWidth: rMS(160),
    zIndex: 2,
  },

  cardImage: {
    width: rS(160),
    height: rV(180),
    position: "absolute",
    alignSelf: "flex-end",
    zIndex: 1,
  },

  forward: {
    position: "absolute",
    bottom: rMS(7),
    right: rMS(15),
    zIndex: rMS(2),
  },
});

export default GradientCard;
