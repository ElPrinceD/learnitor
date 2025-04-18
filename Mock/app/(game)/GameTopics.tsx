import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Course, Topic } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import TimelineCategoryItem from "../../components/TimelineCategoryItem";
import GameButton from "../../components/GameButton";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import { getCourseTopics } from "../../CoursesApiCalls"; // Import the new API function

const GameTopics: React.FC = () => {
  const { userToken } = useAuth();
  const { course } = useLocalSearchParams();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  const fetchTopics = async (): Promise<Topic[]> => {
    const topics = await getCourseTopics(parsedCourse.id, userToken?.token);
    return topics.map((topic: Topic) => ({
      ...topic,
      color: getRandomColor(),
      isChecked: false,
    }));
  };

  const {
    status: topicsStatus,
    data: fetchedTopics,
    error: topicsError,
    refetch: refetchTopics,
  } = useQuery<Topic[], Error>({
    queryKey: ["courseTopics", parsedCourse.id],
    queryFn: fetchTopics,
    enabled: !!parsedCourse.id,
  });

  useEffect(() => {
    if (fetchedTopics) {
      setTopics(fetchedTopics);
    }
  }, [fetchedTopics]);

  const handleTopicPress = (topic: Topic) => {
    if (selectedTopics.length === 0) {
      router.navigate({
        pathname: "GameLevel",
        params: {
          topic: JSON.stringify(topic),
          course: course?.toString(),
        },
      });
    } else {
      handleTopicLongPress(topic);
    }
  };

  const handleTopicLongPress = (topic: Topic) => {
    setSelectionMode(true);
    const isSelected = selectedTopics.some((t) => t.id === topic.id);
    if (isSelected) {
      const updatedSelectedTopics = selectedTopics.filter(
        (t) => t.id !== topic.id
      );
      setSelectedTopics(updatedSelectedTopics);
      const updatedTopics = topics?.map((t) =>
        t.id === topic.id ? { ...t, isChecked: false } : t
      );
      setTopics(updatedTopics);
      if (updatedSelectedTopics.length === 0) {
        setSelectionMode(false);
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
      const updatedTopics = topics?.map((t) =>
        t.id === topic.id ? { ...t, isChecked: true } : t
      );
      setTopics(updatedTopics);
    }
  };

  const handleSelectAll = () => {
    if (selectedTopics.length === topics?.length) {
      setSelectedTopics([]);
      const updatedTopics = topics?.map((t) => ({ ...t, isChecked: false }));
      setTopics(updatedTopics);
      setSelectionMode(false);
    } else {
      setSelectedTopics(topics || []);
      const updatedTopics = topics?.map((t) => ({ ...t, isChecked: true }));
      setTopics(updatedTopics);
      setSelectionMode(true);
    }
  };

  const handleContinue = () => {
    router.navigate({
      pathname: "GameLevel",
      params: {
        topics: JSON.stringify(selectedTopics),
        course: course?.toString(),
      },
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: rMS(10),
          marginTop: rV(50),
        },
        header: {
          color: themeColors.text,
          fontSize: SIZES.xLarge,
          fontWeight: "bold",
          marginTop: rV(8),
          marginBottom: rV(10),
          textAlign: "center",
        },
        row: {
          justifyContent: "space-between",
        },
        flatListContent: {
          paddingBottom: rV(18),
        },
        topicContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: rV(8),
          position: "relative",
        },
        checkBoxContainer: {
          position: "absolute",
          top: rV(8),
          right: 0,
          zIndex: 1,
        },
        checkBox: {
          width: rS(22),
          height: rV(22),
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "flex-end",
        },
        selectAllContainer: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-end",
        },
        selectAllText: {
          color: themeColors.text,
          fontSize: SIZES.medium,
          fontWeight: "bold",
          marginLeft: rS(5),
        },
        continueButton: {
          position: "absolute",
          bottom: rS(18),
          width: rS(200),
          alignSelf: "center",
          padding: rMS(10),
          borderTopLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
      }),
    [themeColors]
  );

  const renderItem = ({ item }: { item: Topic }) => {
    const opacity = item.isChecked ? 0.9 : 1;
    return (
      <View style={styles.topicContainer}>
        <View style={styles.checkBoxContainer}>
          <TouchableOpacity onPress={() => handleTopicPress(item)}>
            {selectionMode &&
              (item.isChecked ? (
                <Ionicons
                  name="checkmark-circle-sharp"
                  size={24}
                  color={themeColors.icon}
                />
              ) : (
                <Feather name="circle" size={24} color="black" />
              ))}
          </TouchableOpacity>
        </View>
        <View style={{ opacity }}>
          <TimelineCategoryItem
            category={{
              id: item.id.toString(),
              name: item.title,
              color: item.color,
              icon: "book",
            }}
            onPress={() => handleTopicPress(item)}
            onLongPress={() => handleTopicLongPress(item)}
            width={screenWidth}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Topic(s)</Text>
      <TouchableOpacity
        onPress={handleSelectAll}
        style={styles.selectAllContainer}
      >
        <View style={styles.checkBox}>
          {selectedTopics.length === topics?.length ? (
            <Ionicons
              name="checkmark-circle-sharp"
              size={24}
              color={themeColors.icon}
            />
          ) : selectedTopics.length > 0 ? (
            <Feather name="circle" size={22} color={themeColors.text} />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={themeColors.text}
            />
          )}
        </View>
        <Text style={styles.selectAllText}>Select All</Text>
      </TouchableOpacity>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={topics}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        key={screenWidth}
      />
      {selectedTopics.length > 0 && (
        <GameButton
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      )}
    </View>
  );
};

const darkColors = [
  "#1A1D23",
  "#2F3640",
  "#3B3F54",
  "#454F63",
  "#5A5F72",
  "#665D7E",
  "#77618F",

  "#876A9D",
  "#977CA7",
  "#A788B5",
  "#B67D8A",
  "#C66C7A",
  "#D5636F",
  "#E45973",
  "#F2557A",
  "#2C3E50",
  "#3A4055",
  "#463A54",
  "#5C4B63",
  "#742F4B",
];

const getRandomColor = () => {
  return darkColors[Math.floor(Math.random() * darkColors.length)];
};

export default GameTopics;
