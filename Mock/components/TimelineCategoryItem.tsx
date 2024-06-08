import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, rMS, rV, useShadows } from "../constants";

interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    color?: string;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  onPress: () => void;
  onLongPress?: () => void; // Add onLongPress prop
  width: number;
}

const TimelineCategoryItem: React.FC<CategoryItemProps> = ({
  category,
  onPress,
  onLongPress, // Destructure onLongPress prop
  width,
}) => {
  const shadow = useShadows();

  const styles = StyleSheet.create({
    categoryBox: {
      height: rV(140),
      marginVertical: rV(10),
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(10),
      ...Platform.select({
        ios: {
          backgroundColor: "#fff",
        },
      }),
    },
    categoryText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: "#fff",
      marginTop: rV(10),
    },
  });

  return (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryBox,
        {
          backgroundColor: category.color,
          width: (width - 40) / 2,
          ...shadow.medium,
        },
      ]}
      activeOpacity={0.5}
      onPress={onPress}
      onLongPress={onLongPress} // Pass onLongPress to TouchableOpacity
    >
      <Ionicons name={category.icon} size={SIZES.xxxLarge} color="#fff" />
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );
};

export default TimelineCategoryItem;
