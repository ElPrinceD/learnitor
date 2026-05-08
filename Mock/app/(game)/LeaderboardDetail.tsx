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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Settings, Trophy } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboardDetails, getKnockoutBracket, KnockoutRound } from "../../services/LeaderboardApiCalls";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants/index.js";
import ApiUrl from "../../config";
import ErrorMessage from "../../components/ErrorMessage";
import { BlurView } from "expo-blur";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);


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

  // We can derive loading/error from react-query
  const [activeTab, setActiveTab] = useState<"rankings" | "knockout">(type === "knockout" ? "knockout" : "rankings");

  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  // Animated tab indicator
  const tabIndicatorX = useSharedValue(type === "knockout" ? 1 : 0);
  const tabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  // One-time animation flag
  const hasAnimated = useRef(false);
  useEffect(() => { hasAnimated.current = true; }, []);
  const enterAnim = (delay: number) =>
    hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay);

  // React Query Hook
  const { data: leaderboardData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["leaderboardDetails", id, timeframe],
    queryFn: () => getLeaderboardDetails(id, userToken?.token, timeframe),
    enabled: !!userToken?.token,
  });

  const rankings = leaderboardData?.rankings || [];
  const squadInfo = leaderboardData?.squadInfo;
  const error = queryError ? "Failed to load rankings" : "";

  // Build dynamic knockout info text
  const knockoutInfoText = squadInfo?.knockoutStartWeek
    ? squadInfo.knockoutStarted
      ? `KNOCKOUT STARTED IN SW ${squadInfo.knockoutStartWeek}\nROUNDS CALCULATED BY SQUAD MEMBERS`
      : `KNOCKOUT STARTS IN SW ${squadInfo.knockoutStartWeek}\nROUNDS CALCULATED BY SQUAD MEMBERS`
    : "KNOCKOUT ROUNDS\nCALCULATED BY SQUAD MEMBERS";

  // Bracket matches from the knockout section of squadInfo
  // Build H2H match display from knockout bracket rounds
  const knockoutBracketRounds: KnockoutRound[] = [];

  const formatRank = (rank: number) => rank.toString().padStart(2, "0");
  const formatScore = (score: number) => score.toLocaleString() + " PTS";

  const getRankColor = (rank: number) => {
    if (rank === 1) return themeColors.tint;
    if (rank <= 3) return "#FFD700";
    return themeColors.textSecondary + "90";
  };

  const isMe = (username: string) =>
    username === userInfo?.user.first_name || username === "You";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Background blur shapes for glassmorphism
    blob1: {
      position: "absolute",
      top: -rV(100),
      right: -rS(50),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#10B98118",
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
    heroSection: {
      marginBottom: rV(28),
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
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1,
      lineHeight: rMS(38),
    },
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
    rankCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.cardGlass,
      padding: rMS(10),
      borderRadius: rMS(20),
      marginBottom: rV(6),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    myRankCard: {
      backgroundColor: themeColors.tint + "12",
      borderWidth: 1.5,
      borderColor: themeColors.tint + "40",
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
    },
    myRankName: {
      color: themeColors.tint,
      fontWeight: "900",
    },
    rankScore: {
      fontSize: rMS(12),
      fontWeight: "900",
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
      marginTop: rV(12),
      fontWeight: "700",
    },
    // Sub-tabs
    subTabRow: {
      flexDirection: "row",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(4),
      marginBottom: rV(20),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      position: "relative",
    },
    subTabIndicator: {
      position: "absolute",
      top: rMS(4),
      bottom: rMS(4),
      left: rMS(4),
      width: "50%",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
    },
    subTab: {
      flex: 1,
      paddingVertical: rV(10),
      borderRadius: rMS(22),
      alignItems: "center",
      zIndex: 1,
    },
    subTabText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.textSecondary,
    },
    subTabTextActive: {
      color: "#fff",
    },
    // H2H match row - Bracket Cards
    bracketContainer: {
      paddingTop: rV(10),
    },
    matchCardOuter: {
      marginBottom: rV(28),
    },
    matchCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
      backgroundColor: themeColors.cardGlass,
      padding: rMS(16),
      borderRadius: rMS(32),
      ...shadow.large,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    matchPlayerLeft: {
      flex: 1,
      alignItems: "flex-end",
    },
    matchPlayerRight: {
      flex: 1,
      alignItems: "flex-start",
    },
    matchPlayerText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
    },
    matchPlayerTeam: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(2),
      fontWeight: "600",
    },
    scoreBlock: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      paddingHorizontal: rMS(16),
      paddingVertical: rV(8),
      marginHorizontal: rS(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: rMS(80),
      ...shadow.light,
    },
    scoreText: {
      fontSize: rMS(18),
      fontWeight: "900",
      color: themeColors.text,
    },
    scoreDivider: {
      width: 1,
      height: rV(16),
      backgroundColor: themeColors.border,
      marginHorizontal: rS(10),
    },
    roundText: {
      textAlign: "center",
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    bracketInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(24),
    },
    bracketInfoLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
    },
    bracketInfoText: {
      marginHorizontal: rS(16),
      fontSize: rMS(10),
      color: themeColors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: rMS(16),
      letterSpacing: 0.5,
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

      {/* Frosted glass top bar with sticky back button + settings gear */}
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
          <ArrowLeft size={22} color={themeColors.text} />
        </AnimatedTouchable>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Settings gear — only for squad creators */}
        {(squadInfo?.isCreator) && (
          <TouchableOpacity
            style={[styles.backButton, { marginLeft: rS(8) }]}
            onPress={() => router.push({
              pathname: "/(game)/SquadSettings",
              params: { id, name },
            })}
            activeOpacity={0.7}
          >
            <Settings size={20} color={themeColors.text} />
          </TouchableOpacity>
        )}
      </BlurView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={enterAnim(50)}
          style={styles.heroSection}
        >
          <Text style={styles.heroLabel}>
            {timeframe === "season" ? "Current Season" : "All-Time"}
          </Text>
          <Text style={styles.heroTitle}>
            {(name || "Rankings").toUpperCase()}
          </Text>
        </Animated.View>

        {/* Sub-Tabs: Rankings | Knockout — animated indicator */}
        <Animated.View
          entering={enterAnim(100)}
          style={styles.subTabRow}
        >
          <Animated.View style={[styles.subTabIndicator, tabAnimStyle]} />
          {([{ key: "rankings", label: "Rankings" }, { key: "knockout", label: "Knockout" }] as const).map((tab, idx) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.subTab}
              onPress={() => {
                setActiveTab(tab.key as "rankings" | "knockout");
                tabIndicatorX.value = withTiming(
                  idx === 0 ? 0 : (Dimensions.get("window").width - rS(32) - rMS(8)) / 2,
                  { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) }
                );
              }}
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
              entering={enterAnim(150)}
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
                  entering={enterAnim(200 + index * 50)}
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
                        <Text style={{ color: "#4CAF50", fontSize: rMS(11), fontWeight: "900" }}>▲</Text>
                      )}
                      {item.movement === "down" && (
                        <Text style={{ color: "#F44336", fontSize: rMS(11), fontWeight: "900" }}>▼</Text>
                      )}
                      {item.movement === "same" && (
                        <Text style={{ color: themeColors.textSecondary, fontSize: rMS(11), fontWeight: "900" }}>—</Text>
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

        {activeTab === "knockout" && (
          <View style={styles.bracketContainer}>
            {knockoutBracketRounds.length > 0 ? (
              knockoutBracketRounds.map((round, rIdx) => (
                <Animated.View key={`round-${round.round}`} entering={enterAnim(200 + rIdx * 100)}>
                  <Text style={[styles.roundText, { marginBottom: rV(12), marginTop: rIdx > 0 ? rV(16) : 0 }]}>
                    ROUND {round.round}
                  </Text>
                  {round.matches.map((match, mIdx) => (
                    <View key={`match-${rIdx}-${mIdx}`} style={styles.matchCardOuter}>
                      <View style={styles.matchCard}>
                        {/* Left Player (p1) */}
                        <View style={styles.matchPlayerLeft}>
                          <Text style={[
                            styles.matchPlayerText,
                            isMe(match.player1) && { color: themeColors.tint },
                          ]} numberOfLines={1}>{match.player1}</Text>
                        </View>

                        {/* Score/Status Center Block */}
                        <View style={styles.scoreBlock}>
                          {match.score1 != null && match.score2 != null ? (
                            <>
                              <Text style={styles.scoreText}>{match.score1}</Text>
                              <View style={styles.scoreDivider} />
                              <Text style={styles.scoreText}>{match.score2}</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.scoreText}>—</Text>
                              <View style={styles.scoreDivider} />
                              <Text style={styles.scoreText}>—</Text>
                            </>
                          )}
                        </View>

                        {/* Right Player (p2) */}
                        <View style={styles.matchPlayerRight}>
                          <Text style={[
                            styles.matchPlayerText,
                            isMe(match.player2) && { color: themeColors.tint },
                          ]} numberOfLines={1}>{match.player2}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: rV(32) }}>
                <Trophy size={36} color={themeColors.textSecondary} strokeWidth={1.5} />
                <Text style={{ color: themeColors.textSecondary, fontSize: rMS(13), fontWeight: "600", marginTop: rV(10), textAlign: "center" }}>
                  No knockout matches yet
                </Text>
              </View>
            )}

            <View style={styles.bracketInfoRow}>
              <View style={styles.bracketInfoLine} />
              <Text style={styles.bracketInfoText}>
                {knockoutInfoText}
              </Text>
              <View style={styles.bracketInfoLine} />
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
