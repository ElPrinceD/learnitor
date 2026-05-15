import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Animated as RNAnimated,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";

import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { getGameDetails, submitGameResult } from "../../services/GamesApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import Questions from "../../components/Questions";
import { Question, Answer, GameDetailsResponse } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES } from "../../constants/index.js";
import ErrorMessage from "../../components/ErrorMessage";
import QuizGlassHeader from "../../components/game/QuizGlassHeader";
import GameQuestionsScroll from "../../components/game/GameQuestionsScroll";
import PowerUpStrip from "../../components/game/PowerUpStrip";
import PrinceWisdomBanner from "../../components/game/PrinceWisdomBanner";
import GameLoadingShell from "../../components/game/GameLoadingShell";
import { PRINCE_WISDOM_PREFIXES } from "../../components/game/princeWisdom";

export default function SinglePlayerGame() {
  const { userToken, userInfo } = useAuth();
  const {
    playCorrect,
    playWrong,
    startMusic,
    stopMusic,
    musicMuted,
    setMusicMuted,
    soundMuted,
    setSoundMuted,
  } = useGameAudio();
  const { gameId } = useLocalSearchParams();

  const { startGame, endGame, answerQuestion, score, streak } = useGameStore();
  const queryClient = useQueryClient();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(20000);
  const [timeLeft, setTimeLeft] = useState<number>(20000);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState<string>("");

  // Power-ups (Double Dip + Ask Prince) — port from multiplayer.
  const [doubleDipActive, setDoubleDipActive] = useState(false);
  const [doubleDipUsed, setDoubleDipUsed] = useState(false);
  const [askTheAIActive, setAskTheAIActive] = useState(false);
  const [askTheAIUsed, setAskTheAIUsed] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [aiWisdomPrefix, setAiWisdomPrefix] = useState<string>(
    PRINCE_WISDOM_PREFIXES[0]
  );

  const startTimeRef = useRef<number>(0);
  const questionStartMsRef = useRef<number>(0);

  // RN Animated values to mirror multiplayer's progress bar / counter pulse.
  const progressBarWidth = useRef(new RNAnimated.Value(100)).current;
  const progressBarPulse = useRef(new RNAnimated.Value(1)).current;
  const questionCounterPulse = useRef(new RNAnimated.Value(1)).current;

  // Animation refs for power-up cards
  const doubleDipScale = useRef(new RNAnimated.Value(1)).current;
  const doubleDipGlow = useRef(new RNAnimated.Value(0)).current;
  const askTheAIScale = useRef(new RNAnimated.Value(1)).current;
  const askTheAIGlow = useRef(new RNAnimated.Value(0)).current;

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Stable callbacks for the memoized header.
  const onToggleMusic = useCallback(
    () => setMusicMuted(!musicMuted),
    [musicMuted, setMusicMuted]
  );
  const onToggleSound = useCallback(
    () => setSoundMuted(!soundMuted),
    [soundMuted, setSoundMuted]
  );
  const dismissError = useCallback(() => setError(""), []);

  useEffect(() => {
    startMusic();
    return () => stopMusic();
  }, [startMusic, stopMusic]);

  useEffect(() => {
    if (!musicMuted && !gameEnded) startMusic();
  }, [musicMuted, gameEnded, startMusic]);

  // Fetch game details from the backend (mocking single player fetch for now, similar to multiplayer)
  const { data: gameDetails, error: gameDetailsError } = useQuery<
    GameDetailsResponse,
    Error
  >({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId as string, userToken?.token),
    enabled: !!userToken,
  });



  useEffect(() => {
    if (gameDetails && gameDetails.questions) {

      setGameQuestions(gameDetails.questions);
      const duration = gameDetails.duration || 20;
      startGame(gameId as string, duration);
      setQuestionDuration(duration * 1000);
      setTimeLeft(duration * 1000);

      const fetchAllAnswers = async () => {
        try {
          const answersPromises = gameDetails.questions.map((q: Question) =>
            getPracticeAnswers(q.id, userToken?.token)
          );
          const answers = await Promise.all(answersPromises);

          setGameAnswers(answers.flat());
        } catch (error: any) {

          setError("Failed to load questions. Please try again.");
        }
      };
      fetchAllAnswers();
    } else if (gameDetails && !gameDetails.questions) {

    }
  }, [gameDetails, userToken]);

  // Identify questions with multiple correct answers (same as multiplayer)
  useEffect(() => {
    if (gameQuestions.length === 0 || gameAnswers.length === 0) return;
    const multiCorrect = gameQuestions
      .filter(
        (q) =>
          gameAnswers.filter((a) => a.question === q.id && a.isRight).length >
          1
      )
      .map((q) => q.id);
    setQuestionsWithMultipleCorrectAnswers(multiCorrect);
  }, [gameQuestions, gameAnswers]);

  // Timer with countdown display, mirroring multiplayer
  useEffect(() => {
    if (gameQuestions.length === 0 || gameEnded) return;

    startTimeRef.current = Date.now();
    questionStartMsRef.current = Date.now();
    setTimeLeft(questionDuration);
    progressBarWidth.setValue(100);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = questionDuration - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        RNAnimated.timing(progressBarWidth, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        const newWidth = (remaining / questionDuration) * 100;
        RNAnimated.timing(progressBarWidth, {
          toValue: newWidth,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
    }, 1000);

    const timer = setTimeout(() => {
      if (!gameEnded) {
        // Did not answer in time -> counted as wrong
        answerQuestion(false, questionDuration);
        moveToNextQuestionOrEnd();
      }
    }, questionDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentQuestion, questionDuration, gameQuestions, gameEnded]);

  // Reset power-ups when question changes (mirrors multiplayer)
  useEffect(() => {
    if (gameEnded) return;
    setAiPrediction(null);
    setAskTheAIActive(false);
    setDoubleDipActive(false);
  }, [currentQuestion, gameEnded]);

  // Animate question counter when 5 or fewer questions remain
  useEffect(() => {
    if (gameEnded || gameQuestions.length === 0) return;

    const questionsRemaining = gameQuestions.length - currentQuestion;
    if (questionsRemaining <= 5) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(questionCounterPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          RNAnimated.timing(questionCounterPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      questionCounterPulse.stopAnimation();
      questionCounterPulse.setValue(1);
    }
  }, [currentQuestion, gameQuestions.length, gameEnded]);

  // Animate progress bar when time is low
  useEffect(() => {
    if (gameEnded) return;
    if (timeLeft <= 5000 && timeLeft > 0) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(progressBarPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: false,
          }),
          RNAnimated.timing(progressBarPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      progressBarPulse.stopAnimation();
      progressBarPulse.setValue(1);
    }
  }, [timeLeft, gameEnded]);

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
      await submitGameResult(userToken?.token, {
        gameId: String(gameId),
        gameMode: "single_player",
        finalScore: Math.round(score),
        highestStreak: streak,
      });

      // Invalidate all leaderboard caches so the Play tab and leaderboard
      // pages immediately reflect the new score.
      queryClient.invalidateQueries({ queryKey: ["rankingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails"] });
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    } catch (err) {
      console.log("Error submitting single player score:", err);
    }

    const scoresObject = {
      [userInfo?.user.id as number]: Math.round(score),
    };

    router.replace({
      pathname: "Results",
      params: { scores: JSON.stringify(scoresObject), gameId },
    });
  };

  // Multiplayer-style answer handler. Supports multi-correct questions and
  // the Double Dip power-up (2 attempts on a single-correct question). The
  // WebSocket attemptQuestion call is dropped — solo advances locally.
  const handleAnswerSelection = (answerId: number, questionId: number) => {
    if (gameEnded) return;

    const timeTakenMs = Date.now() - questionStartMsRef.current;

    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      const correctCount = gameAnswers.filter(
        (a) => a.question === questionId && a.isRight
      ).length;
      const correctIds = gameAnswers
        .filter((a) => a.question === questionId && a.isRight)
        .map((a) => a.id);
      let didSubmit = false;
      let isCorrect = false;

      if (questionsWithMultipleCorrectAnswers.includes(questionId)) {
        if (updated[questionId]?.length === correctCount) return updated;
        if (!updated[questionId]) updated[questionId] = [answerId];
        else if (!updated[questionId].includes(answerId))
          updated[questionId].push(answerId);
        if (updated[questionId].length === correctCount) {
          didSubmit = true;
          const sel = updated[questionId];
          isCorrect =
            sel.length === correctIds.length &&
            sel.every((id) => correctIds.includes(id));
        }
      } else {
        if (updated[questionId]?.length > 0 && !doubleDipActive) return updated;
        if (doubleDipActive) {
          if (updated[questionId]?.length >= 2) return updated;
          if (!updated[questionId]) updated[questionId] = [answerId];
          else if (!updated[questionId].includes(answerId))
            updated[questionId].push(answerId);
          if (updated[questionId].length === 2) {
            // Defer sibling-state update — calling `setDoubleDipActive(false)`
            // synchronously inside this updater triggers React's
            // "Cannot update a component while rendering a different component"
            // warning, because React may replay the updater during a render.
            queueMicrotask(() => setDoubleDipActive(false));
            didSubmit = true;
            const sel = updated[questionId];
            isCorrect =
              sel.length === correctIds.length &&
              sel.every((id) => correctIds.includes(id));
          }
        } else {
          updated[questionId] = [answerId];
          didSubmit = true;
          isCorrect = correctIds.includes(answerId);
        }
      }

      if (didSubmit) {
        // `answerQuestion` writes to the Zustand store; deferring it avoids
        // notifying any other subscribers mid-React-render.
        queueMicrotask(() => answerQuestion(isCorrect, timeTakenMs));
        setTimeout(() => {
          try {
            Haptics.notificationAsync(
              isCorrect
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Error
            );
          } catch (_) {}
          if (isCorrect) {
            playCorrect();
          } else {
            playWrong();
          }
        }, 0);
        // Solo has no WebSocket coordinator to wait on — advance locally after
        // a short delay so the immediate-feedback colours have time to play.
        setTimeout(() => {
          moveToNextQuestionOrEnd();
        }, 500);
      }

      return updated;
    });
  };

  const isAnswerSelected = (questionId: number, answerId: number) =>
    selectedAnswers[questionId]?.includes(answerId) ?? false;

  // Power-up: Double Dip — gives the user a second attempt on a
  // single-correct question. Disabled mid-multi-correct or after use.
  const activateDoubleDip = () => {
    if (!doubleDipUsed && !askTheAIActive && !doubleDipActive && !gameEnded) {
      RNAnimated.sequence([
        RNAnimated.timing(doubleDipScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        RNAnimated.timing(doubleDipScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(doubleDipGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          RNAnimated.timing(doubleDipGlow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setDoubleDipActive(true);
      setDoubleDipUsed(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
  };

  // Power-up: Ask Prince — reveals one of the correct answer ids for the
  // current question via a non-blocking overlay for ~20s.
  const activateAskTheAI = () => {
    if (!askTheAIUsed && !doubleDipActive && !askTheAIActive && !gameEnded) {
      RNAnimated.sequence([
        RNAnimated.timing(askTheAIScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        RNAnimated.timing(askTheAIScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(askTheAIGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          RNAnimated.timing(askTheAIGlow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setAskTheAIActive(true);
      const currentQId = gameQuestions[currentQuestion]?.id;
      const correctIds = gameAnswers
        .filter((answer) => answer.question === currentQId && answer.isRight)
        .map((answer) => answer.id);
      const aiGuess = correctIds[Math.floor(Math.random() * correctIds.length)];
      setAiPrediction(aiGuess);
      setAiWisdomPrefix(
        PRINCE_WISDOM_PREFIXES[
          Math.floor(Math.random() * PRINCE_WISDOM_PREFIXES.length)
        ]
      );
      setTimeout(() => {
        setAskTheAIActive(false);
        setAiPrediction(null);
      }, 20000);
      setAskTheAIUsed(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}
    }
  };

  // Streak: consecutive correct from last answered backward (parity with multiplayer)
  const currentStreak = useMemo(() => {
    let s = 0;
    for (let i = currentQuestion - 1; i >= 0; i--) {
      const q = gameQuestions[i];
      if (!q) break;
      const selectedIds = selectedAnswers[q.id] || [];
      const correctIds = gameAnswers
        .filter((a) => a.question === q.id && a.isRight)
        .map((a) => a.id);
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));
      if (isCorrect) s++;
      else break;
    }
    return s;
  }, [currentQuestion, gameQuestions, selectedAnswers, gameAnswers]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    blob1: {
      position: "absolute",
      top: -rV(100),
      left: -rS(50),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      top: rV(300),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#6366F118",
    },
    // Styles meant for Questions.tsx overrides (passed via the `styles` prop).
    questionContainer: {
      backgroundColor:
        colorScheme === "dark" ? themeColors.cardGlass : "transparent",
      borderRadius: rMS(36),
      padding: rMS(24),
      marginHorizontal: rS(16),
      marginTop: rV(100), // Below fixed header
      marginBottom: rV(24),
      borderWidth: colorScheme === "dark" ? 1 : 0,
      borderColor: themeColors.border + "60",
      minHeight: rV(140),
    },
    questionText: {
      fontSize: rMS(20),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      lineHeight: rMS(28),
    },
    answersContainer: {
      paddingHorizontal: rS(16),
    },
    errorMessage: {
      alignSelf: "center",
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginVertical: rV(16),
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
  });

  if (gameQuestions.length === 0) {
    return (
      <GameLoadingShell
        loadingText="Loading single player game..."
        error={error}
        onDismissError={dismissError}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {!gameEnded && gameQuestions.length > 0 && !error && (
        <QuizGlassHeader
          currentQuestionIndex={currentQuestion}
          totalQuestions={gameQuestions.length}
          currentStreak={currentStreak}
          timeLeft={timeLeft}
          progressBarWidth={progressBarWidth}
          progressBarPulse={progressBarPulse}
          questionCounterPulse={questionCounterPulse}
          musicMuted={musicMuted}
          soundMuted={soundMuted}
          onToggleMusic={onToggleMusic}
          onToggleSound={onToggleSound}
        />
      )}

      <PrinceWisdomBanner
        visible={askTheAIActive && aiPrediction !== null}
        wisdomPrefix={aiWisdomPrefix}
        predictionText={
          gameAnswers.find((ans) => ans.id === aiPrediction)?.text
        }
      />

      {!error && (
        <GameQuestionsScroll>
          {gameQuestions.length > 0 && (
            <Questions
              practiceQuestions={gameQuestions}
              practiceAnswers={gameAnswers}
              currentQuestion={currentQuestion}
              questionsWithMultipleCorrectAnswers={
                questionsWithMultipleCorrectAnswers
              }
              isAnswerSelected={isAnswerSelected}
              handleAnswerSelection={handleAnswerSelection}
              styles={styles}
            />
          )}
        </GameQuestionsScroll>
      )}

      <PowerUpStrip
        doubleDipActive={doubleDipActive}
        doubleDipUsed={doubleDipUsed}
        askTheAIActive={askTheAIActive}
        askTheAIUsed={askTheAIUsed}
        onDoubleDip={activateDoubleDip}
        onAskPrince={activateAskTheAI}
        doubleDipScale={doubleDipScale}
        doubleDipGlow={doubleDipGlow}
        askTheAIScale={askTheAIScale}
        askTheAIGlow={askTheAIGlow}
        disabled={gameEnded}
      />

      <ErrorMessage
        message={error}
        visible={!!error}
        onDismiss={dismissError}
      />
    </View>
  );
}
