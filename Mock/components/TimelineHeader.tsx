// Header.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const Header: React.FC = () => {
  return (
    <View style={styles.cylinderContainer}>
      <View style={styles.cylinder}>
        <View style={styles.cylinderContent}>
          <Text style={styles.cylinderText}>Easy way to note your task</Text>
        </View>
        <Image
          source={require("../assets/images/Notes-amico.png")}
          style={styles.image}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cylinderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  cylinder: {
    backgroundColor: "#1f3e4c",
    width: 380,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 90,
    overflow: "hidden",
    flexDirection: "row",
  },
  cylinderContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  cylinderText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
});

export default Header;
