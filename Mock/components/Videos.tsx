import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Material } from "./types";
import Colors from "../constants/Colors";
import { rMS, rV, SIZES } from "../constants";

interface VideosProps {
  videoMaterials: Material[];
  handleVideoPress: (material: Material) => void;
}

const Videos: React.FC<VideosProps> = ({
  videoMaterials,
  handleVideoPress,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const videos = videoMaterials.filter((material) => material.type === "video");

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
      {videos.map((material, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleVideoPress(material)}
        >
          <View style={styles.material}>
            <View style={styles.detailsContainer}>
              <Text style={styles.materialName}>{material.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default memo(Videos);
