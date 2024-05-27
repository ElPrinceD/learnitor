import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  return (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryBox,
        {
          backgroundColor: category.color,
          width: (width - 40) / 2,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            android: {
              elevation: 5,
            },
          }),
        },
      ]}
      activeOpacity={0.5}
      onPress={onPress}
      onLongPress={onLongPress} // Pass onLongPress to TouchableOpacity
    >
      <Ionicons name={category.icon} size={40} color="#fff" />
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    height: 160,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    ...Platform.select({
      ios: {
        backgroundColor: "#fff",
      },
    }),
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
});

export default TimelineCategoryItem;
