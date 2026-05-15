import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import Colors from "../constants/Colors";
import { rMS, rS, rV, useShadows } from "../constants";
import AppImage from "./AppImage";
import { Course } from "./types";
import { Skeleton } from "moti/skeleton";

interface Props {
  courses: Course[];
  onCoursePress: (course: Course) => void;
  onRefresh: () => void;
  refreshing: boolean;
  loading: boolean;
}

const CourseItem: React.FC<{
  item: Course;
  onCoursePress: (course: Course) => void;
  themeColors: any;
  shadow: any;
}> = memo(
  ({ item, onCoursePress, themeColors, shadow }) => {
    const handlePress = useCallback(() => {
      onCoursePress(item);
    }, [onCoursePress, item]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={staticStyles.courseItem}
      >
        <View
          style={[
            staticStyles.cardContainer,
            {
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.border + "40",
              ...shadow.small,
            },
          ]}
        >
          <View style={staticStyles.imageContainer}>
            <AppImage uri={item.url} style={staticStyles.image} />
          </View>
          <View style={staticStyles.textContainer}>
            <Text
              style={[staticStyles.name, { color: themeColors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.url === nextProps.item.url &&
      prevProps.onCoursePress === nextProps.onCoursePress &&
      prevProps.themeColors.cardGlass === nextProps.themeColors.cardGlass &&
      prevProps.themeColors.text === nextProps.themeColors.text
    );
  }
);

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: rS(12),
    paddingTop: rV(4),
  },
  courseList: {
    paddingBottom: rMS(40),
  },
  courseItem: {
    flex: 1,
    margin: rMS(6),
  },
  cardContainer: {
    borderRadius: rMS(20),
    overflow: "hidden",
    borderWidth: 1,
  },
  imageContainer: {
    borderTopLeftRadius: rMS(20),
    borderTopRightRadius: rMS(20),
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: rV(120),
  },
  textContainer: {
    padding: rMS(12),
    backgroundColor: "transparent",
  },
  name: {
    fontSize: rMS(13),
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  // Skeleton loading
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: rS(12),
    paddingTop: rV(4),
  },
  skeletonItem: {
    width: "48%",
    marginVertical: rS(6),
    borderRadius: rMS(20),
    overflow: "hidden",
  },
});

const CoursesList: React.FC<Props> = ({
  courses,
  onCoursePress,
  onRefresh,
  refreshing,
  loading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = useMemo(
    () => Colors[colorScheme ?? "light"],
    [colorScheme]
  );
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  const shadow = useShadows();

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <CourseItem
        item={item}
        onCoursePress={onCoursePress}
        themeColors={themeColors}
        shadow={shadow}
      />
    ),
    [onCoursePress, themeColors, shadow]
  );

  const sortCourses = useCallback((list: Course[]) => {
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  const sortedCourses = useMemo(
    () => sortCourses(courses),
    [courses, sortCourses]
  );
  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={themeColors.tint}
        colors={[themeColors.tint, themeColors.text]}
        progressBackgroundColor={themeColors.background}
      />
    ),
    [
      refreshing,
      onRefresh,
      themeColors.tint,
      themeColors.text,
      themeColors.background,
    ]
  );

  if (loading) {
    return (
      <View
        style={[
          staticStyles.skeletonContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              staticStyles.skeletonItem,
              {
                backgroundColor: themeColors.cardGlass,
                borderWidth: 1,
                borderColor: themeColors.border + "40",
              },
            ]}
          >
            <Skeleton
              colorMode={colorMode}
              height={rV(120)}
              width={"100%"}
              radius={0}
              transition={{
                type: "timing",
                duration: 800,
                delay: index * 100,
              }}
            />
            <View style={{ padding: rMS(12) }}>
              <Skeleton
                colorMode={colorMode}
                height={rV(16)}
                width={"80%"}
                radius={rMS(8)}
                transition={{
                  type: "timing",
                  duration: 800,
                  delay: index * 100 + 50,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        staticStyles.container,
        { backgroundColor: themeColors.background },
      ]}
    >
      <FlashList
        data={sortedCourses}
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={staticStyles.courseList}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </View>
  );
};

export default memo(CoursesList);
