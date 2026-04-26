import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  BackHandler,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import CoursesList from "../../components/CoursesList";
import { router, useLocalSearchParams } from "expo-router";
import { Course } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import { getCourses } from "../../services/CoursesApiCalls";
import { queryClient } from "../../QueryClient";
import ErrorMessage from "../../components/ErrorMessage";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const GameCourses: React.FC = () => {
  const { userToken } = useAuth();
  const { isSinglePlayer } = useLocalSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  // Back button scale
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const {
    status: coursesStatus,
    data: coursesData,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses", userToken?.token],
    queryFn: () => getCourses(userToken?.token),
  });

  const handleCoursePress = (course: Course) => {
    router.navigate({
      pathname: "GameTopics",
      params: {
        course: JSON.stringify(course),
        isSinglePlayer: isSinglePlayer,
      },
    });
  };

  useEffect(() => {
    if (coursesStatus === "error") {
      setErrorMessage(coursesError?.message || "An error occurred");
    }
  }, [coursesStatus]);

  // Handle back navigation - go to GameIntro
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.back(); // This will go back to GameIntro
        return true; // Prevent default back action
      }
    );
    return () => backHandler.remove();
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchCourses();
    } catch (error) {
      setErrorMessage("Failed to refresh courses");
    }
  }, [queryClient, userToken?.token, refetchCourses]);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: themeColors.background,
        },
        // Glassmorphism background blobs
        blob1: {
          position: "absolute",
          top: -rV(80),
          right: -rS(60),
          width: rS(240),
          height: rS(240),
          borderRadius: rS(120),
          backgroundColor: themeColors.tint + "15",
        },
        blob2: {
          position: "absolute",
          bottom: rV(100),
          left: -rS(80),
          width: rS(200),
          height: rS(200),
          borderRadius: rS(100),
          backgroundColor: "#6366F112",
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
        },
        backRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: rS(16),
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
          paddingHorizontal: rS(24),
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
          fontSize: rMS(28),
          fontWeight: "900",
          letterSpacing: -0.5,
        },
        heroSubtext: {
          fontSize: rMS(12),
          color: themeColors.textSecondary,
          marginTop: rV(6),
          lineHeight: rMS(18),
        },
      }),
    [themeColors, insets]
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Frosted glass top bar */}
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
            <Ionicons name="arrow-back" size={22} color={themeColors.text} />
          </AnimatedTouchable>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>Step 1</Text>
          <Text style={styles.header}>Select a Course</Text>
          <Text style={styles.heroSubtext}>
            Choose from your enrolled courses to get started.
          </Text>
        </Animated.View>

        <CoursesList
          onCoursePress={handleCoursePress}
          courses={coursesData || []}
          onRefresh={onRefresh}
          refreshing={coursesStatus === "pending"}
          loading={coursesStatus === "pending"}
        />
      </View>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default GameCourses;
