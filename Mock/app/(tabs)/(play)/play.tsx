import React, { useState, useEffect } from "react";
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
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "../../../components/AuthContext";
import Toast from "react-native-root-toast";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import ApiUrl from "../../../config";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RankingSummary {
  world: string | null;
  country: string | null;
  school: string | null;
}

interface CustomLeaderboard {
  id: string;
  name: string;
  memberCount?: number;
  scoringMode?: "all_points" | "exam_only" | "custom_1v1";
}

interface H2HMatchup {
  id: string;
  opponentName: string;
  opponentAvatar: string | null;
  userScore: number | null;
  opponentScore: number | null;
  status: "pending" | "won" | "lost" | "draw";
  round: number;
  totalRounds: number;
}

interface WeeklyExamStatus {
  isActive: boolean;
  hasCompleted: boolean;
  startsAt: string;
  endsAt: string;
}

type RankMovement = "up" | "down" | "same";

// Mock data for H2H cup mode
const MOCK_H2H: H2HMatchup = {
  id: "h2h-1",
  opponentName: "Jordan Lee",
  opponentAvatar: null,
  userScore: 134,
  opponentScore: 60,
  status: "won",
  round: 2,
  totalRounds: 4,
};

const MOCK_EXAM_STATUS: WeeklyExamStatus = {
  isActive: true,
  hasCompleted: false,
  startsAt: "2026-04-24T19:00:00Z",
  endsAt: "2026-04-26T23:59:00Z",
};

const MOCK_RANK_MOVEMENTS: Record<string, RankMovement> = {
  world: "up",
  country: "down",
  school: "same",
};

interface CustomH2HStanding {
  rank: number;
  name: string;
  pts: number;
  w: number;
  d: number;
  l: number;
  totalScore: number;
  weekScore: number;
  tiebreaker?: "standoff";
}

interface CustomH2HMatchItem {
  id: string;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  result: "w" | "d" | "l" | "pending";
}

const MOCK_CUSTOM_H2H_STANDINGS: CustomH2HStanding[] = [
  { rank: 1, name: "You", pts: 9, w: 3, d: 0, l: 0, totalScore: 412, weekScore: 134 },
  { rank: 2, name: "Alex Johnson", pts: 7, w: 2, d: 1, l: 0, totalScore: 388, weekScore: 120 },
  { rank: 3, name: "Sam Smith", pts: 7, w: 2, d: 1, l: 0, totalScore: 388, weekScore: 120, tiebreaker: "standoff" },
  { rank: 4, name: "Jordan Lee", pts: 3, w: 1, d: 0, l: 2, totalScore: 250, weekScore: 60 },
];

const MOCK_CUSTOM_H2H_MATCHES: CustomH2HMatchItem[] = [
  { id: "ch1", player1: "You", player2: "Jordan Lee", score1: 134, score2: 60, result: "w" },
  { id: "ch2", player1: "Alex Johnson", player2: "Sam Smith", score1: 120, score2: 120, result: "d" },
];

interface UserCupItem {
  id: string;
  name: string;
  studyWeek: string;
  result: "w" | "l" | "pending";
}

const MOCK_USER_CUPS: UserCupItem[] = [
  { id: "c1", name: "Classico", studyWeek: "SW 11", result: "w" },
  { id: "c2", name: "Agba ballers", studyWeek: "SW 11", result: "w" },
  { id: "c3", name: "Goal Diggers", studyWeek: "SW 11", result: "w" },
  { id: "c4", name: "KNUST CAMPUS", studyWeek: "SW 9", result: "l" },
  { id: "c5", name: "Midnight", studyWeek: "", result: "pending" },
];

