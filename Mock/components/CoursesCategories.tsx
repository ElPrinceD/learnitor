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
      paddingHorizontal: rS(12),
      paddingVertical: rV(6),
    },
    categoryItem: {
      paddingHorizontal: rMS(14),
      paddingVertical: rMS(8),
      marginHorizontal: rS(4),
      borderRadius: rMS(20),
      borderWidth: 1.5,
      borderColor: themeColors.border + "60",
      backgroundColor: "transparent",
      justifyContent: "center",
      alignSelf: "center",
    },
    selectedCategoryItem: {
      borderColor: themeColors.tint,
      backgroundColor: themeColors.tint,
    },
    categoryText: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.text,
      letterSpacing: 0.2,
    },
    selectedCategoryText: {
      color: "#fff",
      fontWeight: "800",
    },
    skeletonContainer: {
      flexDirection: "row",
      paddingHorizontal: rS(12),
      paddingVertical: rV(6),
    },
    skeleton: {
      marginHorizontal: rS(4),
      borderRadius: rMS(20),
    },
  });

  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.skeleton}>
            <Skeleton
              colorMode={colorMode}
              height={rV(32)}
              width={rS(75)}
              radius={rMS(20)}
              transition={{
                type: "timing",
                duration: 800,
                delay: index * 150,
              }}
            />
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
            activeOpacity={0.7}
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
