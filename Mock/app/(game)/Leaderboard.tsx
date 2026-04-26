import React, { useState, useEffect, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { getLeaderboardDetails, RankingItem, UserStatus } from "../../services/LeaderboardApiCalls";
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
import { BlurView } from "expo-blur";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Mock data will be kept below

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

  // We can derive loading/error from react-query

  const leaderboardId = id || "world";
  const leaderboardName = name || "World Rankings";

  // Back button scale
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  // One-time animation flag
  const hasAnimated = useRef(false);
  useEffect(() => { hasAnimated.current = true; }, []);
  const enterAnim = (delay: number) =>
    hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay);

  // React Query Hook
  const { data: leaderboardData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["leaderboardDetails", leaderboardId, tfParam],
    queryFn: () => getLeaderboardDetails(leaderboardId, userToken?.token, tfParam || "season"),
    enabled: !!userToken?.token,
  });

  const rankings = leaderboardData?.rankings || [];
  const userStatus = leaderboardData?.userStatus || { rank: null, percentile: null, message: null };
  const error = queryError ? "Failed to load rankings" : "";

  const formatRank = (rank: number) => {
    return rank.toString().padStart(2, "0");
  };

  const formatScore = (score: number) => {
    return score.toLocaleString() + " PTS";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return themeColors.tint;
    if (rank <= 3) return "#FFD700"; // Gold for top 3
    return themeColors.textSecondary + "90";
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Background blur shapes for glassmorphism
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
      top: rV(200),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#6366F118",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(rV(80), insets.top + rV(50)),
      zIndex: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      paddingBottom: rV(8),
      paddingHorizontal: rS(16),
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(80), insets.top + rV(50)),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(40)),
    },
    backButton: {
      width: rMS(38),
      height: rMS(38),
      borderRadius: rMS(19),
      backgroundColor: themeColors.cardGlass,
      alignItems: "center",
      justifyContent: "center",
      ...shadow.light,
    },
    // Hero
    heroSection: {
      marginBottom: rV(32),
      paddingHorizontal: rS(8),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    heroTitle: {
      fontSize: rMS(40),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1.5,
      lineHeight: rMS(44),
    },
    heroSubtext: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      marginTop: rV(12),
      lineHeight: rMS(18),
      maxWidth: "85%",
    },
    // Column headers
    columnHeaders: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: rS(24),
      marginBottom: rV(12),
    },
    columnLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
    },
    // Ranking card - compact pill
    rankCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.cardGlass,
      padding: rMS(10),
      borderRadius: rMS(20),
      marginBottom: rV(6),
      ...shadow.small,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    rankCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(8),
      flex: 1,
    },
    rankNumber: {
      fontSize: rMS(13),
      fontWeight: "900",
      width: rS(24),
      textAlign: "center",
    },
    rankAvatar: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      backgroundColor: themeColors.background,
    },
    rankInfo: {
      flex: 1,
    },
    rankName: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(1),
    },
    rankBadge: {
      fontSize: rMS(8),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
    },
    rankScore: {
      fontSize: rMS(12),
      fontWeight: "900",
      color: themeColors.tint,
    },
    // User Status Card - heavily rounded
    userStatusCardContainer: {
      marginTop: rV(32),
      borderRadius: rMS(36),
      overflow: "hidden",
      ...shadow.large,
    },
    userStatusCardBlur: {
      padding: rMS(24),
      backgroundColor: themeColors.tint + "10",
    },
    userStatusTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(16),
      marginBottom: rV(16),
    },
    userRankBadge: {
      backgroundColor: themeColors.tint,
      paddingVertical: rV(8),
      paddingHorizontal: rMS(16),
      borderRadius: rMS(20),
    },
    userRankBadgeText: {
      color: "#fff",
      fontSize: rMS(11),
      fontWeight: "900",
      letterSpacing: 1,
    },
    userStatusInfo: {
      flex: 1,
    },
    userStatusTitle: {
      fontSize: rMS(18),
      fontWeight: "900",
      color: themeColors.text,
    },
    userStatusSubtext: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      marginTop: rV(4),
    },
    viewStatsBtn: {
      backgroundColor: themeColors.text,
      paddingVertical: rV(14),
      paddingHorizontal: rMS(28),
      borderRadius: rMS(28),
      alignSelf: "flex-start",
    },
    viewStatsBtnText: {
      color: themeColors.background,
      fontSize: rMS(11),
      fontWeight: "900",
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
      marginTop: rV(12),
      fontWeight: "700",
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
        backgroundColor="transparent"
        translucent
      />
      {/* Background blobs for glassmorphism effect */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Frosted glass top bar with sticky back button */}
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.topBar}
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
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </AnimatedTouchable>
      </BlurView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero Section */}
        <Animated.View
          entering={enterAnim(50)}
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
          entering={enterAnim(100)}
          style={styles.columnHeaders}
        >
          <Text style={styles.columnLabel}>Rank / Student</Text>
          <Text style={styles.columnLabel}>Academic Points</Text>
        </Animated.View>

        {/* Rankings List */}
        {rankings.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={enterAnim(150 + index * 50)}
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

        {/* User Status Card with Glassmorphism */}
        {userStatus.rank && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(400).springify()}
            style={styles.userStatusCardContainer}
          >
            <BlurView
              intensity={80}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={styles.userStatusCardBlur}
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
            </BlurView>
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
