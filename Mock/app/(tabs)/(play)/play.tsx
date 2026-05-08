import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronUp,
  ChevronDown,
  Minus,
  Gamepad2,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  ChevronRight,
  Trophy,
  Copy,
  LogIn,
  Zap,
  Globe,
  Flag,
  School,
} from "lucide-react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRankingsSummary,
  getCustomLeaderboards,
  createCustomLeaderboard,
  joinCustomLeaderboard,
  RankingSummary,
  CustomLeaderboard,
  H2HMatchup,
  CustomH2HStanding,
  CustomH2HMatchItem
} from "../../../services/LeaderboardApiCalls";
import {
  getWeeklyExamStatus,
  WeeklyExamStatus
} from "../../../services/WeeklyExamApiCalls";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useAuth } from "../../../components/AuthContext";
import Toast from "react-native-root-toast";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import ApiUrl from "../../../config";



type RankMovement = "up" | "down" | "same";

// Helper: format UTC date to user's local timezone
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

// Helper: get exam button state based on current time
type ExamButtonState = "hidden" | "teaser" | "active" | "completed" | "expired";
const getExamButtonState = (exam: WeeklyExamStatus, now: Date): ExamButtonState => {
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

export default function PlayScreen() {
  const { userToken, userInfo } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [gameCode, setGameCode] = useState("");
  const [joinGameDisabled, setJoinGameDisabled] = useState(true);
  const [squadJoinCode, setSquadJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [activeMode, setActiveMode] = useState<"rankings" | "knockout">("rankings");
  const [h2hMatchup, setH2hMatchup] = useState<H2HMatchup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customH2HTab, setCustomH2HTab] = useState<"matches" | "standings">("matches");
  const [squadName, setSquadName] = useState("");
  const [createdSquadCode, setCreatedSquadCode] = useState<string | null>(null);
  const [sheetTab, setSheetTab] = useState<"create" | "join">("create");

  // Bottom sheet ref
  const squadSheetRef = useRef<BottomSheetModal>(null);
  const sheetSnapPoints = useMemo(() => ["65%", "85%"], []);

  const openSquadSheet = useCallback(() => {
    setCreatedSquadCode(null);
    setSquadName("");
    setSquadJoinCode("");
    setSheetTab("create");
    squadSheetRef.current?.present();
  }, []);

  const closeSquadSheet = useCallback(() => {
    squadSheetRef.current?.dismiss();
    setCreatedSquadCode(null);
    setSquadName("");
    setSquadJoinCode("");
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );
  
  // Custom H2H data from queries
  const customH2HStandings: CustomH2HStanding[] = [];
  const customH2HMatches: CustomH2HMatchItem[] = [];

  // React Query Hooks
  const { data: rankingsQuery } = useQuery({
    queryKey: ["rankingsSummary"],
    queryFn: () => getRankingsSummary(userToken?.token),
    enabled: !!userToken?.token,
  });
  const rankings = rankingsQuery || { world: null, country: null, school: null };

  const { data: customLeaderboardsQuery } = useQuery({
    queryKey: ["customLeaderboards"],
    queryFn: () => getCustomLeaderboards(userToken?.token),
    enabled: !!userToken?.token,
  });
  const customLeaderboards = customLeaderboardsQuery || [];

  // Derived: H2H squads go to Knockout tab, others go to Rankings
  const rankingsSquads = customLeaderboards.filter((lb) => lb.scoringMode !== "custom_1v1");
  const knockoutSquads = customLeaderboards.filter((lb) => lb.scoringMode === "custom_1v1");

  const { data: examStatusQuery } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });
  const examStatus = examStatusQuery;

  const createSquadMutation = useMutation({
    mutationFn: ({ name, scoringMode }: { name: string; scoringMode: string }) =>
      createCustomLeaderboard(userToken?.token, name || "My Squad", scoringMode),
    onSuccess: (data) => {
      setCreatedSquadCode(data?.invite_code || null);
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    },
    onError: () => {
      showToast("Error creating squad. Try again.");
    }
  });

  const joinSquadMutation = useMutation({
    mutationFn: (code: string) => joinCustomLeaderboard(userToken?.token, code),
    onSuccess: (data) => {
      showToast(`Joined squad!`);
      setSquadJoinCode("");
      closeSquadSheet();
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    },
    onError: () => {
      showToast("Invalid code. Please check and try again.");
    }
  });

  // One-time animation flag
  const hasAnimated = useRef(false);
  useEffect(() => {
    hasAnimated.current = true;
  }, []);

  // Compute exam button state
  const now = new Date();
  const examButtonState = examStatus ? getExamButtonState(examStatus, now) : "hidden";
  const examStartLocal = examStatus ? formatToLocalTime(examStatus.startsAt) : "";
  const examEndLocal = examStatus ? formatToLocalTime(examStatus.endsAt) : "";
  const examIsActive = examStatus ? new Date(examStatus.startsAt) <= now && now <= new Date(examStatus.endsAt) : false;

  // Animated press for ghost buttons
  const playFill = useSharedValue(0);
  const examFill = useSharedValue(0);

  const playBtnAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(playFill.value, [0, 1], ["transparent", themeColors.tint]),
  }));
  const examBtnAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(examFill.value, [0, 1], ["transparent", themeColors.tint]),
  }));

  const ghostPressIn = (fill: Animated.SharedValue<number>) => {
    fill.value = withTiming(1, { duration: 120 });
  };
  const ghostPressOut = (fill: Animated.SharedValue<number>) => {
    fill.value = withTiming(0, { duration: 180 });
  };

  // Toggle indicator animation
  const toggleIndicatorX = useSharedValue(0);
  const toggleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleIndicatorX.value }],
  }));

  // Sheet tab sliding indicator
  const sheetTabX = useSharedValue(0);
  const sheetTabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheetTabX.value }],
  }));

  useEffect(() => {
    setJoinGameDisabled(gameCode.length !== 6);
  }, [gameCode]);

  const createSquad = (scoringMode: "all_points" | "exam_only" | "custom_1v1" = "all_points") => {
    createSquadMutation.mutate({ name: squadName.trim(), scoringMode });
  };

  const joinSquad = () => {
    if (squadJoinCode.length < 4) {
      showToast("Enter a valid invite code");
      return;
    }
    joinSquadMutation.mutate(squadJoinCode);
  };

  const navigateToGame = () => {
    router.navigate({ pathname: "/(game)/GameIntro" });
  };

  const joinGame = () => {
    // We navigate to GameWaiting directly. The waiting screen handles the exact game validation.
    router.navigate({
      pathname: "/(game)/GameWaiting",
      params: { code: gameCode },
    });
  };

  const handleJoinPress = () => {
    if (joinGameDisabled) {
      showToast("Enter 6-character code");
      return;
    }
    joinGame();
  };

  const showToast = (msg: string) => {
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
  };

  const openLeaderboard = (id: string, name: string, type?: string) => {
    router.push({
      pathname: "/(game)/LeaderboardDetail",
      params: { id, name, timeframe: "season", ...(type ? { type } : {}) },
    });
  };

  const openFullLeaderboard = () => {
    router.push("/(game)/Leaderboard");
  };


  const globalStandingItems = [
    {
      id: "world",
      name: "World Rankings",
      IconComponent: Globe,
      rank: rankings.world,
      color: themeColors.tint,
      movement: undefined,
    },
    {
      id: "country",
      name: "Country Rankings",
      IconComponent: Flag,
      rank: rankings.country,
      color: themeColors.tintSecond ?? themeColors.tint,
      movement: undefined,
    },
    {
      id: "school",
      name: "School Rankings",
      IconComponent: School,
      rank: rankings.school,
      color: "#8b3b8f",
      movement: undefined,
    },
  ];

  const renderRankIndicator = (movement?: RankMovement) => {
    const boxStyle = { width: rMS(18), height: rMS(18), alignItems: "center" as const, justifyContent: "center" as const };
    if (movement === "up") return <View style={boxStyle}><ChevronUp size={12} color="#4CAF50" /></View>;
    if (movement === "down") return <View style={boxStyle}><ChevronDown size={12} color="#F44336" /></View>;
    return <View style={boxStyle}><Minus size={12} color={themeColors.textSecondary} /></View>;
  };

  // Animation helper — only animate on first mount
  const enterAnim = (delay: number) =>
    hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(20), insets.top + rV(12)),
      paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
    },
    // Score card hero
    scoreCardOuter: {
      borderRadius: rMS(24),
      overflow: "hidden",
      marginBottom: rV(14),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      ...shadow.medium,
    },
    scoreCardInner: {
      backgroundColor: themeColors.tint + "08",
      padding: rMS(22),
      paddingBottom: rMS(18),
      position: "relative",
    },
    scoreCardStripe: {
      position: "absolute",
      top: -rV(10),
      right: -rS(40),
      width: rS(200),
      height: rS(200),
      borderRadius: rS(100),
      backgroundColor: themeColors.tint + "0C",
      transform: [{ scaleX: 1.5 }],
    },
    scoreCardAccent: {
      position: "absolute",
      bottom: -rV(20),
      left: -rS(20),
      width: rS(80),
      height: rS(80),
      borderRadius: rS(40),
      backgroundColor: themeColors.tint + "10",
    },
    scoreCardWeekLabel: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.tint,
      letterSpacing: 0.5,
      marginBottom: rV(14),
    },
    scoreCardMain: {
      alignItems: "center",
      marginBottom: rV(16),
    },
    scoreCardValue: {
      fontSize: rMS(64),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1.5,
      lineHeight: rMS(68),
    },
    scoreCardLabel: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.tint,
      marginTop: rV(4),
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    scoreCardBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    scoreCardAvgText: {
      fontSize: rMS(15),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    scoreCardDeadline: {
      fontSize: rMS(10),
      fontWeight: "600",
      color: themeColors.textSecondary + "BB",
    },
    // Action buttons — side by side ghost
    actionRow: {
      flexDirection: "row",
      gap: rS(10),
      marginBottom: rV(16),
    },
    ghostButton: {
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      borderWidth: 1.5,
      borderColor: themeColors.tint,
    },
    ghostButtonText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.tint,
    },
    // Join card
    joinCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(14),
      marginBottom: rV(22),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    joinRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(10),
    },
    joinInput: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(12),
      fontSize: SIZES.small,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    joinButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(14),
      alignItems: "center",
      justifyContent: "center",
    },
    joinButtonDisabled: {
      opacity: 0.5,
    },
    joinButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: SIZES.small,
    },
    joinLabel: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginBottom: rV(10),
      fontWeight: "600",
    },
    // Sections
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(14),
    },
    sectionTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    sectionSeeAll: {
      fontSize: SIZES.small,
      color: themeColors.tint,
      fontWeight: "700",
    },
    // Standing cards — compact
    standingCard: {
      backgroundColor: themeColors.cardGlass,
      padding: rMS(10),
      borderRadius: rMS(20),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(6),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    standingCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(10),
    },
    standingIconBox: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      alignItems: "center",
      justifyContent: "center",
    },
    standingName: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.text,
    },
    standingCardRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(6),
    },
    standingRank: {
      fontSize: rMS(12),
      fontWeight: "bold",
      color: themeColors.tint,
    },
    // Squad section
    squadSection: {
      marginBottom: rV(28),
    },
    squadEmpty: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(16),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    squadEmptyText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      textAlign: "center",
      marginTop: rV(6),
      marginBottom: rV(12),
    },
    squadActionsRow: {
      flexDirection: "row",
      gap: rS(12),
      width: "100%",
    },
    squadActionButton: {
      flex: 1,
      height: rV(70),
      borderRadius: rMS(24),
      paddingHorizontal: rS(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    squadActionButtonPrimary: {
      backgroundColor: themeColors.tint,
    },
    squadActionButtonSecondary: {
      backgroundColor: themeColors.tint + "15",
    },
    squadActionTextContent: {
      flex: 1,
      alignItems: "flex-start",
    },
    squadActionLabel: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      opacity: 0.8,
      marginBottom: rV(2),
    },
    squadActionTitle: {
      fontSize: SIZES.medium,
      fontWeight: "800",
    },
    // Squad add button (glassmorphic)
    squadAddBtn: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    squadJoinInputContainer: {
      width: "100%",
      marginTop: rV(12),
      flexDirection: "row",
      gap: rS(10),
      alignItems: "center",
    },
    squadJoinInput: {
      flex: 1,
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(14),
      fontSize: SIZES.small,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    squadJoinBtn: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(16),
      justifyContent: "center",
      alignItems: "center",
    },
    squadJoinBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: SIZES.small,
    },
    squadItem: {
      backgroundColor: themeColors.cardGlass,
      padding: rMS(12),
      borderRadius: rMS(24),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(6),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    squadItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
    },
    squadIcon: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      backgroundColor: themeColors.tint + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    squadName: {
      fontSize: SIZES.small,
      fontWeight: "700",
      color: themeColors.text,
    },
    squadMembers: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    // Toggle pill
    toggleContainer: {
      flexDirection: "row",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(3),
      marginBottom: rV(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      position: "relative",
    },
    toggleIndicator: {
      position: "absolute",
      top: rMS(3),
      bottom: rMS(3),
      left: rMS(3),
      width: "50%",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
    },
    toggleButton: {
      flex: 1,
      paddingVertical: rV(10),
      borderRadius: rMS(22),
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    toggleText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    toggleTextActive: {
      color: "#fff",
    },
    // Cup mode H2H card
    h2hCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(18),
      marginBottom: rV(16),
      borderWidth: 1.5,
      borderColor: themeColors.tint + "25",
    },
    h2hVsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(14),
    },
    h2hPlayer: {
      alignItems: "center",
      flex: 1,
    },
    h2hPlayerName: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.text,
      marginTop: rV(6),
    },
    h2hAvatar: {
      width: rMS(48),
      height: rMS(48),
      borderRadius: rMS(24),
      backgroundColor: themeColors.tint + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    h2hVsText: {
      fontSize: rMS(16),
      fontWeight: "900",
      color: themeColors.textSecondary,
      marginHorizontal: rS(8),
    },
    h2hScoreRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: rS(10),
      marginBottom: rV(10),
    },
    h2hScoreText: {
      fontSize: rMS(22),
      fontWeight: "900",
      color: themeColors.tint,
    },
    h2hResultBadge: {
      paddingHorizontal: rMS(10),
      paddingVertical: rV(3),
      borderRadius: rMS(6),
    },
    h2hResultBadgeText: {
      fontSize: rMS(10),
      fontWeight: "800",
      letterSpacing: 1,
    },
    h2hRoundInfo: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      textAlign: "center",
      fontWeight: "600",
    },
    // Exam button
    examButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      alignItems: "center",
      marginTop: rV(10),
    },
    examButtonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "800",
    },
    examCompletedText: {
      color: "#4CAF50",
      fontSize: rMS(12),
      fontWeight: "700",
      textAlign: "center",
      marginTop: rV(10),
    },
    // Create squad modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(36),
      borderTopRightRadius: rMS(36),
      padding: rMS(24),
      paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
    },
    modalHandle: {
      width: rS(40),
      height: rV(4),
      backgroundColor: themeColors.textSecondary + "40",
      borderRadius: rMS(4),
      alignSelf: "center",
      marginBottom: rV(16),
    },
    modalTitle: {
      fontSize: rMS(20),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(6),
    },
    modalSubtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      marginBottom: rV(20),
      lineHeight: rMS(18),
    },
    modeOption: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(16),
      marginBottom: rV(10),
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    modeOptionLabel: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(4),
    },
    modeOptionDesc: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      lineHeight: rMS(17),
    },
    modalCancelBtn: {
      alignItems: "center",
      paddingVertical: rV(14),
      marginTop: rV(6),
    },
    modalCancelText: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    // Cup card for knockout list
    cupCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      padding: rMS(12),
      marginBottom: rV(8),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cupCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(10),
      flex: 1,
    },
    cupIcon: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      alignItems: "center",
      justifyContent: "center",
    },
    cupName: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
    },
    cupWeek: {
      fontSize: rMS(10),
      color: themeColors.textSecondary,
      fontWeight: "600",
      marginTop: rV(2),
    },
    cupResultBadge: {
      width: rMS(24),
      height: rMS(24),
      borderRadius: rMS(12),
      alignItems: "center",
      justifyContent: "center",
    },
    cupResultText: {
      color: "#fff",
      fontSize: rMS(10),
      fontWeight: "900",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Score Card Hero */}
          <Animated.View entering={enterAnim(50)}>
            <View style={styles.scoreCardOuter}>
              <View style={styles.scoreCardInner}>
                {/* Background art */}
                <View style={styles.scoreCardStripe} />
                <View style={styles.scoreCardAccent} />

                {/* Season + Study week label */}
                  <Text style={styles.scoreCardWeekLabel}>
                    {examStatus?.seasonName ? `${examStatus.seasonName} · ` : ""}
                    {examStatus?.currentWeek ? `Study Week ${examStatus.currentWeek}` : "Study Week"}
                  </Text>

                {/* Primary: user score — centered */}
                <View style={styles.scoreCardMain}>
                  <Text style={styles.scoreCardValue}>
                    {examStatus?.userScore ?? "\u2014"}
                  </Text>
                  <Text style={styles.scoreCardLabel}>Your Score</Text>
                </View>

                {/* Bottom row: avg left, deadline right */}
                <View style={styles.scoreCardBottom}>
                  <Text style={styles.scoreCardAvgText}>
                    Average · {examStatus?.globalAverage ?? "\u2014"}
                  </Text>
                  <Text style={styles.scoreCardDeadline}>
                    {examIsActive
                      ? `Ends ${examEndLocal}`
                      : examButtonState === "completed" || examButtonState === "expired"
                      ? "Exam completed"
                      : `Starts ${examStartLocal}`}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons — side by side ghost */}
          <Animated.View entering={enterAnim(100)} style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => ghostPressIn(playFill)}
              onPressOut={() => ghostPressOut(playFill)}
              onPress={navigateToGame}
              style={{ flex: 1 }}
            >
              <Animated.View style={[styles.ghostButton, playBtnAnimStyle]}>
                <Animated.Text style={styles.ghostButtonText}>
                  <Gamepad2 size={18} color={themeColors.tint} />
                </Animated.Text>
                <Text style={styles.ghostButtonText}>Play Game</Text>
              </Animated.View>
            </TouchableOpacity>

            {examButtonState !== "hidden" && examButtonState !== "expired" && (
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => ghostPressIn(examFill)}
                onPressOut={() => ghostPressOut(examFill)}
                disabled={examButtonState !== "active"}
                onPress={() => router.push("/(game)/WeeklyExam")}
                style={{ flex: 1 }}
              >
                <Animated.View style={[
                  styles.ghostButton,
                  examBtnAnimStyle,
                  examButtonState === "completed" && { borderColor: "#4CAF50" },
                ]}>
                  {examButtonState === "completed" ? (
                    <CheckCircle2 size={16} color="#4CAF50" />
                  ) : examButtonState === "active" ? (
                    <FileText size={16} color={themeColors.tint} />
                  ) : (
                    <Clock size={16} color={themeColors.tint} />
                  )}
                  <Text style={[
                    styles.ghostButtonText,
                    examButtonState === "completed" && { color: "#4CAF50" },
                  ]}>
                    {examButtonState === "teaser"
                      ? "Exam Soon"
                      : examButtonState === "active"
                      ? "Weekly Exam"
                      : "Completed"}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Rankings / Knockout Toggle */}
          <Animated.View
            entering={enterAnim(150)}
            style={styles.toggleContainer}
          >
            <Animated.View style={[styles.toggleIndicator, toggleAnimatedStyle]} />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setActiveMode("rankings");
                toggleIndicatorX.value = withTiming(0, { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, activeMode === "rankings" && styles.toggleTextActive]}>
                Rankings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setActiveMode("knockout");
                toggleIndicatorX.value = withTiming(
                  (Dimensions.get("window").width - rS(32) - rMS(6)) / 2,
                  { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) }
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, activeMode === "knockout" && styles.toggleTextActive]}>
                Knockout
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {activeMode === "rankings" ? (
            <>
              {/* Study Squads (Custom Communities) */}
              <Animated.View
                entering={enterAnim(200)}
                style={styles.squadSection}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Study Squads</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: rS(12) }}>
                    {customLeaderboards.length > 0 && (
                      <TouchableOpacity onPress={openFullLeaderboard}>
                        <Text style={styles.sectionSeeAll}>See All</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.squadAddBtn}
                      onPress={openSquadSheet}
                      activeOpacity={0.7}
                    >
                      <Plus size={20} color={themeColors.tint} />
                    </TouchableOpacity>
                  </View>
                </View>

                {customLeaderboards.length === 0 ? (
                  <View style={styles.squadEmpty}>
                    <Users
                      size={28}
                      color={themeColors.textSecondary}
                      strokeWidth={1.5}
                    />
                    <Text style={styles.squadEmptyText}>
                      Join or create a study squad to compete with friends
                    </Text>
                  </View>
                ) : (
                  rankingsSquads.map((lb) => (
                    <TouchableOpacity
                      key={lb.id}
                      style={styles.squadItem}
                      onPress={() => openLeaderboard(lb.id, lb.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.squadItemLeft}>
                        <View style={styles.squadIcon}>
                          <Users size={18} color={themeColors.tint} />
                        </View>
                        <View>
                          <Text style={styles.squadName}>{lb.name}</Text>
                          {lb.memberCount != null && (
                            <Text style={styles.squadMembers}>
                              {lb.memberCount} members
                            </Text>
                          )}
                        </View>
                      </View>
                      <ChevronRight
                        size={16}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))
                )}
              </Animated.View>

              {/* Custom 1v1 Squads Section */}
              {customLeaderboards.some((lb) => lb.scoringMode === "custom_1v1") && (
                <Animated.View
                  entering={enterAnim(250)}
                  style={{ marginBottom: rV(22) }}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>1v1 Battles</Text>
                  </View>

                  {/* Matches / Standings sub-tab */}
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleButton, customH2HTab === "matches" && styles.toggleButtonActive]}
                      onPress={() => setCustomH2HTab("matches")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, customH2HTab === "matches" && styles.toggleTextActive]}>
                        Matches
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, customH2HTab === "standings" && styles.toggleButtonActive]}
                      onPress={() => setCustomH2HTab("standings")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, customH2HTab === "standings" && styles.toggleTextActive]}>
                        Standings
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {customH2HTab === "matches" ? (
                    customH2HMatches.map((m) => (
                      <View key={m.id} style={styles.standingCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <View
                            style={{
                              width: rMS(8), height: rMS(8), borderRadius: 4,
                              marginRight: rS(8),
                              backgroundColor: m.result === "w" ? "#4CAF50" : m.result === "l" ? "#F44336" : themeColors.tint,
                            }}
                          />
                          <Text style={styles.standingName}>
                            {m.player1} vs {m.player2}
                          </Text>
                        </View>
                        <Text style={[styles.standingRank, { fontSize: rMS(13) }]}>
                          {m.score1} - {m.score2}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <>
                      {/* Table header */}
                      <View style={[styles.standingCard, { backgroundColor: "transparent", paddingVertical: rV(4) }]}>
                        <Text style={[styles.standingName, { flex: 1, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1 }]}>#</Text>
                        <Text style={[styles.standingName, { flex: 3, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1 }]}>PLAYER</Text>
                        <Text style={[styles.standingName, { flex: 1, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1, textAlign: "center" }]}>PTS</Text>
                        <Text style={[styles.standingName, { flex: 1, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1, textAlign: "center" }]}>W</Text>
                        <Text style={[styles.standingName, { flex: 1, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1, textAlign: "center" }]}>D</Text>
                        <Text style={[styles.standingName, { flex: 1, fontSize: rMS(9), color: themeColors.textSecondary, fontWeight: "700", letterSpacing: 1, textAlign: "center" }]}>L</Text>
                      </View>
                      {customH2HStandings.map((s) => (
                        <View key={s.rank} style={[styles.standingCard, s.isUser && { borderWidth: 1.5, borderColor: themeColors.tint + "40", backgroundColor: themeColors.tint + "08" }]}>
                          <Text style={[styles.standingName, { flex: 1, fontSize: rMS(13), fontWeight: "800", color: themeColors.tint }]}>{s.rank}</Text>
                          <View style={{ flex: 3, flexDirection: "row", alignItems: "center" }}>
                            <Text style={[styles.standingName, { fontSize: rMS(13) }]}>{s.name}</Text>
                            {s.tiebreaker && (
                              <View style={{ backgroundColor: "#FF9800" + "20", paddingHorizontal: rMS(6), paddingVertical: rV(1), borderRadius: 4, marginLeft: rS(6) }}>
                                <Text style={{ color: "#FF9800", fontSize: rMS(8), fontWeight: "800" }}>🪙 COIN</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ flex: 1, fontSize: rMS(13), fontWeight: "800", color: themeColors.text, textAlign: "center" }}>{s.pts}</Text>
                          <Text style={{ flex: 1, fontSize: rMS(12), color: "#4CAF50", textAlign: "center", fontWeight: "700" }}>{s.w}</Text>
                          <Text style={{ flex: 1, fontSize: rMS(12), color: themeColors.tint, textAlign: "center", fontWeight: "700" }}>{s.d}</Text>
                          <Text style={{ flex: 1, fontSize: rMS(12), color: "#F44336", textAlign: "center", fontWeight: "700" }}>{s.l}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </Animated.View>
              )}

              {/* Global Standing */}
              <Animated.View entering={enterAnim(300)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Rank</Text>
                </View>

                {globalStandingItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={enterAnim(350 + index * 50)}
                  >
                    <TouchableOpacity
                      style={styles.standingCard}
                      onPress={() => openLeaderboard(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.standingCardLeft}>
                        <View
                          style={[styles.standingIconBox, { backgroundColor: item.color }]}
                        >
                          <item.IconComponent size={18} color="#fff" />
                        </View>
                        <Text style={styles.standingName}>{item.name}</Text>
                      </View>
                      <View style={styles.standingCardRight}>
                        {renderRankIndicator(undefined)}
                        {item.rank && (
                          <Text style={styles.standingRank}>{item.rank}</Text>
                        )}
                        <ChevronRight
                          size={16}
                          color={themeColors.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          ) : (
            /* Knockout Mode — H2H Squad Knockouts */
            <Animated.View entering={enterAnim(200)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Squad Knockouts</Text>
              </View>

              {knockoutSquads.map((lb, idx) => (
                <Animated.View
                  key={lb.id}
                  entering={enterAnim(250 + idx * 50)}
                >
                  <TouchableOpacity
                    style={styles.cupCard}
                    onPress={() => openLeaderboard(lb.id, lb.name, "knockout")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cupCardLeft}>
                      <View style={[styles.cupIcon, { backgroundColor: themeColors.tint + "15" }]}>
                        <Zap
                          size={18}
                          color={themeColors.tint}
                        />
                      </View>
                      <View>
                        <Text style={styles.cupName}>{lb.name}</Text>
                        {lb.memberCount != null && (
                          <Text style={styles.cupWeek}>{lb.memberCount} members</Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </Animated.View>
              ))}

              {knockoutSquads.length === 0 && (
                <View style={styles.squadEmpty}>
                  <Trophy size={28} color={themeColors.textSecondary} strokeWidth={1.5} />
                  <Text style={styles.squadEmptyText}>
                    Create an H2H League squad to compete in knockouts!
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Squad Bottom Sheet */}
      <BottomSheetModal
        ref={squadSheetRef}
        snapPoints={sheetSnapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: themeColors.background,
          borderRadius: rMS(28),
        }}
        handleIndicatorStyle={{
          backgroundColor: themeColors.textSecondary + "50",
          width: rS(40),
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: rS(20), paddingBottom: rV(30) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {createdSquadCode ? (
            /* ── Success state: show invite code ── */
            <View style={{ alignItems: "center", paddingVertical: rV(24) }}>
              <CheckCircle2 size={56} color="#4CAF50" />
              <Text style={[styles.modalTitle, { marginTop: rV(12), textAlign: "center" }]}>Squad Created!</Text>
              <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>
                Share this invite code with friends so they can join your squad.
              </Text>
              <View style={{
                backgroundColor: themeColors.cardGlass,
                borderRadius: rMS(20),
                paddingVertical: rV(14),
                paddingHorizontal: rMS(28),
                marginTop: rV(8),
                borderWidth: 1.5,
                borderColor: themeColors.tint + "30",
                ...shadow.medium,
              }}>
                <Text style={{ fontSize: rMS(28), fontWeight: "900", color: themeColors.tint, letterSpacing: 4, textAlign: "center" }}>
                  {createdSquadCode}
                </Text>
              </View>
              <TouchableOpacity
                style={{ marginTop: rV(12), flexDirection: "row", alignItems: "center", gap: rS(6) }}
                onPress={() => {
                  try {
                    const Clipboard = require("expo-clipboard");
                    Clipboard.setStringAsync(createdSquadCode);
                    showToast("Code copied!");
                  } catch {
                    showToast(createdSquadCode!);
                  }
                }}
              >
                <Copy size={16} color={themeColors.tint} />
                <Text style={{ fontSize: rMS(13), fontWeight: "700", color: themeColors.tint }}>Copy Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.squadJoinBtn, { width: "100%", marginTop: rV(20) }]}
                onPress={closeSquadSheet}
              >
                <Text style={styles.squadJoinBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Create / Join tabbed state ── */
            <>
              {/* Tab switcher */}
              <View style={{
                flexDirection: "row",
                backgroundColor: themeColors.cardGlass,
                borderRadius: rMS(16),
                padding: rMS(3),
                marginBottom: rV(18),
                borderWidth: 1,
                borderColor: themeColors.border + "30",
                position: "relative",
              }}>
                {/* Sliding indicator */}
                <Animated.View style={[{
                  position: "absolute",
                  top: rMS(3),
                  bottom: rMS(3),
                  left: rMS(3),
                  width: "50%",
                  backgroundColor: themeColors.tint,
                  borderRadius: rMS(13),
                }, sheetTabAnimStyle]} />
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: rV(10),
                    borderRadius: rMS(13),
                    alignItems: "center",
                    zIndex: 1,
                  }}
                  onPress={() => {
                    setSheetTab("create");
                    sheetTabX.value = withTiming(0, { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    fontSize: rMS(13),
                    fontWeight: "800",
                    color: sheetTab === "create" ? "#fff" : themeColors.textSecondary,
                  }}>Create Squad</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: rV(10),
                    borderRadius: rMS(13),
                    alignItems: "center",
                    zIndex: 1,
                  }}
                  onPress={() => {
                    setSheetTab("join");
                    sheetTabX.value = withTiming(
                      (Dimensions.get("window").width - rS(40) - rMS(6)) / 2,
                      { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) }
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    fontSize: rMS(13),
                    fontWeight: "800",
                    color: sheetTab === "join" ? "#fff" : themeColors.textSecondary,
                  }}>Join Squad</Text>
                </TouchableOpacity>
              </View>

              {sheetTab === "create" ? (
                /* ── CREATE TAB ── */
                <>
                  {/* Squad Name Input */}
                  <Text style={{ fontSize: rMS(11), fontWeight: "700", color: themeColors.textSecondary, marginBottom: rV(6), textTransform: "uppercase", letterSpacing: 1 }}>
                    Squad Name
                  </Text>
                  <BottomSheetTextInput
                    style={[styles.squadJoinInput, { width: "100%", marginBottom: rV(14) }]}
                    value={squadName}
                    onChangeText={setSquadName}
                    placeholder="e.g. CS Study Squad"
                    placeholderTextColor={themeColors.textSecondary}
                    maxLength={40}
                  />

                  <Text style={{ fontSize: rMS(11), fontWeight: "700", color: themeColors.textSecondary, marginBottom: rV(10), textTransform: "uppercase", letterSpacing: 1 }}>
                    Choose Scoring Mode
                  </Text>

                  <TouchableOpacity
                    style={[styles.modeOption, { borderColor: themeColors.tint }]}
                    activeOpacity={0.8}
                    onPress={() => createSquad("all_points")}
                  >
                    <Text style={styles.modeOptionLabel}>📊 All Points</Text>
                    <Text style={styles.modeOptionDesc}>
                      Points from multiplayer, solo games, and weekly exam all count.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeOption}
                    activeOpacity={0.8}
                    onPress={() => createSquad("exam_only")}
                  >
                    <Text style={styles.modeOptionLabel}>📝 Exam Only</Text>
                    <Text style={styles.modeOptionDesc}>
                      Only weekly exam scores count towards the leaderboard.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeOption}
                    activeOpacity={0.8}
                    onPress={() => createSquad("custom_1v1")}
                  >
                    <Text style={styles.modeOptionLabel}>⚔️ H2H League</Text>
                    <Text style={styles.modeOptionDesc}>
                      Members are matched weekly. Win=3 pts, Draw=1, Loss=0.
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ── JOIN TAB ── */
                <>
                  <View style={{ alignItems: "center", marginBottom: rV(20), marginTop: rV(8) }}>
                    <View style={{
                      width: rMS(56),
                      height: rMS(56),
                      borderRadius: rMS(28),
                      backgroundColor: themeColors.tint + "12",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: rV(12),
                    }}>
                      <LogIn size={28} color={themeColors.tint} />
                    </View>
                    <Text style={[styles.modalTitle, { textAlign: "center" }]}>Join a Squad</Text>
                    <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>
                      Enter the invite code shared by your squad creator.
                    </Text>
                  </View>

                  <BottomSheetTextInput
                    style={[styles.squadJoinInput, {
                      width: "100%",
                      textAlign: "center",
                      fontSize: rMS(20),
                      fontWeight: "900",
                      letterSpacing: 4,
                      paddingVertical: rV(14),
                      marginBottom: rV(16),
                    }]}
                    value={squadJoinCode}
                    onChangeText={setSquadJoinCode}
                    placeholder="INVITE CODE"
                    placeholderTextColor={themeColors.textSecondary}
                    autoCapitalize="characters"
                    maxLength={10}
                  />

                  <TouchableOpacity
                    style={[styles.squadJoinBtn, { width: "100%" }, !squadJoinCode.trim() && { opacity: 0.5 }]}
                    onPress={joinSquad}
                    disabled={!squadJoinCode.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.squadJoinBtnText}>
                      {joinSquadMutation.isPending ? "Joining..." : "Join Squad"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}
