import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';


const GradientCard = ({ card, handleCardPress }) => {
  return (
    <LinearGradient
      colors={card.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardCategory}>
        <Ionicons name="sparkles" size={15} color="#D96B06" />
        <Text style={styles.categoryText}>{card.category}</Text>
      </View>
      <Image source={card.image} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardDescription}>{card.description}</Text>
      
      <TouchableOpacity onPress={handleCardPress} style={styles.forward}>
        <Ionicons name="arrow-forward-circle" size={30} color="#D96B06" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 370,
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginLeft: -10,
    marginTop: -160,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardCategory: {
    backgroundColor: "#ffffff",
    opacity: 0.8,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 20,
    position: "absolute",
    top: 20,
    color: "#313030",
    left: 15,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: "normal",
    paddingHorizontal: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    zIndex: 2,
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    marginLeft: -20,
    zIndex: 2,
  },

    cardImage: {
      width: 180, // Increased width
      height: 200, // Increased height
      position: 'absolute',
      right: 6,
      bottom: 0,
      opacity: 0.5, // Optional: adjust opacity to make it blend better with the card background
      zIndex: 1, // Ensures it stays behind other elements
    },
  
  forward: {
    position: 'absolute',
    bottom: 7,
    right: 15,
    zIndex: 2,
  }
});

export default GradientCard;
