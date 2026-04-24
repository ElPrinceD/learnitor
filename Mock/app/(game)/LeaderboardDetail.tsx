import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RankingItem {
  id: number;
  rank: number;
  username: string;
  avatarUrl: string | null;
  score: number;
  movement?: "up" | "down" | "same";
}

interface H2HMatch {
  id: string;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  result: "player1" | "player2" | "draw" | "pending";
  round: number;
}

// Mock user knockout matchups — only played rounds + immediate next
// Cup rounds are calculated by backend based on squad member count (FPL-style)
// Season = 13 weeks. Rounds = ceil(log2(members)). Cup starts at week (13 - rounds + 1).
// If odd members, "Average" is a virtual player (score = global average that week)
const MOCK_USER_KNOCKOUT_MATCHES = [
  { id: "cm1", p1Name: "Adeniyi Adejobi", p1Team: "Edimoya", p2Name: "The Gyam", p2Team: "AnteMaggie", p1Score: 0, p2Score: 0, roundText: "SW 12 • Round of 32", status: "pending" },
  { id: "cm2", p1Name: "The Gyam", p1Team: "AnteMaggie", p2Name: "Edmond Fosu", p2Team: "OmontoGh", p1Score: 134, p2Score: 60, roundText: "SW 11 • Round of 64", status: "won" },
  { id: "cm3", p1Name: "The Gyam", p1Team: "AnteMaggie", p2Name: "Olubunmi Owaduge", p2Team: "J'blaze", p1Score: 60, p2Score: 47, roundText: "SW 10 • Round of 128", status: "won" },
  { id: "cm4", p1Name: "The Gyam", p1Team: "AnteMaggie", p2Name: "Average", p2Team: "Virtual", p1Score: 90, p2Score: 88, roundText: "SW 9 • Round of 256", status: "won" },
  { id: "cm5", p1Name: "The Gyam", p1Team: "AnteMaggie", p2Name: "BYE", p2Team: "BYE", p1Score: null, p2Score: null, roundText: "SW 8 • Round of 512", status: "bye" },
];

