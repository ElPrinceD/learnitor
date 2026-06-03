import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, StatusBar } from "react-native";
import React, { useState, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import PracticeLevel from "../../components/PracticeLevel";
import { Level } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ErrorMessage from "../../components/ErrorMessage";

import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import Colors from "../../constants/Colors";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const GameLevel: React.FC = () => {
  const { topics, topic, course } = useLocalSearchParams();
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const shadow = useShadows();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const handleLevelPress = async (level: Level) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);

      let parsedTopics: number[] = [];

      // Parse topics if it is a string
      if (typeof topics === "string") {
        parsedTopics = JSON.parse(topics).map((t: any) => t.id);
      } else if (Array.isArray(topics)) {
        parsedTopics = topics.map((t: any) => t.id);
      }

      // Ensure the topic is a string and parse it, then add to parsedTopics
      if (typeof topic === "string") {
        const parsedTopic = JSON.parse(topic);
        parsedTopics.push(parsedTopic.id);
      }

      // Validate that we have topics to create a game with
      if (parsedTopics.length === 0) {
        setErrorMessage("Please select at least one topic to create a game.");
        return;
      }

      // Create a new game by making a POST request to the backend
      const response = await axios.post(
        `${ApiUrl}/games/`,
        {
          level: level.title,
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

      // Navigate to the GameWaiting screen with the necessary parameters
      router.navigate({
        pathname: "GameWaiting",
        params: {
          level: level.title,
          topics: JSON.stringify(parsedTopics),
          course: course?.toString(),
          isCreator: "true", // Convert boolean to string
          code: gameCode,
          gameId: gameId,
        },
      });
    } catch (error) {
      // Let ErrorMessage component handle the user-friendly conversion
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
  };

  const levels: Level[] = [
    {
      title: "Beginner",
      image: require("../../assets/images/Beginner.jpg"),
    },
    {
      title: "Intermediate",
      image: require("../../assets/images/Intermediate.png"),
    },
    {
      title: "Advanced",
      image: require("../../assets/images/Advanced.jpg"),
    },
    { title: "Master", image: require("../../assets/images/Master.jpg") },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(70),
      right: -rS(50),
      width: rS(230),
      height: rS(230),
      borderRadius: rS(115),
      backgroundColor: themeColors.tint + "15",
    },
    blob2: {
      position: "absolute",
      bottom: rV(80),
      left: -rS(70),
      width: rS(200),
      height: rS(200),
      borderRadius: rS(100),
      backgroundColor: "#F59E0B12",
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
      padding: rMS(10),
      paddingTop: Math.max(rV(80), insets.top + rV(50)),
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
      marginBottom: rV(16),
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
    },
  });

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

        <Animated.View
          entering={FadeInDown.duration(250).delay(50)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>Difficulty</Text>
          <Text style={styles.header}>Select a Level</Text>
        </Animated.View>

        <PracticeLevel onPress={handleLevelPress} levels={levels} />
      </View>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default GameLevel;
