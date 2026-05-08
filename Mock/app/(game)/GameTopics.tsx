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
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle2, Circle, BookOpen } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Course, Topic } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import GameButton from "../../components/GameButton";
import ErrorMessage from "../../components/ErrorMessage";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import { getCourseTopics } from "../../services/CoursesApiCalls";
import axios from "axios";
import ApiUrl from "../../config";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  // Back button animation
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

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
      <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: themeColors.text, textAlign: "center", marginTop: 50 }}>
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
          backgroundColor: themeColors.background,
        },
        blob1: {
          position: "absolute",
          top: -rV(60),
          left: -rS(70),
          width: rS(220),
          height: rS(220),
          borderRadius: rS(110),
          backgroundColor: themeColors.tint + "15",
        },
        blob2: {
          position: "absolute",
          bottom: rV(120),
          right: -rS(90),
          width: rS(260),
          height: rS(260),
          borderRadius: rS(130),
          backgroundColor: "#10B98112",
        },
        topBar: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: Math.max(rV(80), insets.top + rV(50)),
          zIndex: 10,
        },
        scrollArea: {
          flex: 1,
          paddingTop: Math.max(rV(80), insets.top + rV(50)),
          paddingHorizontal: rMS(10),
        },
        backRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: rV(8),
          marginTop: rV(8),
        },
        backButton: {
          width: rMS(44),
          height: rMS(44),
          borderRadius: rMS(22),
          backgroundColor: themeColors.cardGlass,
          alignItems: "center",
          justifyContent: "center",
          ...shadow.small,
        },
        heroSection: {
          paddingHorizontal: rS(14),
          marginBottom: rV(12),
        },
        heroLabel: {
          fontSize: rMS(10),
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 3,
          color: themeColors.tint,
          marginBottom: rV(6),
        },
        header: {
          color: themeColors.text,
          fontSize: rMS(26),
          fontWeight: "900",
          letterSpacing: -0.5,
          marginBottom: rV(4),
        },
        instructionText: {
          color: themeColors.textSecondary,
          fontSize: rMS(12),
          lineHeight: rMS(18),
        },
        topicCard: {
          borderRadius: rMS(24),
          padding: rMS(16),
          marginBottom: rV(10),
          borderWidth: 1.5,
          borderColor: themeColors.border + "40",
          backgroundColor: themeColors.cardGlass,
          flexDirection: "row",
          alignItems: "center",
          ...shadow.small,
        },
        topicCardChecked: {
          borderColor: themeColors.tint,
          backgroundColor: themeColors.tint + "12",
        },
        topicIconCircle: {
          width: rMS(44),
          height: rMS(44),
          borderRadius: rMS(14),
          alignItems: "center",
          justifyContent: "center",
          marginRight: rS(14),
        },
        topicTitle: {
          flex: 1,
          fontSize: rMS(14),
          fontWeight: "700",
          color: themeColors.text,
          letterSpacing: -0.2,
        },
        topicCheckbox: {
          marginLeft: rS(8),
        },
        continueButton: {
          position: "absolute",
          bottom: Math.max(rS(24), insets.bottom + rS(12)),
          width: rS(220),
          alignSelf: "center",
          padding: rMS(10),
          borderRadius: rMS(28),
        },
      }),
    [themeColors, insets]
  );

  const renderItem = ({ item, index }: { item: Topic; index: number }) => {
    const isChecked = item.isChecked;
    return (
      <Animated.View entering={FadeInDown.duration(350).delay(80 + index * 50)}>
        <TouchableOpacity
          style={[
            styles.topicCard,
            isChecked && styles.topicCardChecked,
          ]}
          activeOpacity={0.7}
          onPress={() => handleTopicPress(item)}
          onLongPress={() => handleTopicLongPress(item)}
        >
          <View
            style={[
              styles.topicIconCircle,
              { backgroundColor: (item.color || themeColors.tint) + "20" },
            ]}
          >
            <BookOpen size={22} color={item.color || themeColors.tint} />
          </View>
          <Text style={styles.topicTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {selectionMode && (
            <View style={styles.topicCheckbox}>
              {isChecked ? (
                <CheckCircle2 size={22} color={themeColors.tint} />
              ) : (
                <Circle size={22} color={themeColors.textSecondary} />
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.topBar}
      />

      <View style={styles.scrollArea}>
        {/* Back Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.backRow}
        >
          <AnimatedTouchable
            style={[styles.backButton, backAnimStyle]}
            onPress={() => router.back()}
            onPressIn={() => {
              backScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            activeOpacity={1}
          >
            <ArrowLeft size={22} color={themeColors.text} />
          </AnimatedTouchable>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>Step 2</Text>
          <Text style={styles.header}>Select Topic(s)</Text>
          <Text style={styles.instructionText}>
            Tap to pick one, or press & hold to select multiple topics.
          </Text>
        </Animated.View>

        {/* Select All */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <TouchableOpacity
            onPress={handleSelectAll}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-end",
              marginBottom: rV(12),
              backgroundColor: themeColors.cardGlass,
              paddingVertical: rV(8),
              paddingHorizontal: rMS(14),
              borderRadius: rMS(20),
              ...shadow.light,
            }}
          >
            <View style={{ width: rS(22), height: rV(22), justifyContent: "center", alignItems: "center" }}>
              {selectedTopics.length === topics?.length ? (
                <CheckCircle2
                  size={22}
                  color={themeColors.tint}
                />
              ) : selectedTopics.length > 0 ? (
                <Circle size={20} color={themeColors.text} />
              ) : (
                <CheckCircle2
                  size={22}
                  color={themeColors.text}
                  strokeWidth={1.5}
                />
              )}
            </View>
            <Text style={{ color: themeColors.text, fontSize: rMS(12), fontWeight: "800", marginLeft: rS(5) }}>Select All</Text>
          </TouchableOpacity>
        </Animated.View>

        <FlatList
          showsVerticalScrollIndicator={false}
          data={topics}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: rV(100) }}
        />
      </View>

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
