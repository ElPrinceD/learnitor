import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Course } from "./types";
import ProgressBar from "./ProgressBar";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import { Skeleton } from "moti/skeleton";

interface Props {
  enrolledCoursesData: Course[];
  progressMap: { [key: string]: number };
  loading: boolean;
  isRecommended?: boolean;
}

const EnrolledCoursesList: React.FC<Props> = ({
  enrolledCoursesData,
  progressMap,
  loading,
  isRecommended = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  const shadow = useShadows();

  const styles = StyleSheet.create({
    // Section header — matches Play's sectionHeader pattern
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(12),
    },
    title: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    seeAll: {
      fontSize: SIZES.small,
      color: themeColors.tint,
      fontWeight: "700",
    },
    // Course card — glassmorphic
    touchable: {
      marginRight: rS(10),
    },
    cardContainer: {
      width: rS(150),
      borderRadius: rMS(16),
      overflow: "hidden",
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    imageContainer: {
      borderTopLeftRadius: rMS(16),
      borderTopRightRadius: rMS(16),
      overflow: "hidden",
    },
    image: {
      width: rS(150),
      height: rV(120),
    },
    textContainer: {
      padding: rMS(10),
      backgroundColor: "transparent",
    },
    name: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(6),
      letterSpacing: -0.1,
    },
    progressContainer: {
      marginTop: rV(2),
    },
    progressText: {
      fontSize: rMS(9),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginTop: rV(3),
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    // Recommended badge
    recommendedBadge: {
      position: "absolute",
      top: rV(8),
      left: rS(8),
      backgroundColor: themeColors.tint,
      paddingHorizontal: rMS(8),
      paddingVertical: rV(3),
      borderRadius: rMS(10),
      zIndex: 2,
    },
    recommendedBadgeText: {
      fontSize: rMS(8),
      fontWeight: "800",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // Skeleton loading
    skeletonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonItem: {
      borderRadius: rMS(16),
      margin: rMS(5),
      overflow: "hidden",
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <TouchableOpacity
        onPress={() => {
          if (isRecommended) {
            router.push({
              pathname: "/(tabs)/(two)/CourseDetails",
              params: { course: JSON.stringify(item) },
            });
          } else {
            router.push({
              pathname: "/(tabs)/(two)/EnrolledCourse",
              params: { course: JSON.stringify(item) },
            });
          }
        }}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        <View style={styles.cardContainer}>
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>New</Text>
            </View>
          )}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {item.title}
            </Text>
            {!isRecommended && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progressMap[item.id] || 0}
                />
                <Text style={styles.progressText}>
                  {Math.round(progressMap[item.id] || 0)}% complete
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [progressMap, themeColors, isRecommended]
  );

  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);

  if (loading) {
    return (
      <View>
        <View style={styles.sectionHeader}>
          <Skeleton colorMode={colorMode} height={rV(20)} width={rS(160)} radius={8} />
        </View>
        <View style={styles.skeletonContainer}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.skeletonItem}>
              <Skeleton colorMode={colorMode} height={rV(155)} width={rS(150)} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>
          {isRecommended ? "Recommended Courses" : "Your Courses"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(two)")}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlashList
        horizontal
        data={enrolledCoursesData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default memo(EnrolledCoursesList);
