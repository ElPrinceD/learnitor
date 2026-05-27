import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Animated as RNAnimated,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";

import { useAuth } from "../../components/AuthContext";
import { useGameAudio } from "../../hooks/useGameAudio";
import { Question, Answer } from "../../components/types";
import { useGameStore } from "../../store/gameStore";
import Colors from "../../constants/Colors";
import { rMS, rV, rS } from "../../constants/index.js";
import ErrorMessage from "../../components/ErrorMessage";
import Questions from "../../components/Questions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWeeklyExamStatus,
  getWeeklyExamQuestions,
  submitWeeklyExam,
} from "../../services/WeeklyExamApiCalls";
import { getPracticeAnswers } from "../../services/CoursesApiCalls";
import QuizGlassHeader from "../../components/game/QuizGlassHeader";
import GameQuestionsScroll from "../../components/game/GameQuestionsScroll";
import GameLoadingShell from "../../components/game/GameLoadingShell";
import WeeklyExamWindowGuard from "../../components/game/WeeklyExamWindowGuard";

// ────────────────────────────────────────────────────────────────────────────
// DEV / TESTING OVERRIDE
//
// When `true`, the exam window is forced open: the guard screen is bypassed
// and the exam loads its questions regardless of whether the backend says the
// window is active. Used together with the matching flag in
// `Mock/app/(tabs)/(play)/play.tsx` so the Weekly Exam button is always
// visible + pressable.
//
// Flip this back to `false` before shipping.
// ────────────────────────────────────────────────────────────────────────────
const DEV_FORCE_EXAM_OPEN = true;

