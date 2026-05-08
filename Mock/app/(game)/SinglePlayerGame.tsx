import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Text, useColorScheme, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons handled by Lucide
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
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
import { getGameDetails } from "../../services/GamesApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SinglePlayerGame() {
  const { userToken, userInfo } = useAuth();
  const { playCorrect, playWrong, startMusic, stopMusic, musicMuted } = useGameAudio();
  const { gameId, gameCode } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const shadow = useShadows();
  
  const { startGame, endGame, answerQuestion, score, streak, multiplier, timeLimit } = useGameStore();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number[] }>({});
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20000);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState<string>("");

  const startTimeRef = useRef<number>(0);
  const questionStartMsRef = useRef<number>(0);

  const progressBarWidth = useSharedValue(100);
  const streakScale = useSharedValue(1);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    startMusic();
    return () => stopMusic();
  }, [startMusic, stopMusic]);

  useEffect(() => {
    if (!musicMuted && !gameEnded) startMusic();
  }, [musicMuted, gameEnded, startMusic]);

  // Fetch game details from the backend (mocking single player fetch for now, similar to multiplayer)
  const { data: gameDetails, error: gameDetailsError } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  useEffect(() => {
    if (gameDetails && gameDetails.questions) {
      setGameQuestions(gameDetails.questions);
      const duration = gameDetails.duration || 20;
      startGame(gameId as string, duration);
      setTimeLeft(duration * 1000);
      
      const fetchAllAnswers = async () => {
        try {
          const answersPromises = gameDetails.questions.map((q: Question) =>
            getPracticeAnswers(q.id, userToken?.token)
          );
          const answers = await Promise.all(answersPromises);
          setGameAnswers(answers.flat());
        } catch (error) {
          setError("Failed to load questions. Please try again.");
        }
      };
      fetchAllAnswers();
    }
  }, [gameDetails, userToken]);

  // Timer logic
  useEffect(() => {
    if (gameQuestions.length === 0 || gameEnded) return;

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
        // Did not answer in time -> counted as wrong
        answerQuestion(false, durationMs);
        moveToNextQuestionOrEnd();
      }
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentQuestion, timeLimit, gameQuestions, gameEnded]);

  const moveToNextQuestionOrEnd = () => {
    if (currentQuestion < gameQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameEnded(true);
    endGame();

    try {
      // 1. Prepare score to submit (Zustand maintains final math score)
      // Call custom backend endpoint
      await axios.post(
        `${ApiUrl}/api/games/single-player/submit`,
        {
          gameId: gameId,
          finalScore: Math.round(score),
          highestStreak: streak // Or track a max streak in Zustand
        },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
    } catch (err) {
      console.log('Error submitting single player score:', err);
    }

    // Redirect to results mimicking multiplayer logic for seamlessness 
    const scoresObject = {
      [userInfo?.user.id as number]: Math.round(score),
    };
    
    router.replace({
      pathname: "Results",
      params: { scores: JSON.stringify(scoresObject), gameId },
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
      
      // Zustand interaction
      answerQuestion(isCorrect, timeTakenMs);
      
      if (isCorrect) {
        // Animate streak
        streakScale.value = withSpring(1.4, {}, () => {
          streakScale.value = withSpring(1);
        });
        playCorrect();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        playWrong();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Next question
      setTimeout(() => {
        moveToNextQuestionOrEnd();
      }, 500);

      return updated;
    });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value}%`,
  }));

  const animatedStreakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const question = gameQuestions[currentQuestion];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    blob1: {
      position: "absolute",
      top: -rV(100),
      right: -rS(60),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(60),
      left: -rS(100),
      width: rS(280),
      height: rS(280),
      borderRadius: rS(140),
      backgroundColor: "#F9731618",
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
      backgroundColor: themeColors.tint + "08",
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: rV(12),
    },
    questionCounter: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.textSecondary,
    },
    scoreStreakContainer: {
      alignItems: 'flex-end',
    },
    scoreText: {
      fontSize: SIZES.large,
      fontWeight: '900',
      color: themeColors.text,
    },
    streakText: {
      fontSize: SIZES.small,
      color: '#F97316',
      fontWeight: '900',
      marginTop: rV(2),
    },
    timerBarContainer: {
      height: rV(6),
      backgroundColor: themeColors.background + "80",
      borderRadius: rMS(3),
      overflow: 'hidden',
      width: '100%',
    },
    timerBar: {
      height: '100%',
      backgroundColor: themeColors.tint,
      borderRadius: rMS(3),
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
      minHeight: rV(140),
      justifyContent: 'center',
      backgroundColor: themeColors.cardGlass,
    },
    questionText: {
      fontSize: rMS(20),
      fontWeight: '900',
      color: themeColors.text,
      textAlign: 'center',
      lineHeight: rMS(28),
    },
    answersContainer: {
      gap: rV(14),
    },
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
      backgroundColor: themeColors.tint + '20',
    },
    answerText: {
      fontSize: SIZES.medium,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
    },
    answerTextSelected: {
      fontWeight: '900',
      color: themeColors.tint,
    },
    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      marginTop: rV(12),
      fontWeight: '700',
    },
  });

  if (gameQuestions.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <Text style={styles.loadingText}>Loading single player game...</Text>
        <ErrorMessage message={error} visible={!!error} onDismiss={() => setError("")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Frosted glass header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerCard}>
        <BlurView intensity={70} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.headerBlur}>
          <View style={styles.headerTopRow}>
            <Text style={styles.questionCounter}>
              Q: {currentQuestion + 1} / {gameQuestions.length}
            </Text>
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

      {/* Question & Answers */}
      {question && (
        <View style={styles.contentArea}>
          <Animated.View key={`q-${currentQuestion}`} entering={FadeIn.duration(400)} style={styles.questionCardContainer}>
            <BlurView intensity={80} tint={colorScheme === "dark" ? "dark" : "light"} style={styles.questionCardBlur}>
              <Text style={styles.questionText}>{question.content}</Text>
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
                        {ans.content}
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
