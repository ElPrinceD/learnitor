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
  FadeInUp,
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
  badge?: string;
}

interface UserStatus {
  rank: number | null;
  percentile: string | null;
  message: string | null;
}

export default function Leaderboard() {
  const { id, name, timeframe: tfParam } = useLocalSearchParams<{
    id?: string;
    name?: string;
    timeframe?: string;
  }>();
  const { userToken, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    rank: null,
    percentile: null,
    message: null,
  });

  const leaderboardId = id || "world";
  const leaderboardName = name || "World Rankings";

  // Back button scale
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  useEffect(() => {
    fetchRankings();
  }, [leaderboardId, tfParam]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${ApiUrl}/api/leaderboards/details/${leaderboardId}`,
        {
          headers: { Authorization: `Token ${userToken?.token}` },
          params: { timeframe: tfParam || "season" },
        }
      );
      setRankings(res.data.rankings || []);
      if (res.data.userStatus) {
        setUserStatus(res.data.userStatus);
      }
    } catch (e) {
      // Fallback mock data
      setRankings([
        { id: 1, rank: 1, username: "Elena_Quill", avatarUrl: null, score: 24850, badge: "Top Scholar" },
        { id: 2, rank: 2, username: "Julian_Vance", avatarUrl: null, score: 22410, badge: "Rising Star" },
        { id: 3, rank: 3, username: "Marcus_Aureli", avatarUrl: null, score: 21980, badge: "Academic Elite" },
        { id: 4, rank: 4, username: "S_Tanaka", avatarUrl: null, score: 20150, badge: "Physics Expert" },
        { id: 5, rank: 5, username: "D_Rodriguez", avatarUrl: null, score: 19720, badge: "History Buff" },
        { id: 6, rank: 6, username: "Chen_L", avatarUrl: null, score: 18590, badge: "Math Wizard" },
        { id: 7, rank: 7, username: "Omar_Z", avatarUrl: null, score: 17400, badge: "Bio Specialist" },
      ]);
      setUserStatus({
        rank: 452,
        percentile: "top 5%",
        message: "Keep climbing, Learner!",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRank = (rank: number) => {
    return rank.toString().padStart(2, "0");
  };

  const formatScore = (score: number) => {
    return score.toLocaleString() + " PTS";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return themeColors.tint;
    return themeColors.textSecondary + "90";
  };

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
    // Back button
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
    // Hero
    heroSection: {
      marginBottom: rV(28),
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
      fontSize: rMS(36),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -1.5,
      lineHeight: rMS(38),
    },
    heroSubtext: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(10),
      lineHeight: rMS(16),
      maxWidth: "80%",
    },
    // Column headers
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
    // Ranking card
    rankCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.card,
      padding: rMS(14),
      borderRadius: rMS(20),
      marginBottom: rV(10),
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
    rankBadge: {
      fontSize: rMS(8),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    rankScore: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.tint,
    },
    // User Status Card
    userStatusCard: {
      marginTop: rV(24),
      backgroundColor: themeColors.card,
      padding: rMS(20),
      borderRadius: rMS(24),
      borderWidth: 2,
      borderColor: themeColors.tint + "20",
    },
    userStatusTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(14),
      marginBottom: rV(14),
    },
    userRankBadge: {
      backgroundColor: themeColors.tint,
      paddingVertical: rV(6),
      paddingHorizontal: rMS(12),
      borderRadius: rMS(12),
    },
    userRankBadgeText: {
      color: "#fff",
      fontSize: rMS(10),
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    userStatusInfo: {
      flex: 1,
    },
    userStatusTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
    },
    userStatusSubtext: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    viewStatsBtn: {
      backgroundColor: themeColors.tint,
      paddingVertical: rV(12),
      paddingHorizontal: rMS(24),
      borderRadius: rMS(24),
      alignSelf: "flex-start",
    },
    viewStatsBtnText: {
      color: "#fff",
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    // Loading
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

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>Global Leaderboard</Text>
          <Text style={styles.heroTitle}>
            {leaderboardName.toUpperCase().replace(" ", "\n")}
          </Text>
          <Text style={styles.heroSubtext}>
            The elite echelon of learners. Every point represents a boundary
            pushed and a concept mastered.
          </Text>
        </Animated.View>

        {/* Column Headers */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.columnHeaders}
        >
          <Text style={styles.columnLabel}>Rank / Student</Text>
          <Text style={styles.columnLabel}>Academic Points</Text>
        </Animated.View>

        {/* Rankings List */}
        {rankings.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(400).delay(250 + index * 60)}
          >
            <View style={styles.rankCard}>
              <View style={styles.rankCardLeft}>
                <Text
                  style={[
                    styles.rankNumber,
                    { color: getRankColor(item.rank) },
                  ]}
                >
                  {formatRank(item.rank)}
                </Text>
                <Image
                  source={
                    item.avatarUrl
                      ? { uri: item.avatarUrl }
                      : require("../../assets/images/profile-placeholder.png")
                  }
                  style={styles.rankAvatar}
                />
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{item.username}</Text>
                  {item.badge && (
                    <Text style={styles.rankBadge}>{item.badge}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.rankScore}>{formatScore(item.score)}</Text>
            </View>
          </Animated.View>
        ))}

        {/* User Status Card */}
        {userStatus.rank && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(600)}
            style={styles.userStatusCard}
          >
            <View style={styles.userStatusTop}>
              <View style={styles.userRankBadge}>
                <Text style={styles.userRankBadgeText}>
                  YOUR RANK: {userStatus.rank}
                </Text>
              </View>
              <View style={styles.userStatusInfo}>
                <Text style={styles.userStatusTitle}>
                  {userStatus.message || "Keep climbing!"}
                </Text>
                {userStatus.percentile && (
                  <Text style={styles.userStatusSubtext}>
                    You are in the {userStatus.percentile} of global learners
                    this season.
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewStatsBtn}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Text style={styles.viewStatsBtnText}>View My Stats</Text>
            </TouchableOpacity>
          </Animated.View>
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
