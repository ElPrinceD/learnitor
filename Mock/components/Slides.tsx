import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SlideMaterial } from "./types";
import Colors from "../constants/Colors";
import { rMS, SIZES, rV } from "../constants";

interface SlidesProps {
  slideMaterials: SlideMaterial[];
  handleSlidePress: (slideMaterial: SlideMaterial) => void;
}

const Slides: React.FC<SlidesProps> = ({
  slideMaterials,
  handleSlidePress,
}) => {
  const slides = slideMaterials.filter(
    (material) => material.type === "slides"
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // For Android shadow
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
      {slides.map((slideMaterial, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.5}
          onPress={() => handleSlidePress(slideMaterial)}
        >
          <View style={styles.materialCard}>
            <MaterialCommunityIcons
              name="presentation"
              size={27}
              color={themeColors.icon}
            />
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{slideMaterial.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(Slides);
