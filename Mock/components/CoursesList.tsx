import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
  FlatList,
  RefreshControl,
} from "react-native";
import Colors from "../constants/Colors"; // Adjust the import path as necessary
import { SIZES, rMS, rS, rV } from "../constants";
import { Course } from "./types";
import { Skeleton } from "moti/skeleton";

interface Props {
  courses: Course[];
  onCoursePress: (course: Course) => void;
  onRefresh: () => void;
  refreshing: boolean;
  loading: boolean;
}

const CoursesList: React.FC<Props> = ({
  courses,
  onCoursePress,
  onRefresh,
  refreshing,
  loading,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const styles = StyleSheet.create({
    container: {
      flex: 9,
      borderTopLeftRadius: rMS(30),
      borderTopRightRadius: rMS(30),
      padding: rMS(10),
      backgroundColor: themeColors.background,
    },
    courseList: {
      paddingBottom: rMS(20),
    },
    courseListContainer: {
      backgroundColor: themeColors.card,
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
    newLabelContainer: {
      position: "absolute",
      top: rS(10),
      right: 0,
      backgroundColor: themeColors.tabIconSelected,
      paddingHorizontal: rMS(5),
      paddingVertical: rMS(2),
    },
    newLabelText: {
      color: themeColors.text,
      fontSize: SIZES.small,
      fontWeight: "bold",
    },
    textContainer: {
      flex: 1,
      padding: rMS(10),
      backgroundColor: "transparent",
    },
    name: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    skeletonContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      flex: 9,
      borderTopLeftRadius: rMS(30),
      borderTopRightRadius: rMS(30),
      padding: rMS(10),
      backgroundColor: themeColors.background,
    },
    skeletonItem: {
      width: "48%",
      marginVertical: rS(5),
      borderRadius: 10,
      gap: 5,
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      
      <TouchableOpacity
        onPress={() => onCoursePress(item)}
        activeOpacity={0.5}
        style={styles.courseItem}
      >
        <View style={styles.courseListContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.url }} style={styles.image} />
            {/* <View style={styles.newLabelContainer}>
              <Text style={styles.newLabelText}>NEW</Text>
            </View> */}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [themeColors, onCoursePress]
  );
  const sortCourses = useCallback((list: Course[]) => {
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Sort the courses using useMemo for optimization
  const sortedCourses = useMemo(
    () => sortCourses(courses),
    [courses, sortCourses]
  );
  const keyExtractor = useCallback((item: Course) => item.id.toString(), []);

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
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
    <View style={styles.container}>
      <FlatList
        data={sortedCourses}
        numColumns={2}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.courseList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint, themeColors.text]}
            progressBackgroundColor={themeColors.background}
          />
        }
      />
    </View>
  );
};

export default memo(CoursesList);
