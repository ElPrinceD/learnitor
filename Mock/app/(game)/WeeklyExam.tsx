import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Text, useColorScheme, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import axios from "axios";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { Question, Answer } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyExamStatus } from "../../services/WeeklyExamApiCalls";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// --- UTC time window check (uses backend dates when available) ---
function isExamWindowOpenFromBackend(startsAt?: string, endsAt?: string): boolean {
  if (!startsAt || !endsAt) return isExamWindowOpenFallback();
  const now = new Date();
  return now >= new Date(startsAt) && now <= new Date(endsAt);
}

function isExamWindowOpenFallback(): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const hour = now.getUTCHours();

  if (day === 5 && hour >= 19) return true; // Friday 7pm+
  if (day === 6) return true; // All Saturday
  if (day === 0 && hour <= 23) return true; // All Sunday (until 11:59pm)
  return false;
}

function getCountdownToDate(targetDateStr?: string): string {
  const now = new Date();
  let target: Date;
  
  if (targetDateStr) {
    target = new Date(targetDateStr);
  } else {
    // Fallback: calculate next Friday 7pm UTC
    const daysUntilFriday = (5 - now.getUTCDay() + 7) % 7 || 7;
    target = new Date(now);
    target.setUTCDate(now.getUTCDate() + daysUntilFriday);
    target.setUTCHours(19, 0, 0, 0);
    if (target <= now) target.setUTCDate(target.getUTCDate() + 7);
  }

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now!";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

function formatLocalDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

export default function WeeklyExam() {
  const { userToken, userInfo } = useAuth();
  const { playCorrect, playWrong, startMusic, stopMusic, musicMuted } = useGameAudio();
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  const { startGame, endGame, answerQuestion, score, streak, timeLimit } = useGameStore();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [gameQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20000);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState("");

  const startTimeRef = useRef(0);
  const questionStartMsRef = useRef(0);

  const progressBarWidth = useSharedValue(100);
  const streakScale = useSharedValue(1);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Fetch exam status from backend
  const { data: examStatus } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });

  const windowOpen = useMemo(
    () => isExamWindowOpenFromBackend(examStatus?.startsAt, examStatus?.endsAt),
    [examStatus]
  );

  useEffect(() => {
    if (windowOpen) {
      startMusic();
      startGame("weekly-exam", 20);
    }
    return () => stopMusic();
  }, [windowOpen]);

  useEffect(() => {
    if (!musicMuted && !gameEnded && windowOpen) startMusic();
  }, [musicMuted, gameEnded, windowOpen]);

  useEffect(() => {
    if (!windowOpen || gameQuestions.length === 0 || gameEnded) return;

    startTimeRef.current = Date.now();
    questionStartMsRef.current = Date.now();
    const durationMs = timeLimit * 1000;
    setTimeLeft(durationMs);
    progressBarWidth.value = 100;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = durationMs - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        progressBarWidth.value = withTiming(0, { duration: 1000 });
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        const newWidth = (remaining / durationMs) * 100;
        progressBarWidth.value = withTiming(newWidth, { duration: 1000 });
      }
    }, 1000);

    const timer = setTimeout(() => {
      if (!gameEnded) {
        answerQuestion(false, durationMs);
        moveToNextQuestionOrEnd();
      }
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentQuestion, timeLimit, gameQuestions, gameEnded, windowOpen]);

  const moveToNextQuestionOrEnd = () => {
    if (currentQuestion < gameQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    setGameEnded(true);
    endGame();

    try {
      await axios.post(
        `${ApiUrl}/api/weekly-exam/submit`,
        { finalScore: Math.round(score), highestStreak: streak },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
    } catch (err) {
      console.log("Error submitting weekly exam score:", err);
    }

    const scoresObject = {
      [userInfo?.user.id as number]: Math.round(score),
    };

    router.replace({
      pathname: "Results",
      params: { scores: JSON.stringify(scoresObject), gameId: "weekly-exam" },
    });
  };

  const handleAnswerSelection = (answerId: number, questionId: number) => {
    if (gameEnded) return;
    const timeTakenMs = Date.now() - questionStartMsRef.current;

    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      updated[questionId] = [answerId];

      const correctIds = gameAnswers
        .filter((a) => a.question === questionId && a.isRight)
        .map((a) => a.id);

      const isCorrect = correctIds.includes(answerId);
      answerQuestion(isCorrect, timeTakenMs);

      if (isCorrect) {
        streakScale.value = withSpring(1.4, {}, () => {
          streakScale.value = withSpring(1);
        });
        playCorrect();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        playWrong();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setTimeout(() => moveToNextQuestionOrEnd(), 500);
      return updated;
    });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value}%`,
  }));

  const animatedStreakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    blob1: {
      position: "absolute",
      top: -rV(100),
      left: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(50),
      right: -rS(100),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: "#6366F118",
    },
    headerCard: {
      overflow: "hidden",
      borderBottomLeftRadius: rMS(32),
      borderBottomRightRadius: rMS(32),
      ...shadow.medium,
      zIndex: 10,
    },
    headerBlur: {
      paddingTop: Math.max(rV(20), insets.top + rV(10)),
      paddingBottom: rV(20),
      paddingHorizontal: rS(24),
      backgroundColor: themeColors.tint + "10",
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: rV(12),
    },
    timerBarContainer: {
      height: rV(6),
      backgroundColor: themeColors.background + "80",
      borderRadius: rMS(3),
      overflow: "hidden",
      width: "100%",
    },
    timerBar: { height: "100%", backgroundColor: themeColors.tint, borderRadius: rMS(3) },
    scoreStreakContainer: { alignItems: "flex-end" },
    scoreText: { fontSize: SIZES.large, fontWeight: "900", color: themeColors.text },
    streakText: { fontSize: SIZES.small, color: "#FF8C00", fontWeight: "900", marginTop: rV(2) },
    questionCounter: { fontSize: rMS(14), fontWeight: "800", color: themeColors.textSecondary },
    examBadge: {
      backgroundColor: themeColors.tint,
      paddingHorizontal: rMS(12),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
      marginTop: rV(4),
    },
    examBadgeText: {
      fontSize: rMS(9),
      fontWeight: "900",
      color: "#fff",
      letterSpacing: 1.5,
    },
    contentArea: {
      flex: 1,
      paddingHorizontal: rS(16),
      paddingTop: rV(24),
      paddingBottom: Math.max(rV(24), insets.bottom + rV(12)),
    },
    questionCardContainer: {
      borderRadius: rMS(36),
      overflow: "hidden",
      ...shadow.large,
      marginBottom: rV(32),
    },
    questionCardBlur: {
      padding: rMS(24),
      minHeight: rV(160),
      justifyContent: "center",
      backgroundColor: themeColors.cardGlass,
    },
    questionText: {
      fontSize: rMS(20),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      lineHeight: rMS(28),
    },
    answersContainer: { gap: rV(14) },
    answerButton: {
      paddingVertical: rV(16),
      paddingHorizontal: rMS(20),
      borderRadius: rMS(32),
      borderWidth: 1.5,
      borderColor: themeColors.border + "60",
      backgroundColor: themeColors.cardGlass,
      ...shadow.light,
    },
    answerButtonSelected: {
      borderColor: themeColors.tint,
      backgroundColor: themeColors.tint + "20",
    },
    answerText: { fontSize: SIZES.medium, fontWeight: "700", color: themeColors.text, textAlign: "center" },
    answerTextSelected: { fontWeight: "900", color: themeColors.tint },
    
    // Guard screen
    guardContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(32),
      backgroundColor: themeColors.background,
    },
    guardCard: {
      borderRadius: rMS(40),
      overflow: "hidden",
      ...shadow.extraLarge,
      width: "100%",
    },
    guardCardBlur: {
      padding: rMS(32),
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
    },
    guardTitle: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(12),
      marginTop: rV(16),
      letterSpacing: -0.5,
    },
    guardSubtext: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(22),
      marginBottom: rV(32),
      fontWeight: "600",
    },
    guardCountdown: {
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.tint,
      textAlign: "center",
      marginBottom: rV(32),
      letterSpacing: -1,
    },
    guardBackBtn: {
      backgroundColor: themeColors.text,
      paddingVertical: rV(16),
      paddingHorizontal: rMS(32),
      borderRadius: rMS(32),
      width: "100%",
    },
    guardBackBtnText: {
      fontSize: rMS(15),
      fontWeight: "900",
      color: themeColors.background,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
  });

  if (!windowOpen) {
    const examIsUpcoming = examStatus && new Date() < new Date(examStatus.startsAt);
    const examIsOver = examStatus && new Date() > new Date(examStatus.endsAt);

    return (
      <View style={styles.guardContainer}>
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.guardCard}>
          <BlurView intensity={80} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.guardCardBlur}>
            <Ionicons name="time" size={64} color={themeColors.tint} />
            <Text style={styles.guardTitle}>Weekly Exam</Text>
            <Text style={styles.guardSubtext}>
              {examIsUpcoming
                ? `The exam starts ${formatLocalDateTime(examStatus?.startsAt)}.`
                : examIsOver
                ? `The exam has ended. It ended ${formatLocalDateTime(examStatus?.endsAt)}.`
                : "The exam window opens every Friday at 7:00 PM UTC and closes Sunday at 11:59 PM UTC."}
            </Text>
            {examIsUpcoming && (
              <Text style={styles.guardCountdown}>{getCountdownToDate(examStatus?.startsAt)}</Text>
            )}
            {!examIsUpcoming && !examIsOver && (
              <Text style={styles.guardCountdown}>{getCountdownToDate()}</Text>
            )}
            <TouchableOpacity style={styles.guardBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.guardBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </View>
    );
  }

  const question = gameQuestions[currentQuestion];

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerCard}>
        <BlurView intensity={70} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.headerBlur}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.questionCounter}>
                Q: {currentQuestion + 1} / {gameQuestions.length}
              </Text>
              <View style={styles.examBadge}>
                <Text style={styles.examBadgeText}>WEEKLY EXAM</Text>
              </View>
            </View>
            <View style={styles.scoreStreakContainer}>
              <Text style={styles.scoreText}>{Math.round(score)} pts</Text>
              {streak > 1 && (
                <Animated.Text style={[styles.streakText, animatedStreakStyle]}>
                  {streak} Streak! 🔥
                </Animated.Text>
              )}
            </View>
          </View>
          <View style={styles.timerBarContainer}>
            <Animated.View style={[styles.timerBar, animatedProgressStyle]} />
          </View>
        </BlurView>
      </Animated.View>

      {question && (
        <View style={styles.contentArea}>
          <Animated.View key={`q-${currentQuestion}`} entering={FadeIn.duration(400)} style={styles.questionCardContainer}>
            <BlurView intensity={80} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.questionCardBlur}>
              <Text style={styles.questionText}>{question.content || question.text}</Text>
            </BlurView>
          </Animated.View>

          <View style={styles.answersContainer}>
            {gameAnswers
              .filter((a) => a.question === question.id)
              .map((ans, idx) => {
                const isSelected = selectedAnswers[question.id]?.includes(ans.id);
                return (
                  <Animated.View key={ans.id} entering={FadeInUp.duration(400).delay(idx * 100).springify()}>
                    <AnimatedTouchable
                      style={[styles.answerButton, isSelected && styles.answerButtonSelected]}
                      onPress={() => handleAnswerSelection(ans.id, question.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.answerText, isSelected && styles.answerTextSelected]}>
                        {ans.content || ans.text}
                      </Text>
                    </AnimatedTouchable>
                  </Animated.View>
                );
              })}
          </View>
        </View>
      )}
      <ErrorMessage message={error} visible={!!error} onDismiss={() => setError("")} />
    </View>
  );
}
