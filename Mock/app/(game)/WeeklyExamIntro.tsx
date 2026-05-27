import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trophy, Timer, AlertCircle, ChevronLeft, ShieldAlert, Shuffle } from "lucide-react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyExamStatus } from "../../services/WeeklyExamApiCalls";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows, SIZES } from "../../constants";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WeeklyExamIntro() {
  const { userToken } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  // Fetch exam status to get current week and details
  const { data: examStatus, isLoading } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });

  const backScale = useSharedValue(1);
  const startScale = useSharedValue(1);

  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  const startAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startScale.value }],
  }));

  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleStartExam = useCallback(() => {
    router.replace("/(game)/WeeklyExam");
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Background glow blobs matching premium aesthetic
    blob1: {
      position: "absolute",
      top: -rV(60),
      left: -rS(60),
      width: rS(280),
      height: rS(280),
      borderRadius: rS(140),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: -rV(80),
      right: -rS(80),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#FF9800" + "12",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(12), insets.top + rV(8)),
      paddingBottom: rV(12),
      zIndex: 10,
    },
    backButton: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(20),
      backgroundColor: themeColors.cardGlass,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    headerTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
    },
    placeholderHeader: {
      width: rMS(40),
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: rMS(20),
      paddingBottom: Math.max(rV(30), insets.bottom + rV(20)),
    },
    // Hero details
    heroSection: {
      alignItems: "center",
      marginVertical: rV(20),
    },
    iconCircle: {
      width: rMS(76),
      height: rMS(76),
      borderRadius: rMS(38),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(16),
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    swText: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.tint,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    examTitle: {
      fontSize: rMS(26),
      fontWeight: "900",
      color: themeColors.text,
      marginTop: rV(6),
      textAlign: "center",
    },
    examSubtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(6),
      lineHeight: rMS(20),
      paddingHorizontal: rS(10),
    },
    // Details/info list
    infoCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      marginBottom: rV(20),
      ...shadow.medium,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: rV(10),
      gap: rS(14),
    },
    infoIconWrapper: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(18),
      backgroundColor: themeColors.tint + "0A",
      alignItems: "center",
      justifyContent: "center",
      marginTop: rV(1),
    },
    infoTextWrapper: {
      flex: 1,
    },
    infoRowTitle: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(3),
    },
    infoRowDesc: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      lineHeight: rMS(17),
    },
    // Caution/Rules banner
    warningBanner: {
      backgroundColor: "#D22B2B" + "0A",
      borderWidth: 1,
      borderColor: "#D22B2B" + "30",
      borderRadius: rMS(18),
      padding: rMS(16),
      flexDirection: "row",
      alignItems: "flex-start",
      gap: rS(12),
      marginBottom: rV(24),
    },
    warningTextWrapper: {
      flex: 1,
    },
    warningTitle: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: "#DC2626",
      marginBottom: rV(2),
    },
    warningDesc: {
      fontSize: rMS(11.5),
      color: "#DC2626" + "DD",
      lineHeight: rMS(16),
    },
    // Footer button
    footer: {
      marginTop: "auto",
    },
    startButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(24),
      paddingVertical: rV(15),
      alignItems: "center",
      justifyContent: "center",
      ...shadow.medium,
    },
    startButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
  });

  const studyWeek = examStatus?.currentWeek ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Header bar */}
      <View style={styles.header}>
        <AnimatedTouchable
          style={[styles.backButton, backAnimStyle]}
          onPress={handleGoBack}
          onPressIn={() => onPressIn(backScale)}
          onPressOut={() => onPressOut(backScale)}
          activeOpacity={1}
        >
          <ChevronLeft size={24} color={themeColors.text} />
        </AnimatedTouchable>
        <Text style={styles.headerTitle}>Weekly Exam</Text>
        <View style={styles.placeholderHeader} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.heroSection}
        >
          <View style={styles.iconCircle}>
            <Trophy size={36} color={themeColors.tint} />
          </View>
          <Text style={styles.swText}>
            {examStatus?.seasonName ? `${examStatus.seasonName} · ` : ""}
            {studyWeek ? `Study Week ${studyWeek}` : "Study Week"}
          </Text>
          <Text style={styles.examTitle}>Ready for the Challenge?</Text>
          <Text style={styles.examSubtitle}>
            Test your knowledge of the all topics and secure your spot on the leaderboard.
          </Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.infoCard}
        >
          {/* Rules/Info Rows */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Timer size={20} color={themeColors.tint} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoRowTitle}>Timed Assessment</Text>
              <Text style={styles.infoRowDesc}>
                You will have 20 seconds to answer each question. Speed and accuracy count towards your final score.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Trophy size={20} color={themeColors.tint} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoRowTitle}>Leaderboard Impact</Text>
              <Text style={styles.infoRowDesc}>
                Your exam score determines your overall rank and qualifies you for knockout bracket selection.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Shuffle size={18} color={themeColors.tint} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoRowTitle}>Randomized Selection</Text>
              <Text style={styles.infoRowDesc}>
                A pool of 30 questions is randomly selected each week from the content already available inside the app, ensuring a fresh test of your retention.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Critical warning banner */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.warningBanner}
        >
          <ShieldAlert size={22} color="#DC2626" style={{ marginTop: rV(1) }} />
          <View style={styles.warningTextWrapper}>
            <Text style={styles.warningTitle}>Single Attempt Only</Text>
            <Text style={styles.warningDesc}>
              Once you start, you cannot pause or restart the exam. Closing the app or losing connection will submit your current progress automatically.
            </Text>
          </View>
        </Animated.View>

        {/* Footer Action */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.footer}
        >
          <AnimatedTouchable
            style={[styles.startButton, startAnimStyle]}
            onPress={handleStartExam}
            onPressIn={() => onPressIn(startScale)}
            onPressOut={() => onPressOut(startScale)}
            activeOpacity={1}
            disabled={isLoading}
          >
            <Text style={styles.startButtonText}>Start Assessment</Text>
          </AnimatedTouchable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
