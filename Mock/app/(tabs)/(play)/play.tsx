import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-root-toast";

import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { rS, rV } from "../../../constants";
import {
  createCustomLeaderboard,
  CustomLeaderboard,
  getCustomLeaderboards,
  getRankingsSummary,
  joinCustomLeaderboard,
} from "../../../services/LeaderboardApiCalls";
import {
  getWeeklyExamStatus,
  WeeklyExamStatus,
} from "../../../services/WeeklyExamApiCalls";

import ScoreCardHero from "../../../components/play/ScoreCardHero";
import ExamActionRow from "../../../components/play/ExamActionRow";
import PlayModeToggle from "../../../components/play/PlayModeToggle";
import StudySquadsSection from "../../../components/play/StudySquadsSection";
import YourRankCards from "../../../components/play/YourRankCards";
import KnockoutSquadsList from "../../../components/play/KnockoutSquadsList";
import SquadBottomSheet from "../../../components/play/SquadBottomSheet";
import type {
  ExamButtonState,
  PlayMode,
  ScoringMode,
  SheetTab,
} from "../../../components/play/types";

// Format UTC date to user's local timezone for the deadline copy in the hero.
const formatToLocalTime = (utcDateStr: string): string => {
  const d = new Date(utcDateStr);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

// ────────────────────────────────────────────────────────────────────────────
// DEV / TESTING OVERRIDE
//
// When `true`, the Weekly Exam button is always visible and always pressable
// regardless of the backend's exam window. Used together with the matching
// flag in `Mock/app/(game)/WeeklyExam.tsx` so the exam screen also bypasses
// its window guard.
//
// Flip this back to `false` before shipping.
// ────────────────────────────────────────────────────────────────────────────
const DEV_FORCE_EXAM_OPEN = true;

// Derive the exam button state from the backend window + the current minute.
const getExamButtonState = (
  exam: WeeklyExamStatus,
  now: Date
): ExamButtonState => {
  const start = new Date(exam.startsAt);
  const end = new Date(exam.endsAt);
  const oneDayBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const oneDayAfter = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  if (exam.hasCompleted) {
    return now > oneDayAfter ? "expired" : "completed";
  }
  if (now < oneDayBefore) return "hidden";
  if (now >= oneDayBefore && now < start) return "teaser";
  if (now >= start && now <= end) return "active";
  if (now > end && now <= oneDayAfter) return "expired";
  return "hidden";
};

// Returns a `Date` that updates every `intervalMs` so any consumers that read
// it via `useMemo` re-derive on the same cadence. Replaces an in-render
// `new Date()` that would otherwise cause the screen to re-derive every
// render cycle.
const useNowTick = (intervalMs: number): Date => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

export default function PlayScreen() {
  const { userToken } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // ── Local state ─────────────────────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<PlayMode>("rankings");
  const [sheetTab, setSheetTab] = useState<SheetTab>("create");
  const [squadName, setSquadName] = useState("");
  const [squadJoinCode, setSquadJoinCode] = useState("");
  const [createdSquadCode, setCreatedSquadCode] = useState<string | null>(null);

  // Bottom sheet ref
  const squadSheetRef = useRef<BottomSheetModal | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: rankingsQuery } = useQuery({
    queryKey: ["rankingsSummary"],
    queryFn: () => getRankingsSummary(userToken?.token),
    enabled: !!userToken?.token,
  });
  const rankings = useMemo(
    () => rankingsQuery ?? { world: null, country: null, school: null },
    [rankingsQuery]
  );

  const { data: customLeaderboardsQuery } = useQuery({
    queryKey: ["customLeaderboards"],
    queryFn: () => getCustomLeaderboards(userToken?.token),
    enabled: !!userToken?.token,
  });
  const customLeaderboards: CustomLeaderboard[] = useMemo(
    () => customLeaderboardsQuery ?? [],
    [customLeaderboardsQuery]
  );

  const rankingsSquads = useMemo(
    () =>
      customLeaderboards.filter((lb) => lb.scoringMode !== "custom_1v1"),
    [customLeaderboards]
  );
  const knockoutSquads = useMemo(
    () =>
      customLeaderboards.filter((lb) => lb.scoringMode === "custom_1v1"),
    [customLeaderboards]
  );

  const { data: examStatusQuery } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });
  const examStatus = examStatusQuery;

  // ── Derived: exam window (ticks every 60s) ──────────────────────────────
  const now = useNowTick(60_000);

  const examDerived = useMemo(() => {
    const rawState: ExamButtonState = examStatus
      ? getExamButtonState(examStatus, now)
      : "hidden";
    const buttonState: ExamButtonState = DEV_FORCE_EXAM_OPEN
      ? "active"
      : rawState;
    const startLocal = examStatus ? formatToLocalTime(examStatus.startsAt) : "";
    const endLocal = examStatus ? formatToLocalTime(examStatus.endsAt) : "";
    const isActive = examStatus
      ? new Date(examStatus.startsAt) <= now &&
        now <= new Date(examStatus.endsAt)
      : false;
    return { buttonState, startLocal, endLocal, isActive };
  }, [examStatus, now]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const showToast = useCallback(
    (msg: string) => {
      Toast.show(msg, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        opacity: 0.8,
        backgroundColor: themeColors.tint,
        textColor: "white",
        containerStyle: { marginTop: 20 },
      });
    },
    [themeColors.tint]
  );

  const closeSquadSheet = useCallback(() => {
    squadSheetRef.current?.dismiss();
    setCreatedSquadCode(null);
    setSquadName("");
    setSquadJoinCode("");
  }, []);

  const createSquadMutation = useMutation({
    mutationFn: ({
      name,
      scoringMode,
    }: {
      name: string;
      scoringMode: string;
    }) =>
      createCustomLeaderboard(
        userToken?.token,
        name || "My Squad",
        scoringMode
      ),
    onSuccess: (data) => {
      setCreatedSquadCode(data?.invite_code || null);
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    },
    onError: () => {
      showToast("Error creating squad. Try again.");
    },
  });

  const joinSquadMutation = useMutation({
    mutationFn: (code: string) =>
      joinCustomLeaderboard(userToken?.token, code),
    onSuccess: () => {
      showToast(`Joined squad!`);
      setSquadJoinCode("");
      closeSquadSheet();
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    },
    onError: () => {
      showToast("Invalid code. Please check and try again.");
    },
  });

  // ── Animation entry: only animate on first mount ───────────────────────
  const hasAnimated = useRef(false);
  useEffect(() => {
    hasAnimated.current = true;
  }, []);

  const enterAnim = useCallback(
    (delay: number) =>
      hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay),
    []
  );

  // ── Handlers (all stable so memoized children skip renders) ────────────
  const openSquadSheet = useCallback(() => {
    setCreatedSquadCode(null);
    setSquadName("");
    setSquadJoinCode("");
    setSheetTab("create");
    squadSheetRef.current?.present();
  }, []);

  const navigateToGame = useCallback(() => {
    router.navigate({ pathname: "/(game)/GameIntro" });
  }, []);

  const navigateToExam = useCallback(() => {
    router.push("/(game)/WeeklyExam");
  }, []);

  const openLeaderboard = useCallback(
    (id: string, name: string) => {
      router.push({
        pathname: "/(game)/LeaderboardDetail",
        params: { id, name, timeframe: "season" },
      });
    },
    []
  );

  const openKnockoutLeaderboard = useCallback(
    (id: string, name: string, type: string) => {
      router.push({
        pathname: "/(game)/LeaderboardDetail",
        params: { id, name, timeframe: "season", type },
      });
    },
    []
  );

  const openFullLeaderboard = useCallback(() => {
    router.push("/(game)/Leaderboard");
  }, []);

  const handleCreateSquad = useCallback(
    (scoringMode: ScoringMode) => {
      createSquadMutation.mutate({
        name: squadName.trim(),
        scoringMode,
      });
    },
    [createSquadMutation, squadName]
  );

  const handleJoinSquad = useCallback(() => {
    if (squadJoinCode.length < 4) {
      showToast("Enter a valid invite code");
      return;
    }
    joinSquadMutation.mutate(squadJoinCode);
  }, [joinSquadMutation, squadJoinCode, showToast]);

  const handleCopyCode = useCallback(() => {
    if (!createdSquadCode) return;
    try {
      const Clipboard = require("expo-clipboard");
      Clipboard.setStringAsync(createdSquadCode);
      showToast("Code copied!");
    } catch {
      showToast(createdSquadCode);
    }
  }, [createdSquadCode, showToast]);

  // ── Static container styles (no theme deps that change per render) ─────
  const containerStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: themeColors.background,
        },
        scrollContent: {
          paddingHorizontal: rS(16),
          paddingTop: Math.max(rV(20), insets.top + rV(12)),
          paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
        },
        scrollView: {
          flex: 1,
        },
        keyboardAvoiding: {
          flex: 1,
        },
      }),
    [themeColors.background, insets.top, insets.bottom]
  );

  return (
    <View style={containerStyles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <KeyboardAvoidingView
        style={containerStyles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={containerStyles.scrollView}
          contentContainerStyle={containerStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScoreCardHero
            examStatus={examStatus}
            examIsActive={examDerived.isActive}
            examButtonState={examDerived.buttonState}
            examStartLocal={examDerived.startLocal}
            examEndLocal={examDerived.endLocal}
            enterAnim={enterAnim}
          />

          <ExamActionRow
            examButtonState={examDerived.buttonState}
            onPlayPress={navigateToGame}
            onExamPress={navigateToExam}
            enterAnim={enterAnim}
          />

          <PlayModeToggle
            activeMode={activeMode}
            onChange={setActiveMode}
            enterAnim={enterAnim}
          />

          {activeMode === "rankings" ? (
            <>
              <StudySquadsSection
                squads={rankingsSquads}
                totalCustomCount={customLeaderboards.length}
                onOpenSquad={openLeaderboard}
                onOpenAllSquads={openFullLeaderboard}
                onAddSquad={openSquadSheet}
                enterAnim={enterAnim}
              />

              <YourRankCards
                rankings={rankings}
                onOpenLeaderboard={openLeaderboard}
                enterAnim={enterAnim}
              />
            </>
          ) : (
            <KnockoutSquadsList
              squads={knockoutSquads}
              onOpenSquad={openKnockoutLeaderboard}
              enterAnim={enterAnim}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <SquadBottomSheet
        sheetRef={squadSheetRef}
        sheetTab={sheetTab}
        onSheetTabChange={setSheetTab}
        squadName={squadName}
        onSquadNameChange={setSquadName}
        squadJoinCode={squadJoinCode}
        onSquadJoinCodeChange={setSquadJoinCode}
        createdSquadCode={createdSquadCode}
        onCopyCode={handleCopyCode}
        onCreateSquad={handleCreateSquad}
        onJoinSquad={handleJoinSquad}
        onClose={closeSquadSheet}
        joinPending={joinSquadMutation.isPending}
        createPending={createSquadMutation.isPending}
      />
    </View>
  );
}
