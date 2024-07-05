import React, { useCallback } from "react";
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
import { Skeleton } from "moti/skeleton";

interface Props {
  categories?: Category[];
  onPressCategory: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
  loading: boolean;
}

const CoursesCategories: React.FC<Props> = ({
  categories,
  onPressCategory,
  selectedCategoryId,
  loading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

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
    skeletonContainer: {
      flex: 0.7,
      flexDirection: "row",
      marginHorizontal: rS(10),
      marginTop: rV(10),
    },

    skeleton: {
      flexDirection: "row",
      marginVertical: rS(5),
      marginHorizontal: rS(5),
      borderRadius: 10,
      gap: 5,
    },
  });
  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.skeleton}>
            <Skeleton colorMode={colorMode} height={rV(24)} width={rS(70)} />
          </View>
        ))}
      </View>
    );
  }

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
            onPress={() => onPressCategory(item.id)}
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
        keyExtractor={keyExtractor}
      />
    </View>
  );
};

export default CoursesCategories;
