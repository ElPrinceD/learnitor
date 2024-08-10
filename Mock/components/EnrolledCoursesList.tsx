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
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
import { Skeleton } from "moti/skeleton";

interface Props {
  enrolledCoursesData: Course[];
  progressMap: { [key: string]: number };
  loading: boolean;
}

const EnrolledCoursesList: React.FC<Props> = ({
  enrolledCoursesData,
  progressMap,
  loading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      margin: rMS(5),
      alignItems: "flex-start",
      position: "relative",
    },
    touchable: {
      borderRadius: 10,
      overflow: "hidden",
    },
    imageContainer: {
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: rS(150),
      height: rV(155),
    },
    textContainer: {
      position: "absolute",
      bottom: rV(8),
      left: rS(8),
      right: rS(8),
      padding: rMS(8),
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    name: {
      fontSize: SIZES.large,
      fontWeight: "900", // Very bold font weight
      color: themeColors.background,
      textAlign: "left",
      marginVertical: rMS(10), // Adjust margin to move title higher
       textShadowColor: themeColors.shadow,
       textShadowOffset: { width: -1, height: 1 },
       textShadowRadius: 1,
      flexWrap: "wrap", // Allow text to wrap to the next line
    },
    description: {
      fontSize: SIZES.medium,
      color: "white",
      textAlign: "left",
      marginBottom: rMS(5),
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    skeletonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonItem: {
      borderRadius: 10,
      margin: rMS(5),
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "EnrolledCourse",
            params: { course: JSON.stringify(item) },
          });
        }}
        activeOpacity={0.5}
        style={styles.touchable}
      >
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.url }} style={styles.image} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.description}>{item.description}</Text>
            <ProgressBar
              progress={progressMap[item.id] || 0}
              containerStyle={{
                backgroundColor: themeColors.text,
                height: 7,
              }}
              fillStyle={{ backgroundColor: themeColors.icon }}
            />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [progressMap, themeColors]
  );

  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);
  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(5)].map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <Skeleton colorMode={colorMode} height={rV(105)} width={rS(120)} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={enrolledCoursesData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={5}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default memo(EnrolledCoursesList);
