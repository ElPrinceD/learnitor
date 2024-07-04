import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Course } from "./types";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
import { Skeleton } from "moti/skeleton";

interface Props {
  RecommendedCoursesData: Course[];
  loading: boolean;
}

const RecommendedCoursesList: React.FC<Props> = ({
  RecommendedCoursesData,
  loading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const styles = StyleSheet.create({
    container: {
      flex: 2,
      alignItems: "flex-start",
      position: "relative",
    },
    touchable: {
      flex: 1,
      marginRight: rS(18),
      marginBottom: rV(2),
      borderRadius: 10,
      overflow: "hidden",
      elevation: 1,
    },
    courseListContainer: {
      flex: 1,
      backgroundColor: themeColors.card,
    },
    imageContainer: {
      flex: 2,
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: rS(210),
      height: rV(130),
    },
    textContainer: {
      flex: 1,
      padding: rMS(8),
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      flexWrap: "wrap",
      maxWidth: rMS(150),
      color: themeColors.text,
    },
    details: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      textAlign: "left",
    },
    skeletonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonItem: {
      borderRadius: 10,
      margin: rMS(5),
      gap: 5,
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <TouchableOpacity
        onPress={() => {
          router.navigate({
            pathname: "/CourseDetails",
            params: { course: JSON.stringify(item) },
          });
        }}
        activeOpacity={0.5}
        style={styles.touchable}
      >
        <View style={styles.courseListContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.url }} style={styles.image} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [themeColors]
  );

  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);
  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <Skeleton colorMode={colorMode} height={rV(130)} width={rS(210)} />
            <Skeleton colorMode={colorMode} height={rV(18)} width={rS(210)} />
            <Skeleton colorMode={colorMode} height={rV(18)} width={rS(150)} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={RecommendedCoursesData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default memo(RecommendedCoursesList);
