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
      width: '50%', // Half the width of the screen
      backgroundColor: '#FFD600',
      marginTop: rMS(20),
      height: rV(200),
      borderRadius: rMS(10),
    },
    header: {
      backgroundColor: 'black',
      width: "100%",
      alignItems: 'center',
      paddingVertical: rV(10),
      borderRadius: rMS(20),
      marginTop: -rV(10)
    },
    headerText: {
      color: '#FFD600',
      fontSize: SIZES.large,
      fontWeight: 'bold',
    },
    itemContainer: {
       // Assuming background color from theme
      borderRadius: rMS(5),
      marginVertical: rMS(5),
      padding: rMS(10),
     // Fixed height for each item
     // Space between content for better visual
    },
    courseTitle: {
      fontSize: SIZES.medium,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    courseImage: {
      width: rS(20),
      height: rV(20),
      borderRadius: rMS(5),
      marginRight: rS(5),
    },
    progressBarContainer: {
      marginTop: rV(5), 
    },
    skeletonContainer: {
      padding: rMS(10),
    },
    skeletonItem: {
      height: rV(100),
      borderRadius: rMS(5),
      marginVertical: rMS(5),
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <TouchableOpacity
        onPress={() => {
          router.navigate({
            pathname: "EnrolledCourse",
            params: { course: JSON.stringify(item) },
          });
        }}
        activeOpacity={0.5}
        style={styles.itemContainer}
      >
        <View style={{ flexDirection: 'row' }}>
          <Image source={{ uri: item.url }} style={styles.courseImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.progressBarContainer}>
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
          <Skeleton key={index} colorMode={colorMode} style={styles.skeletonItem} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Courses</Text>
      </View>
      <FlatList
        data={enrolledCoursesData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rV(10) }} // Add some padding at the bottom
      />
    </View>
  );
};

export default memo(EnrolledCoursesList);