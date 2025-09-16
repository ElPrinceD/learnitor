import React, { memo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { Material } from "./types";
import Colors from "../constants/Colors";
import { rMS, rV, SIZES } from "../constants";
import InAppBrowserLink from "./InAppBrowserLink";

interface VideosProps {
  videoMaterials: Material[];
}

const Videos: React.FC<VideosProps> = ({ videoMaterials }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const videos = videoMaterials.filter((material) => material.type === "video");

  const styles = StyleSheet.create({
    container: {
      padding: rMS(20),
    },
    materialCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: rMS(16),
      backgroundColor: themeColors.card, // Card background color based on theme
      borderRadius: 10,
      marginBottom: rV(10),
    },
    detailsContainer: {
      flex: 1,
      marginLeft: rMS(10), // Adds space between the icon and the text
    },
    materialName: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text, // Text color based on theme
    },
  });

  return (
    <View style={styles.container}>
      {videos.map((material, index) => (
        <InAppBrowserLink
          key={index}
          url={material.link || ""}
          style={{ marginBottom: rV(10) }}
        >
          <View style={styles.materialCard}>
            <Entypo name="video" size={27} color={themeColors.icon} />
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{material.name}</Text>
            </View>
          </View>
        </InAppBrowserLink>
      ))}
    </View>
  );
};

export default memo(Videos);
