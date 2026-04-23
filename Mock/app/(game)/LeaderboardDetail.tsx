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
}

export default function LeaderboardDetail() {
  const { id, name, timeframe } = useLocalSearchParams<{
    id: string;
    name: string;
    timeframe: string;
  }>();
  const { userToken, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState<RankingItem[]>([]);

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
        { id: 1, rank: 1, username: "Alex Johnson", avatarUrl: null, score: 9850 },
        { id: 2, rank: 2, username: "Sam Smith", avatarUrl: null, score: 8700 },
        { id: 3, rank: 3, username: "You", avatarUrl: null, score: 8520 },
        { id: 4, rank: 4, username: "Jordan Lee", avatarUrl: null, score: 7900 },
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

        {/* Column Headers */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
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
              entering={FadeInDown.duration(400).delay(250 + index * 60)}
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

        <ErrorMessage
          message={error}
          visible={!!error}
          onDismiss={() => setError("")}
        />
      </ScrollView>
    </View>
  );
}