// --- UTC time window check (uses backend dates when available) ---
function isExamWindowOpenFromBackend(
  startsAt?: string,
  endsAt?: string
): boolean {
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

export default function WeeklyExam() {
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

  const { startGame, endGame, answerQuestion, score, streak, timeLimit } =
    useGameStore();
  const queryClient = useQueryClient();

  const [gameAnswers, setGameAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number[];
  }>({});
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [
    questionsWithMultipleCorrectAnswers,
    setQuestionsWithMultipleCorrectAnswers,
  ] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionDuration, setQuestionDuration] = useState(20000);
  const [timeLeft, setTimeLeft] = useState(20000);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState("");

  const startTimeRef = useRef(0);
  const questionStartMsRef = useRef(0);

  // RN Animated values to mirror multiplayer's progress bar / counter pulse.
  const progressBarWidth = useRef(new RNAnimated.Value(100)).current;
  const progressBarPulse = useRef(new RNAnimated.Value(1)).current;
  const questionCounterPulse = useRef(new RNAnimated.Value(1)).current;

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Stable callbacks for the memoized header / guard / loading shell.
  const onToggleMusic = useCallback(
    () => setMusicMuted(!musicMuted),
    [musicMuted, setMusicMuted]
  );
  const onToggleSound = useCallback(
    () => setSoundMuted(!soundMuted),
    [soundMuted, setSoundMuted]
  );
  const dismissError = useCallback(() => setError(""), []);
  const onGoBack = useCallback(() => router.back(), []);

  // Fetch exam status (start/end times, currentWeek, etc.) from backend
  const { data: examStatus } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });

  // Whether the exam window is currently open. The DEV override forces this
  // to true so we can test even outside the Fri 7pm – Sun 11:59pm UTC window.
  const windowOpen = useMemo(
    () =>
      DEV_FORCE_EXAM_OPEN ||
      isExamWindowOpenFromBackend(examStatus?.startsAt, examStatus?.endsAt),
    [examStatus]
  );

  // Fetch the 30 randomized exam questions once the window is open. Gated by
  // `windowOpen` so we don't spam the questions endpoint outside the window.
  const { data: examQuestionsData, error: examQuestionsError } = useQuery({
    queryKey: ["weeklyExamQuestions"],
    queryFn: () => getWeeklyExamQuestions(userToken?.token),
    enabled: !!userToken?.token && windowOpen,
  });

  useEffect(() => {
    if (!examQuestionsData?.questions) return;
    const normalizedQuestions = examQuestionsData.questions.map((q: any) => ({
      ...q,
      // Weekly-exam API returns `content`; shared Questions UI reads `text`.
      text: q?.text ?? q?.content ?? "",
    }));
    setGameQuestions(normalizedQuestions);
    // Weekly-exam questions don't carry a `duration` field, so fall back to
    // the gameStore's default (`timeLimit` is seconds).
    setQuestionDuration(timeLimit * 1000);
    setTimeLeft(timeLimit * 1000);

    const fetchAllAnswers = async () => {
      try {
        const answersPromises = normalizedQuestions.map(
          (q: Question) => getPracticeAnswers(q.id, userToken?.token)
        );
        const answers = await Promise.all(answersPromises);
        setGameAnswers(answers.flat());
      } catch (err: any) {
        setError("Failed to load exam questions. Please try again.");
      }
    };
    fetchAllAnswers();
  }, [examQuestionsData, userToken]);

  useEffect(() => {
    if (examQuestionsError) {
      setError("Failed to load exam questions. Please try again.");
    }
  }, [examQuestionsError]);

  // Start the music + a Zustand game session when the window opens.
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
    if (!windowOpen || gameQuestions.length === 0 || gameEnded) return;

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
        answerQuestion(false, questionDuration);
        moveToNextQuestionOrEnd();
      }
    }, questionDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentQuestion, questionDuration, gameQuestions, gameEnded, windowOpen]);

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
      finishExam();
    }
  };

  const finishExam = async () => {
    setGameEnded(true);
    endGame();

    // Use the dedicated weekly-exam submit endpoint. The backend builds the
    // correct gameId (seasonId-weekId) internally — no need to construct it
    // on the client.
    const weekId =
      examStatus?.currentWeek != null
        ? `weekly-exam-${examStatus.currentWeek}`
        : `weekly-exam-${new Date().toISOString().slice(0, 10)}`;

    try {
      await submitWeeklyExam(userToken?.token, {
        finalScore: Math.round(score),
        highestStreak: streak,
      });

      // Invalidate all leaderboard and exam caches so the Play tab and
      // leaderboard pages immediately reflect the new weekly exam score.
      queryClient.invalidateQueries({ queryKey: ["rankingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails"] });
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyExamStatus"] });
      queryClient.invalidateQueries({ queryKey: ["knockoutBracket"] });
      queryClient.invalidateQueries({ queryKey: ["customH2HMatches"] });
      queryClient.invalidateQueries({ queryKey: ["customH2HStandings"] });
      queryClient.invalidateQueries({ queryKey: ["h2hCurrent"] });
    } catch (err) {
      // Silently swallow — the user still navigates to the Results screen.
    }

    const scoresObject = {
      [userInfo?.user.id as number]: Math.round(score),
    };

    router.replace({
      pathname: "Results",
      params: {
        scores: JSON.stringify(scoresObject),
        gameId: weekId,
        isWeeklyExam: "1",
        currentWeek:
          examStatus?.currentWeek != null ? String(examStatus.currentWeek) : "",
      },
    });
  };

  // Multiplayer-style answer handler. Supports multi-correct questions.
  // No power-ups in weekly exam — it's an assessment, not a casual game.
  // Note: state writes from inside this updater go through `queueMicrotask`
  // to avoid React's "setState during render" warning.
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
        if (updated[questionId]?.length > 0) return updated;
        updated[questionId] = [answerId];
        didSubmit = true;
        isCorrect = correctIds.includes(answerId);
      }

      if (didSubmit) {
        // Defer the Zustand store write so other subscribers don't get
        // notified mid-React-render.
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
        setTimeout(() => moveToNextQuestionOrEnd(), 500);
      }

      return updated;
    });
  };

  const isAnswerSelected = (questionId: number, answerId: number) =>
    selectedAnswers[questionId]?.includes(answerId) ?? false;

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
  });

  // Guard: window closed (only reachable when DEV_FORCE_EXAM_OPEN is false)
  if (!windowOpen) {
    return (
      <WeeklyExamWindowGuard examStatus={examStatus} onGoBack={onGoBack} />
    );
  }

  // Loading state (questions still in flight)
  if (gameQuestions.length === 0) {
    return (
      <GameLoadingShell
        loadingText="Loading Weekly Exam..."
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

      <ErrorMessage
        message={error}
        visible={!!error}
        onDismiss={dismissError}
      />
    </View>
  );
}
