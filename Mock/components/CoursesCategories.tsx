import React from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import Colors from "../constants/Colors";
import { Category } from "./types";
import { SIZES, rMS, rS, rV } from "../constants";

interface Props {
  categories?: Category[];
  onPressCategory: (categoryId: number | null) => void; // Define onPressCategory function
  selectedCategoryId: number | null; // Define selectedCategoryId
}

const CoursesCategories: React.FC<Props> = ({
  categories,
  onPressCategory,
  selectedCategoryId,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const styles = StyleSheet.create({
    categoryContainer: {
      flex: 1,
      backgroundColor: "transparent",
    },

    categoryItem: {
      padding: rMS(8),
      marginHorizontal: rS(5),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: themeColors.tabIconDefault,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignSelf: "center",
    },
    selectedCategoryItem: {
      borderColor: themeColors.selectedItem,
      borderWidth: 2,
    },
    categoryText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    selectedCategoryText: {
      color: themeColors.selectedText,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              item.id === selectedCategoryId && styles.selectedCategoryItem,
            ]}
            onPress={() => onPressCategory(item.id)} // Pass item.id to onPressCategory
          >
            <Text
              style={[
                styles.categoryText,
                item.id === selectedCategoryId && styles.selectedCategoryText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default CoursesCategories;
