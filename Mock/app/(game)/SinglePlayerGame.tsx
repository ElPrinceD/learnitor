import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Text, useColorScheme, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import axios from "axios";

import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { getGameDetails } from "../../services/GamesApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";


export default function SinglePlayerGame() {
  const { userToken, userInfo } = useAuth();
  const { playCorrect, playWrong, startMusic, stopMusic, musicMuted } = useGameAudio();
  const { gameId, gameCode } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
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

  const progressBarWidth = useRef(new Animated.Value(100)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

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

      // Next question
      setTimeout(() => {
        moveToNextQuestionOrEnd();
      }, 500);

      return updated;
    });
  };

  const renderActiveQuestion = () => {
    const question = gameQuestions[currentQuestion];
    if (!question) return null;

    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.content}</Text>
        <View style={styles.answersContainer}>
          {gameAnswers
            .filter((a) => a.question === question.id)
            .map((ans) => {
              const isSelected = selectedAnswers[question.id]?.includes(ans.id);
              return (
                <TouchableOpacity
                  key={ans.id}
                  style={[
                    styles.answerButton,
                    isSelected && styles.answerButtonSelected,
                  ]}
                  onPress={() => handleAnswerSelection(ans.id, question.id)}
                >
                  <Text style={[styles.answerText, isSelected && styles.answerTextSelected]}>
                    {ans.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: rS(20),
      marginTop: Math.max(rV(10), insets.top),
      alignItems: 'center',
    },
    timerBarContainer: {
      height: rV(6),
      backgroundColor: themeColors.border,
      marginHorizontal: rS(20),
      marginTop: rV(10),
      borderRadius: 3,
      overflow: 'hidden',
    },
    timerBar: {
      height: '100%',
      backgroundColor: themeColors.tint,
    },
    scoreStreakContainer: {
      alignItems: 'flex-end',
    },
    scoreText: {
      fontSize: SIZES.xLarge,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    streakText: {
      fontSize: SIZES.medium,
      color: '#FF8C00', // Fire color
      fontWeight: 'bold',
    },
    questionCounter: {
      fontSize: SIZES.large,
      color: themeColors.textSecondary,
    },
    questionContainer: {
      flex: 1,
      padding: rS(20),
      justifyContent: 'center',
    },
    questionText: {
      fontSize: SIZES.xxLarge,
      fontWeight: 'bold',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: rV(30),
    },
    answersContainer: {
      gap: rV(15),
    },
    answerButton: {
      padding: rMS(15),
      borderRadius: rMS(10),
      borderWidth: 2,
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
    },
    answerButtonSelected: {
      borderColor: themeColors.tint,
      backgroundColor: themeColors.tint + '20',
    },
    answerText: {
      fontSize: SIZES.large,
      color: themeColors.text,
      textAlign: 'center',
    },
    answerTextSelected: {
      fontWeight: 'bold',
      color: themeColors.tint,
    },
  });

  if (gameQuestions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Loading single player game...</Text>
        <ErrorMessage message={error} visible={!!error} onDismiss={() => setError("")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Q: {currentQuestion + 1}/{gameQuestions.length}
        </Text>
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
        <Animated.View style={[styles.timerBar, { width: progressBarWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
      {renderActiveQuestion()}
    </View>
  );
}
