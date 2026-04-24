import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Text, useColorScheme, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import axios from "axios";

import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import { Question, Answer } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";

// --- UTC time window check ---
function isExamWindowOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const hour = now.getUTCHours();

  if (day === 5 && hour >= 19) return true; // Friday 7pm+
  if (day === 6) return true; // All Saturday
  if (day === 0 && hour <= 23) return true; // All Sunday (until 11:59pm)
  return false;
}

function getCountdownToExam(): string {
  const now = new Date();
  // Next Friday 7pm UTC
  const daysUntilFriday = (5 - now.getUTCDay() + 7) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilFriday);
  next.setUTCHours(19, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 7);

  const diff = next.getTime() - now.getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

// Mock 30 questions for the weekly exam
const MOCK_EXAM_QUESTIONS: Question[] = Array.from({ length: 30 }, (_, i) => ({
  text: `Weekly Exam Question ${i + 1}`,
  id: 9000 + i,
  level: "medium",
  duration: "20",
  content: `What is the correct answer for concept #${i + 1}?`,
}));

const MOCK_EXAM_ANSWERS: Answer[] = MOCK_EXAM_QUESTIONS.flatMap((q) => {
  const correctIdx = Math.floor(Math.random() * 4);
  return Array.from({ length: 4 }, (_, j) => ({
    text: `Option ${String.fromCharCode(65 + j)}`,
    id: q.id * 10 + j,
    isRight: j === correctIdx,
    question: q.id,
    isSelected: false,
    isCorrect: j === correctIdx,
    content: j === correctIdx ? "Correct Answer" : `Distractor ${j + 1}`,
  }));
});

export default function WeeklyExam() {
  const { userToken, userInfo } = useAuth();
  const { playCorrect, playWrong, startMusic, stopMusic, musicMuted } = useGameAudio();
  const insets = useSafeAreaInsets();

  const { startGame, endGame, answerQuestion, score, streak, multiplier, timeLimit } = useGameStore();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>(MOCK_EXAM_ANSWERS);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [gameQuestions] = useState<Question[]>(MOCK_EXAM_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20000);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState("");

  const startTimeRef = useRef(0);
  const questionStartMsRef = useRef(0);

  const progressBarWidth = useRef(new Animated.Value(100)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Entry guard
  const windowOpen = useMemo(() => isExamWindowOpen(), []);

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

  // Timer logic — per question
  useEffect(() => {
    if (!windowOpen || gameQuestions.length === 0 || gameEnded) return;

    startTimeRef.current = Date.now();
    questionStartMsRef.current = Date.now();
    const durationMs = timeLimit * 1000;
    setTimeLeft(durationMs);
    progressBarWidth.setValue(100);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = durationMs - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        Animated.timing(progressBarWidth, { toValue: 0, duration: 1000, useNativeDriver: false }).start();
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        const newWidth = (remaining / durationMs) * 100;
        Animated.timing(progressBarWidth, { toValue: newWidth, duration: 1000, useNativeDriver: false }).start();
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
        Animated.sequence([
          Animated.timing(streakScale, { toValue: 1.4, duration: 200, useNativeDriver: true }),
          Animated.timing(streakScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
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

  // --- Styles ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: rS(16),
      marginTop: Math.max(rV(8), insets.top),
      alignItems: "center",
    },
    timerBarContainer: {
      height: rV(5),
      backgroundColor: themeColors.border,
      marginHorizontal: rS(16),
      marginTop: rV(8),
      borderRadius: 2.5,
      overflow: "hidden",
    },
    timerBar: { height: "100%", backgroundColor: themeColors.tint },
    scoreStreakContainer: { alignItems: "flex-end" },
    scoreText: { fontSize: SIZES.large, fontWeight: "bold", color: themeColors.text },
    streakText: { fontSize: SIZES.small, color: "#FF8C00", fontWeight: "bold" },
    questionCounter: { fontSize: SIZES.medium, color: themeColors.textSecondary },
    examBadge: {
      backgroundColor: themeColors.tint + "20",
      paddingHorizontal: rMS(8),
      paddingVertical: rV(2),
      borderRadius: rMS(6),
    },
    examBadgeText: {
      fontSize: rMS(9),
      fontWeight: "800",
      color: themeColors.tint,
      letterSpacing: 1,
    },
    questionContainer: { flex: 1, padding: rS(16), justifyContent: "center" },
    questionText: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(24),
    },
    answersContainer: { gap: rV(12) },
    answerButton: {
      padding: rMS(12),
      borderRadius: rMS(8),
      borderWidth: 2,
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
    },
    answerButtonSelected: {
      borderColor: themeColors.tint,
      backgroundColor: themeColors.tint + "20",
    },
    answerText: { fontSize: SIZES.medium, color: themeColors.text, textAlign: "center" },
    answerTextSelected: { fontWeight: "bold", color: themeColors.tint },
    // Guard screen
    guardContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(32),
      backgroundColor: themeColors.background,
    },
    guardTitle: {
      fontSize: rMS(24),
      fontWeight: "800",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(12),
    },
    guardSubtext: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
      marginBottom: rV(24),
    },
    guardCountdown: {
      fontSize: rMS(32),
      fontWeight: "900",
      color: themeColors.tint,
      textAlign: "center",
      marginBottom: rV(24),
    },
    guardBackBtn: {
      backgroundColor: themeColors.card,
      paddingVertical: rV(12),
      paddingHorizontal: rMS(24),
      borderRadius: rMS(12),
    },
    guardBackBtnText: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: themeColors.text,
    },
  });

  // --- Entry guard ---
  if (!windowOpen) {
    return (
      <View style={styles.guardContainer}>
        <Ionicons name="time-outline" size={48} color={themeColors.tint} />
        <Text style={styles.guardTitle}>Weekly Exam</Text>
        <Text style={styles.guardSubtext}>
          The exam window opens every Friday at 7:00 PM UTC and closes Sunday at 11:59 PM UTC.
        </Text>
        <Text style={styles.guardCountdown}>{getCountdownToExam()}</Text>
        <TouchableOpacity style={styles.guardBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.guardBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Game UI ---
  const question = gameQuestions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.questionCounter}>
            Q: {currentQuestion + 1}/{gameQuestions.length}
          </Text>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText}>WEEKLY EXAM</Text>
          </View>
        </View>
        <View style={styles.scoreStreakContainer}>
          <Text style={styles.scoreText}>{Math.round(score)} pts</Text>
          {streak > 1 && (
            <Animated.Text style={[styles.streakText, { transform: [{ scale: streakScale }] }]}>
              {streak} Streak! 🔥
            </Animated.Text>
          )}
        </View>
      </View>
      <View style={styles.timerBarContainer}>
        <Animated.View
          style={[
            styles.timerBar,
            {
              width: progressBarWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      {question && (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.content || question.text}</Text>
          <View style={styles.answersContainer}>
            {gameAnswers
              .filter((a) => a.question === question.id)
              .map((ans) => {
                const isSelected = selectedAnswers[question.id]?.includes(ans.id);
                return (
                  <TouchableOpacity
                    key={ans.id}
                    style={[styles.answerButton, isSelected && styles.answerButtonSelected]}
                    onPress={() => handleAnswerSelection(ans.id, question.id)}
                  >
                    <Text style={[styles.answerText, isSelected && styles.answerTextSelected]}>
                      {ans.content || ans.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      )}
      <ErrorMessage message={error} visible={!!error} onDismiss={() => setError("")} />
    </View>
  );
}
