import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  BackHandler,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Course, Topic } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import GameButton from "../../components/GameButton";
import TimelineCategoryItem from "../../components/TimelineCategoryItem";
import ErrorMessage from "../../components/ErrorMessage";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import { getCourseTopics } from "../../services/CoursesApiCalls";
import axios from "axios";
import ApiUrl from "../../config";

const GameTopics: React.FC = () => {
  const { userToken } = useAuth();
  const { course, isSinglePlayer } = useLocalSearchParams();
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const parsedCourse: Course | null = useMemo(() => {
    try {
      if (!course) {
        return null;
      }
      const parsed = typeof course === "string" ? JSON.parse(course) : course;
      return parsed;
    } catch (error) {
      console.error("GameTopics - Error parsing course:", error);
      console.error("GameTopics - Course value that failed to parse:", course);
      return null;
    }
  }, [course]);

  // Handle back navigation - go to GameCourses
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back(); // This will go back to GameCourses
        return true; // Prevent default back action
      }
    );
    return () => backHandler.remove();
  }, []);

  // Early return if no course data
  if (!parsedCourse) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <Text
          style={{
            color: themeColors.text,
            textAlign: "center",
            marginTop: 50,
          }}
        >
          Course data not found. Please try again.
        </Text>
      </View>
    );
  }

  const fetchTopics = async (): Promise<Topic[]> => {
    const topics = await getCourseTopics(
      parseInt(parsedCourse.id),
      userToken?.token
    );
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

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const handleCreateGame = useCallback(async (topicsToUse: Topic[]) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);

      // Parse topics to get their IDs
      const parsedTopics: number[] = topicsToUse.map((t) => t.id);

      // Validate that we have topics to create a game with
      if (parsedTopics.length === 0) {
        setErrorMessage("Please select at least one topic to create a game.");
        return;
      }

      // Create a new game by making a POST request to the backend
      // Backend automatically selects questions from all levels (Beginner, Intermediate, Advanced, Master)
      // Do NOT send level parameter - backend handles it automatically
      const response = await axios.post(
        `${ApiUrl}/games/`,
        {
          topics: parsedTopics,
        },
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      // Extract the game code from the response
      const gameCode = response.data.code;
      const gameId = response.data.id;

      if (isSinglePlayer === "true") {
        router.navigate({
          pathname: "SinglePlayerGame",
          params: {
            code: gameCode,
            gameId: gameId,
            course: course?.toString(),
            topics: JSON.stringify(parsedTopics),
          },
        });
      } else {
        router.navigate({
          pathname: "GameWaiting",
          params: {
            level: "all",
            topics: JSON.stringify(parsedTopics),
            course: course?.toString(),
            isCreator: "true",
            code: gameCode,
            gameId: gameId,
          },
        });
      }
    } catch (error) {
      // Let ErrorMessage component handle the user-friendly conversion
      console.log(error.response.data);
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "An unexpected error occurred while creating the game."
        );
      }
    }
  }, [userToken?.token, course]);

  const handleTopicPress = (topic: Topic) => {
    if (selectedTopics.length === 0) {
      // Single topic selection - create game immediately
      handleCreateGame([topic]);
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
    // Create game immediately with selected topics
    handleCreateGame(selectedTopics);
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
        instructionText: {
          color: themeColors.textSecondary,
          fontSize: SIZES.small,
          textAlign: "center",
          marginBottom: rV(10),
          fontStyle: "italic",
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
      <Text style={styles.instructionText}>
        Press and hold to select multiple topics
      </Text>
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
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
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