export default function LeaderboardDetail() {
  const { id, name, timeframe, type } = useLocalSearchParams<{
    id: string;
    name: string;
    timeframe: string;
    type?: string;
  }>();
  const { userToken, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  // Use "knockout" tab by default if type="knockout" was passed from play.tsx
  const [activeTab, setActiveTab] = useState<"rankings" | "knockout">(type === "knockout" ? "knockout" : "rankings");
  const [knockoutMatches] = useState(MOCK_USER_KNOCKOUT_MATCHES);

  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  useEffect(() => {
    fetchRankings();
  }, [id, timeframe]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${ApiUrl}/api/leaderboards/details/${id}`,
        {
          headers: { Authorization: `Token ${userToken?.token}` },
          params: { timeframe },
        }
      );
      setRankings(res.data.rankings || []);
    } catch (e) {
      setRankings([
        { id: 1, rank: 1, username: "Alex Johnson", avatarUrl: null, score: 9850, movement: "up" },
        { id: 2, rank: 2, username: "Sam Smith", avatarUrl: null, score: 8700, movement: "down" },
        { id: 3, rank: 3, username: "You", avatarUrl: null, score: 8520, movement: "same" },
        { id: 4, rank: 4, username: "Jordan Lee", avatarUrl: null, score: 7900, movement: "up" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRank = (rank: number) => rank.toString().padStart(2, "0");
  const formatScore = (score: number) => score.toLocaleString() + " PTS";

  const getRankColor = (rank: number) => {
    if (rank === 1) return themeColors.tint;
    return themeColors.textSecondary + "90";
  };

  const isMe = (username: string) =>
    username === userInfo?.user.first_name || username === "You";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(12), insets.top + rV(8)),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(20)),
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(16),
    },
    backButton: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(12),
      backgroundColor: themeColors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    heroSection: {
      marginBottom: rV(24),
    },
    heroLabel: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.tint,
      marginBottom: rV(6),
    },
    heroTitle: {
      fontSize: rMS(32),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -1,
      lineHeight: rMS(34),
    },
    columnHeaders: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: rS(20),
      marginBottom: rV(10),
    },
    columnLabel: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
    },
    rankCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.card,
      padding: rMS(14),
      borderRadius: rMS(20),
      marginBottom: rV(10),
    },
    myRankCard: {
      backgroundColor: themeColors.tint + "12",
      borderWidth: 1.5,
      borderColor: themeColors.tint + "40",
    },
    rankCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(14),
      flex: 1,
    },
    rankNumber: {
      fontSize: rMS(15),
      fontWeight: "800",
      width: rS(28),
    },
    rankAvatar: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(14),
      backgroundColor: themeColors.background,
    },
    rankInfo: {
      flex: 1,
    },
    rankName: {
      fontSize: SIZES.small,
      fontWeight: "700",
      color: themeColors.text,
    },
    myRankName: {
      color: themeColors.tint,
      fontWeight: "800",
    },
    rankScore: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.tint,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      marginTop: rV(10),
    },
    // Sub-tabs
    subTabRow: {
      flexDirection: "row",
      backgroundColor: themeColors.card,
      borderRadius: rMS(10),
      padding: rMS(3),
      marginBottom: rV(16),
    },
    subTab: {
      flex: 1,
      paddingVertical: rV(8),
      borderRadius: rMS(8),
      alignItems: "center",
    },
    subTabActive: {
      backgroundColor: themeColors.tint,
    },
    subTabText: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    subTabTextActive: {
      color: "#fff",
    },
    // H2H match row
    matchCard: {
      backgroundColor: themeColors.card,
      padding: rMS(14),
      borderRadius: rMS(14),
      marginBottom: rV(8),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    matchPlayers: {
      flex: 1,
    },
    matchPlayerText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.text,
    },
    matchScore: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.tint,
    },
    matchPending: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      fontWeight: "600",
    },
    matchResultDot: {
      width: rMS(8),
      height: rMS(8),
      borderRadius: rMS(4),
      marginRight: rS(6),
    },
    // Bracket
    bracketRound: {
      marginBottom: rV(18),
    },
    bracketRoundTitle: {
      fontSize: rMS(11),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    bracketMatch: {
      backgroundColor: themeColors.card,
      padding: rMS(12),
      borderRadius: rMS(10),
      marginBottom: rV(6),
      borderLeftWidth: 3,
      borderLeftColor: themeColors.tint,
    },
    bracketMatchText: {
      fontSize: rMS(13),
      fontWeight: "600",
      color: themeColors.text,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={styles.loadingText}>Loading Rankings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.backRow}
        >
          <AnimatedTouchable
            style={[styles.backButton, backAnimStyle]}
            onPress={() => router.back()}
            onPressIn={() => {
              backScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
            activeOpacity={1}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.text} />
          </AnimatedTouchable>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>
            {timeframe === "season" ? "Current Season" : "All-Time"}
          </Text>
          <Text style={styles.heroTitle}>
            {(name || "Rankings").toUpperCase()}
          </Text>
        </Animated.View>

        {/* Sub-Tabs: Rankings | Knockout */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.subTabRow}
        >
          {([{ key: "rankings", label: "Rankings" }, { key: "knockout", label: "Knockout" }] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.subTab, activeTab === tab.key && styles.subTabActive]}
              onPress={() => setActiveTab(tab.key as "rankings" | "knockout")}
              activeOpacity={0.8}
            >
              <Text style={[styles.subTabText, activeTab === tab.key && styles.subTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {activeTab === "rankings" && (
          <>
            {/* Column Headers */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(250)}
              style={styles.columnHeaders}
            >
              <Text style={styles.columnLabel}>Rank / Student</Text>
              <Text style={styles.columnLabel}>Points</Text>
            </Animated.View>

            {/* Rankings */}
            {rankings.map((item, index) => {
              const userIsMe = isMe(item.username);
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(400).delay(300 + index * 60)}
                >
                  <View
                    style={[styles.rankCard, userIsMe && styles.myRankCard]}
                  >
                    <View style={styles.rankCardLeft}>
                      <Text
                        style={[
                          styles.rankNumber,
                          { color: getRankColor(item.rank) },
                        ]}
                      >
                        {formatRank(item.rank)}
                      </Text>
                      {/* Rank movement indicator */}
                      {item.movement === "up" && (
                        <Text style={{ color: "#4CAF50", fontSize: rMS(11), fontWeight: "800", marginRight: rS(4) }}>▲</Text>
                      )}
                      {item.movement === "down" && (
                        <Text style={{ color: "#F44336", fontSize: rMS(11), fontWeight: "800", marginRight: rS(4) }}>▼</Text>
                      )}
                      {item.movement === "same" && (
                        <Text style={{ color: themeColors.textSecondary, fontSize: rMS(11), fontWeight: "800", marginRight: rS(4) }}>—</Text>
                      )}
                      <Image
                        source={
                          item.avatarUrl
                            ? { uri: item.avatarUrl }
                            : require("../../assets/images/profile-placeholder.png")
                        }
                        style={styles.rankAvatar}
                      />
                      <View style={styles.rankInfo}>
                        <Text
                          style={[
                            styles.rankName,
                            userIsMe && styles.myRankName,
                          ]}
                          numberOfLines={1}
                        >
                          {item.username}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.rankScore}>
                      {formatScore(item.score)}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </>
        )}

        {activeTab === "cup" && (
          <View style={{ paddingTop: rV(10) }}>
            {cupMatches.map((match, idx) => (
              <Animated.View
                key={match.id}
                entering={FadeInDown.duration(400).delay(250 + idx * 80)}
                style={{ marginBottom: rV(32) }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: rV(12) }}>
                  {/* Left Player (p1) */}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ fontSize: rMS(13), fontWeight: "700", color: themeColors.text }}>{match.p1Name}</Text>
                    <Text style={{ fontSize: rMS(10), color: themeColors.textSecondary, marginTop: rV(2) }}>{match.p1Team}</Text>
                  </View>

                  {/* Score/Status Center Block */}
                  <View style={{ 
                    backgroundColor: "#FFFFFF",
                    borderRadius: rMS(6), 
                    paddingHorizontal: rMS(12), 
                    paddingVertical: rV(6), 
                    marginHorizontal: rS(16),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: rMS(70)
                  }}>
                    {match.status === "bye" ? (
                      <Text style={{ fontSize: rMS(16), fontWeight: "800", color: "#1a1a1a" }}>N/A</Text>
                    ) : match.status === "pending" ? (
                      <>
                        <Text style={{ fontSize: rMS(16), fontWeight: "800", color: "#1a1a1a" }}>0</Text>
                        <View style={{ width: 1, height: rV(14), backgroundColor: "#e0e0e0", marginHorizontal: rS(8) }} />
                        <Text style={{ fontSize: rMS(16), fontWeight: "800", color: "#1a1a1a" }}>0</Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: rMS(16), fontWeight: "800", color: "#1a1a1a" }}>{match.p1Score}</Text>
                        <View style={{ width: 1, height: rV(14), backgroundColor: "#e0e0e0", marginHorizontal: rS(8) }} />
                        <Text style={{ fontSize: rMS(16), fontWeight: "800", color: "#1a1a1a" }}>{match.p2Score}</Text>
                      </>
                    )}
                  </View>

                  {/* Right Player (p2) */}
                  <View style={{ flex: 1, alignItems: "flex-start" }}>
                    <Text style={{ fontSize: rMS(13), fontWeight: "700", color: themeColors.text }}>{match.p2Name}</Text>
                    <Text style={{ fontSize: rMS(10), color: themeColors.textSecondary, marginTop: rV(2) }}>{match.p2Team}</Text>
                  </View>
                </View>

                {/* Round text below */}
                <Text style={{ textAlign: "center", fontSize: rMS(10), color: themeColors.textSecondary }}>{match.roundText}</Text>
              </Animated.View>
            ))}

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: rV(20) }}>
              <View style={{ flex: 1, height: 1, backgroundColor: themeColors.border }} />
              <Text style={{ marginHorizontal: rS(12), fontSize: rMS(10), color: themeColors.textSecondary, fontWeight: "600", textAlign: "center" }}>
                Knockout started in SW 8{"\n"}Rounds calculated based on squad members
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: themeColors.border }} />
            </View>
          </View>
        )}

        <ErrorMessage
          message={error}
          visible={!!error}
          onDismiss={() => setError("")}
        />
      </ScrollView>
    </View>
  );
}