// Mock exam scores for this week
const MOCK_EXAM_SCORES = {
  userScore: 134 as number | null, // null if not taken
  globalAverage: 88,
  currentWeek: 11,
};

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
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [gameCode, setGameCode] = useState("");
  const [joinGameDisabled, setJoinGameDisabled] = useState(true);
  const [squadJoinCode, setSquadJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [rankings, setRankings] = useState<RankingSummary>({
    world: null,
    country: null,
    school: null,
  });
  const [customLeaderboards, setCustomLeaderboards] = useState<CustomLeaderboard[]>([]);
  const [activeMode, setActiveMode] = useState<"rankings" | "knockout">("rankings");
  const [h2hMatchup, setH2hMatchup] = useState<H2HMatchup | null>(MOCK_H2H);
  const [examStatus, setExamStatus] = useState<WeeklyExamStatus>(MOCK_EXAM_STATUS);
  const [rankMovements, setRankMovements] = useState<Record<string, RankMovement>>(MOCK_RANK_MOVEMENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customH2HTab, setCustomH2HTab] = useState<"matches" | "standings">("matches");
  const [examScores] = useState(MOCK_EXAM_SCORES);

  // Compute exam button state
  const examButtonState = getExamButtonState(examStatus, new Date());
  const examStartLocal = formatToLocalTime(examStatus.startsAt);
  const examEndLocal = formatToLocalTime(examStatus.endsAt);

  // Animated press scales
  const playBtnScale = useSharedValue(1);

  // Toggle indicator animation
  const toggleIndicatorX = useSharedValue(0);
  const toggleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleIndicatorX.value }],
  }));

  useEffect(() => {
    setJoinGameDisabled(gameCode.length !== 6);
  }, [gameCode]);

  useEffect(() => {
    fetchRankingSummary();
    fetchCustomLeaderboards();
  }, []);

  const fetchRankingSummary = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/api/leaderboards/rankings/summary`, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      setRankings(res.data);
    } catch (e) {
      // Fallback data until backend is ready
      setRankings({ world: "#12,842", country: "#482", school: "#3" });
    }
  };

  const fetchCustomLeaderboards = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/api/leaderboards/custom`, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      setCustomLeaderboards(res.data);
    } catch (e) {
      setCustomLeaderboards([]);
    }
  };

  const createSquad = async (scoringMode: "all_points" | "exam_only" | "custom_1v1" = "all_points") => {
    try {
      const res = await axios.post(
        `${ApiUrl}/api/leaderboards/custom/create`,
        { scoringMode },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      showToast(`Squad created! Code: ${res.data.invite_code}`);
      setShowCreateModal(false);
      fetchCustomLeaderboards();
    } catch (error) {
      showToast("Error creating squad. Try again.");
    }
  };

  const joinSquad = async () => {
    if (squadJoinCode.length < 4) {
      showToast("Enter a valid invite code");
      return;
    }
    try {
      const res = await axios.post(
        `${ApiUrl}/api/leaderboards/custom/join`,
        { inviteCode: squadJoinCode },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      showToast(`Joined ${res.data.name}!`);
      setSquadJoinCode("");
      fetchCustomLeaderboards();
    } catch (error) {
      showToast("Invalid code. Please check and try again.");
    }
  };

  const navigateToGame = () => {
    router.navigate({ pathname: "/(game)/GameIntro" });
  };

  const joinGame = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}/games/join/`,
        { game_code: gameCode },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      if (response.status === 200) {
        const id = response.data.id;
        router.navigate({
          pathname: "/(game)/GameWaiting",
          params: { code: gameCode, id },
        });
      } else {
        showToast("Invalid game code. Please check and try again.");
      }
    } catch (error: any) {
      let errorMessage = "Unable to join game. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Game not found. Please check the code.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid game code. Please check and try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to join this game.";
      }
      showToast(errorMessage);
    }
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

  // Animated button styles
  const playBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playBtnScale.value }],
  }));

  const onPressIn = (scaleValue: Animated.SharedValue<number>) => {
    scaleValue.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const onPressOut = (scaleValue: Animated.SharedValue<number>) => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const globalStandingItems = [
    {
      id: "world",
      name: "World Rankings",
      icon: "earth" as const,
      rank: rankings.world,
      color: themeColors.tint,
      movement: rankMovements.world,
    },
    {
      id: "country",
      name: "Country Rankings",
      icon: "flag" as const,
      rank: rankings.country,
      color: themeColors.tintSecond ?? themeColors.tint,
      movement: rankMovements.country,
    },
    {
      id: "school",
      name: "School Rankings",
      icon: "school" as const,
      rank: rankings.school,
      color: "#8b3b8f",
      movement: rankMovements.school,
    },
  ];

  const renderRankIndicator = (movement?: RankMovement) => {
    if (movement === "up") return <Text style={{ color: "#4CAF50", fontSize: rMS(12), fontWeight: "800" }}>▲</Text>;
    if (movement === "down") return <Text style={{ color: "#F44336", fontSize: rMS(12), fontWeight: "800" }}>▼</Text>;
    return <Text style={{ color: themeColors.textSecondary, fontSize: rMS(12), fontWeight: "800" }}>—</Text>;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(60), insets.top + rV(44)),
      paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
    },
    // Hero
    heroSection: {
      marginBottom: rV(18),
    },
    heroTitle: {
      fontSize: rMS(28),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.5,
      lineHeight: rMS(32),
    },
    heroSubtitle: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(4),
      lineHeight: rMS(18),
    },
    // Action buttons row
    actionRow: {
      flexDirection: "row",
      gap: rS(10),
      marginBottom: rV(20),
    },
    playButton: {
      flex: 1,
      backgroundColor: themeColors.tint,
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      ...shadow.medium,
    },
    playButtonText: {
      color: "#fff",
      fontSize: rMS(13),
      fontWeight: "900",
      letterSpacing: 0.3,
    },
    examBtnInline: {
      flex: 1,
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(6),
      overflow: "hidden",
    },
    examBtnInlineText: {
      fontSize: rMS(12),
      fontWeight: "800",
      letterSpacing: 0.2,
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
      gap: rS(4),
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
    // Exam score card
    examScoreCard: {
      flexDirection: "row",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(16),
      marginBottom: rV(16),
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    examScoreStat: {
      flex: 1,
      alignItems: "center",
    },
    examScoreValue: {
      fontSize: rMS(22),
      fontWeight: "800",
      color: themeColors.text,
    },
    examScoreLabel: {
      fontSize: rMS(10),
      fontWeight: "600",
      color: themeColors.textSecondary,
      marginTop: rV(2),
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    examScoreDivider: {
      width: 1,
      height: rV(32),
      backgroundColor: themeColors.border,
    },
    // Exam button
    examActionBtn: {
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      paddingHorizontal: rMS(20),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(6),
      overflow: "hidden",
    },
    examActionBtnText: {
      fontSize: rMS(14),
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    examTimeText: {
      fontSize: rMS(10),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginBottom: rV(16),
      lineHeight: rMS(14),
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
          {/* Hero Header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.heroSection}
          >
            <Text style={styles.heroTitle}>Rankings</Text>
            <Text style={styles.heroSubtitle}>
              Track your standing and compete across knowledge communities.
            </Text>
          </Animated.View>

          {/* Exam Score Card */}
          <Animated.View entering={FadeInDown.duration(500).delay(120)}>
            <View style={styles.examScoreCard}>
              <View style={styles.examScoreStat}>
                <Text style={styles.examScoreValue}>{examScores.globalAverage}</Text>
                <Text style={styles.examScoreLabel}>Global Avg</Text>
              </View>
              <View style={styles.examScoreDivider} />
              <View style={styles.examScoreStat}>
                <Text style={[styles.examScoreValue, { color: themeColors.tint }]}>
                  {examScores.userScore ?? "—"}
                </Text>
                <Text style={styles.examScoreLabel}>Your Score</Text>
              </View>
              <View style={styles.examScoreDivider} />
              <View style={styles.examScoreStat}>
                <Text style={[styles.examScoreValue, { fontSize: rMS(16) }]}>
                  SW {examScores.currentWeek}
                </Text>
                <Text style={styles.examScoreLabel}>Study Week</Text>
              </View>
            </View>
          </Animated.View>

          {/* Exam Time Display */}
          <Animated.View entering={FadeInDown.duration(500).delay(130)}>
            <Text style={styles.examTimeText}>
              🕐 Weekly Exam · {examStartLocal} — {examEndLocal}
            </Text>
          </Animated.View>

          {/* Play Game + Exam — side by side */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.actionRow}>
            <AnimatedTouchable
              style={[styles.playButton, playBtnAnimStyle]}
              onPress={navigateToGame}
              onPressIn={() => onPressIn(playBtnScale)}
              onPressOut={() => onPressOut(playBtnScale)}
              activeOpacity={1}
            >
              <Ionicons name="game-controller" size={20} color="#fff" />
              <Text style={styles.playButtonText}>Play Game</Text>
            </AnimatedTouchable>

            {examButtonState !== "hidden" && examButtonState !== "expired" && (
              <TouchableOpacity
                style={[
                  styles.examBtnInline,
                  {
                    backgroundColor:
                      examButtonState === "active"
                        ? themeColors.tint
                        : examButtonState === "completed"
                        ? "#4CAF50" + "20"
                        : themeColors.cardGlass,
                    borderWidth: examButtonState === "active" ? 0 : 1.5,
                    borderColor: examButtonState === "completed" ? "#4CAF50" + "40" : themeColors.tint + "40",
                  },
                ]}
                activeOpacity={examButtonState === "active" ? 0.8 : 1}
                disabled={examButtonState !== "active"}
                onPress={() => router.push("/(game)/WeeklyExam")}
              >
                <Ionicons
                  name={examButtonState === "completed" ? "checkmark-circle" : examButtonState === "active" ? "document-text" : "time"}
                  size={18}
                  color={examButtonState === "active" ? "#fff" : examButtonState === "completed" ? "#4CAF50" : themeColors.textSecondary}
                />
                <Text
                  style={[
                    styles.examBtnInlineText,
                    {
                      color:
                        examButtonState === "active"
                          ? "#fff"
                          : examButtonState === "completed"
                          ? "#4CAF50"
                          : themeColors.textSecondary,
                    },
                  ]}
                >
                  {examButtonState === "teaser"
                    ? "Exam Soon"
                    : examButtonState === "active"
                    ? "Weekly Exam"
                    : "Completed"}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Rankings / Knockout Toggle — animated indicator */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(250)}
            style={styles.toggleContainer}
          >
            {/* Animated sliding indicator */}
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
                entering={FadeInDown.duration(500).delay(400)}
                style={styles.squadSection}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Study Squads</Text>
                  {customLeaderboards.length > 0 && (
                    <TouchableOpacity onPress={openFullLeaderboard}>
                      <Text style={styles.sectionSeeAll}>See All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {customLeaderboards.length === 0 ? (
                  <View style={styles.squadEmpty}>
                    <Ionicons
                      name="people-outline"
                      size={28}
                      color={themeColors.textSecondary}
                    />
                    <Text style={styles.squadEmptyText}>
                      Join or create a study squad to compete with friends
                    </Text>
                    
                    <View style={styles.squadActionsRow}>
                      <TouchableOpacity 
                        style={[styles.squadActionButton, styles.squadActionButtonPrimary]}
                        activeOpacity={0.8}
                        onPress={() => setShowCreateModal(true)}
                      >
                        <View style={styles.squadActionTextContent}>
                          <Text style={[styles.squadActionLabel, { color: "#fff" }]}>New Squad</Text>
                          <Text style={[styles.squadActionTitle, { color: "#fff" }]}>Create</Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.squadActionButton, styles.squadActionButtonSecondary]}
                        activeOpacity={0.8}
                        onPress={() => setShowJoinInput(!showJoinInput)}
                      >
                        <View style={styles.squadActionTextContent}>
                          <Text style={[styles.squadActionLabel, { color: themeColors.tint }]}>Entry Code</Text>
                          <Text style={[styles.squadActionTitle, { color: themeColors.tint }]}>Join</Text>
                        </View>
                        <Ionicons 
                          name={showJoinInput ? "chevron-up" : "keypad"} 
                          size={20} 
                          color={themeColors.tint} 
                        />
                      </TouchableOpacity>
                    </View>

                    {showJoinInput && (
                      <Animated.View 
                        entering={FadeInDown.duration(300)}
                        style={styles.squadJoinInputContainer}
                      >
                        <TextInput
                          style={styles.squadJoinInput}
                          value={squadJoinCode}
                          onChangeText={setSquadJoinCode}
                          placeholder="Enter invite code"
                          placeholderTextColor={themeColors.textSecondary}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity 
                          style={[styles.squadJoinBtn, !squadJoinCode && { opacity: 0.5 }]}
                          onPress={joinSquad}
                          disabled={!squadJoinCode}
                        >
                          <Text style={styles.squadJoinBtnText}>Join</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </View>
                ) : (
                  customLeaderboards.map((lb) => (
                    <TouchableOpacity
                      key={lb.id}
                      style={styles.squadItem}
                      onPress={() => openLeaderboard(lb.id, lb.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.squadItemLeft}>
                        <View style={styles.squadIcon}>
                          <Ionicons name="people" size={20} color={themeColors.tint} />
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
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))
                )}
              </Animated.View>

              {/* Custom 1v1 Squads Section */}
              {customLeaderboards.some((lb) => lb.scoringMode === "custom_1v1") && (
                <Animated.View
                  entering={FadeInDown.duration(500).delay(450)}
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
                    MOCK_CUSTOM_H2H_MATCHES.map((m) => (
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
                      {MOCK_CUSTOM_H2H_STANDINGS.map((s) => (
                        <View key={s.rank} style={[styles.standingCard, s.name === "You" && { borderWidth: 1.5, borderColor: themeColors.tint + "40", backgroundColor: themeColors.tint + "08" }]}>
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
              <Animated.View entering={FadeInDown.duration(500).delay(500)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Rank</Text>
                </View>

                {globalStandingItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(400).delay(550 + index * 80)}
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
                          <Ionicons name={item.icon} size={24} color="#fff" />
                        </View>
                        <Text style={styles.standingName}>{item.name}</Text>
                      </View>
                      <View style={styles.standingCardRight}>
                        {renderRankIndicator(item.movement)}
                        {item.rank && (
                          <Text style={styles.standingRank}>{item.rank}</Text>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={themeColors.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            </>
          ) : (
            /* Knockout Mode — Squad Knockouts */
            <Animated.View entering={FadeInDown.duration(500).delay(400)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Squad Knockouts</Text>
              </View>

              {MOCK_USER_CUPS.map((cup, idx) => (
                <Animated.View
                  key={cup.id}
                  entering={FadeInDown.duration(400).delay(450 + idx * 80)}
                >
                  <TouchableOpacity
                    style={styles.cupCard}
                    onPress={() => openLeaderboard(cup.id, cup.name, "knockout")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cupCardLeft}>
                      <View style={[styles.cupIcon, { backgroundColor: cup.result === "w" ? "#4CAF50" + "18" : cup.result === "l" ? "#F44336" + "18" : themeColors.tint + "15" }]}>
                        <Ionicons
                          name={cup.result === "w" ? "trophy" : cup.result === "l" ? "close-circle" : "time"}
                          size={18}
                          color={cup.result === "w" ? "#4CAF50" : cup.result === "l" ? "#F44336" : themeColors.tint}
                        />
                      </View>
                      <View>
                        <Text style={styles.cupName}>{cup.name}</Text>
                        {cup.studyWeek ? <Text style={styles.cupWeek}>{cup.studyWeek}</Text> : null}
                      </View>
                    </View>
                    {cup.result !== "pending" ? (
                      <View style={[styles.cupResultBadge, { backgroundColor: cup.result === "w" ? "#4CAF50" : "#F44336" }]}>
                        <Text style={styles.cupResultText}>{cup.result.toUpperCase()}</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}

              {MOCK_USER_CUPS.length === 0 && (
                <View style={styles.squadEmpty}>
                  <Ionicons name="trophy-outline" size={28} color={themeColors.textSecondary} />
                  <Text style={styles.squadEmptyText}>
                    You haven't joined any cups yet!
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Squad Creation Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create a Squad</Text>
            <Text style={styles.modalSubtitle}>
              Choose how scores are tracked in your squad.
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

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
