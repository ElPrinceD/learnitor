import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  FlatList,
  RefreshControl,
} from "react-native";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
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

const styles = StyleSheet.create({
  container: {
    flex: 9,
    borderTopLeftRadius: rMS(30),
    borderTopRightRadius: rMS(30),
    padding: rMS(10),
  },
  courseList: {
    paddingBottom: rMS(40),
  },
  courseListContainer: {
    backgroundColor: Colors.light.card, // Fallback
  },
  courseItem: {
    flex: 1,
    margin: rMS(10),
    borderRadius: rMS(10),
    overflow: "hidden",
    elevation: 1,
  },
  imageContainer: {
    flex: 1,
    borderRadius: rMS(10),
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: rV(120),
  },
  textContainer: {
    flex: 1,
    padding: rMS(10),
    backgroundColor: "transparent",
  },
  name: {
    fontSize: SIZES.medium,
    fontWeight: "bold",
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    flex: 9,
    borderTopLeftRadius: rMS(30),
    borderTopRightRadius: rMS(30),
    padding: rMS(10),
  },
  skeletonItem: {
    width: "48%",
    marginVertical: rS(5),
    borderRadius: 10,
    gap: 5,
  },
});

const CourseItem: React.FC<{
  item: Course;
  onCoursePress: (course: Course) => void;
  themeColors: any;
}> = memo(
  ({ item, onCoursePress, themeColors }) => {
    const handlePress = useCallback(() => {
      onCoursePress(item);
    }, [onCoursePress, item]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.5}
        style={styles.courseItem}
      >
        <View
          style={[
            styles.courseListContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <View style={styles.imageContainer}>
            <AppImage uri={item.url} style={styles.image} />
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[styles.name, { color: themeColors.text }]}
              numberOfLines={1}
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
      prevProps.themeColors.card === nextProps.themeColors.card &&
      prevProps.themeColors.text === nextProps.themeColors.text
    );
  }
);

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

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <CourseItem
        item={item}
        onCoursePress={onCoursePress}
        themeColors={themeColors}
      />
    ),
    [onCoursePress, themeColors]
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
          styles.skeletonContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <Skeleton colorMode={colorMode} height={rV(120)} width={"100%"} />
            <Skeleton colorMode={colorMode} height={rV(18)} width={"100%"} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        data={sortedCourses}
        numColumns={2}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.courseList}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        getItemLayout={(data, index) => ({
          length: rV(120) + rMS(20), // height + margin
          offset: (rV(120) + rMS(20)) * Math.floor(index / 2),
          index,
        })}
      />
    </View>
  );
};

export default memo(CoursesList);
