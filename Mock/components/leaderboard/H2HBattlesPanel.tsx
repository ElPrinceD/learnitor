import React, { memo, useCallback, useState, useMemo, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ScrollView,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Swords } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";
import type {
  CustomH2HMatchItem,
  CustomH2HStanding,
} from "../../services/LeaderboardApiCalls";
import type { H2HTab } from "../play/types";
import { useAuth } from "../../store/authStore";
import { getWeeklyExamStatus } from "../../services/WeeklyExamApiCalls";

// Translation distance for the sliding pill. Same math as LeaderboardTabs,
// but the H2H toggle uses padding rMS(3) (rMS(6) combined) where the outer
// tabs use rMS(4) — so the inner content width is slightly different.
// Page horizontal padding (rS(16) each side) = rS(32).
const PILL_TRANSLATE_X =
  (Dimensions.get("window").width - rS(32) - rMS(6)) / 2;

interface Props {
  matches: CustomH2HMatchItem[];
  standings: CustomH2HStanding[];
  // Initial sub-tab. Defaults to "matches". Kept as a prop so deep links can
  // open the panel directly on Standings if needed.
  initialTab?: H2HTab;
}

// Colour for the result indicator chip.
const resultColor = (result: string) => {
  switch (result) {
    case "w":
      return "#4CAF50";
    case "l":
      return "#F44336";
    case "d":
      return "#FF9800";
    default:
      return undefined; // pending — uses tint
  }
};

const resultLabel = (result: string) => {
  switch (result) {
    case "w":
      return "WIN";
    case "l":
      return "LOSS";
    case "d":
      return "DRAW";
    default:
      return "PENDING";
  }
};

const H2HBattlesPanel: React.FC<Props> = ({
  matches,
  standings,
  initialTab = "matches",
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const { userInfo, userToken } = useAuth();

  const { data: examStatus } = useQuery({
    queryKey: ["weeklyExamStatus"],
    queryFn: () => getWeeklyExamStatus(userToken?.token),
    enabled: !!userToken?.token,
  });

  const [tab, setTab] = useState<H2HTab>(initialTab);

  const uniqueWeeks = useMemo(() => {
    const weeks = new Set<number>();
    matches.forEach((m) => {
      if (m.round != null) {
        weeks.add(m.round);
      }
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [matches]);

  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");

  useEffect(() => {
    if (uniqueWeeks.length > 0) {
      const currentWeekNum = examStatus?.currentWeek;
      if (currentWeekNum != null && uniqueWeeks.includes(currentWeekNum)) {
        setSelectedWeek(currentWeekNum);
      } else {
        setSelectedWeek(uniqueWeeks[uniqueWeeks.length - 1]);
      }
    } else {
      setSelectedWeek("all");
    }
  }, [uniqueWeeks, examStatus?.currentWeek]);

  const filteredMatches = useMemo(() => {
    if (selectedWeek === "all") return matches;
    return matches.filter((m) => m.round === selectedWeek);
  }, [matches, selectedWeek]);

  // Sliding pill indicator: 0 = Matches (left), PILL_TRANSLATE_X = Standings
  // (right). Driven via Reanimated so the slide runs on the UI thread.
  const pillX = useSharedValue(initialTab === "standings" ? PILL_TRANSLATE_X : 0);
  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const handleMatchesPress = useCallback(() => {
    setTab("matches");
    pillX.value = withTiming(0, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [pillX]);
  const handleStandingsPress = useCallback(() => {
    setTab("standings");
    pillX.value = withTiming(PILL_TRANSLATE_X, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [pillX]);

  const styles = StyleSheet.create({
    sectionWrapper: {
      marginBottom: rV(22),
    },
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
    togglePill: {
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

    // ── Match card styles ──────────────────────────────────────────────────
    matchCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      marginBottom: rV(10),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      overflow: "hidden",
      ...shadow.light,
    },
    myMatchCard: {
      backgroundColor: themeColors.tint + "1c",
      borderColor: themeColors.tint + "60",
      borderWidth: 1.5,
    },
  
    matchCardInner: {
      paddingVertical: rV(16),
      paddingHorizontal: rMS(16),
    },
    matchTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    player1Block: {
      flex: 1,
      alignItems: "flex-end",
      marginRight: rS(10),
    },
    player2Block: {
      flex: 1,
      alignItems: "flex-start",
      marginLeft: rS(10),
    },
    playerNameText: {
      fontSize: rMS(13),
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    playerUserText: {
      fontSize: rMS(10.5),
      fontWeight: "500",
      marginTop: rV(2),
    },
    matchScoreBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.background,
      borderColor: themeColors.border + "30",
      borderWidth: 1,
      borderRadius: rMS(8),
      paddingHorizontal: rMS(12),
      paddingVertical: rV(6),
      minWidth: rS(68),
    },
    matchScoreVal: {
      fontSize: rMS(16),
      fontWeight: "900",
      color: themeColors.text,
    },
    matchScoreBoxDivider: {
      width: 1,
      height: rV(14),
      backgroundColor: themeColors.border,
      marginHorizontal: rS(8),
    },
    gameweekText: {
      fontSize: rMS(10.5),
      fontWeight: "500",
      textAlign: "center",
      marginTop: rV(12),
      letterSpacing: 0.5,
    },

    // ── Week selector styles ────────────────────────────────────────────────
    weekSelectorContainer: {
      flexDirection: "row",
      paddingBottom: rV(14),
      paddingHorizontal: rS(2),
      gap: rS(8),
    },
    weekTab: {
      paddingHorizontal: rMS(14),
      paddingVertical: rV(8),
      borderRadius: rMS(16),
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      alignItems: "center",
      justifyContent: "center",
    },
    weekTabActive: {
      backgroundColor: themeColors.tint,
      borderColor: themeColors.tint,
    },
    weekTabText: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: themeColors.textSecondary,
    },
    weekTabTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },

    // ── Empty state ────────────────────────────────────────────────────────
    emptyWrap: {
      alignItems: "center",
      paddingVertical: rV(32),
    },
    emptyText: {
      color: themeColors.textSecondary,
      fontSize: rMS(13),
      fontWeight: "600",
      marginTop: rV(10),
      textAlign: "center",
    },

    // ── Standings styles (unchanged) ───────────────────────────────────────
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
    standingsHeaderRow: {
      backgroundColor: "transparent",
      paddingVertical: rV(4),
    },
    standingsHeaderText: {
      fontSize: rMS(9),
      color: themeColors.textSecondary,
      fontWeight: "700",
      letterSpacing: 1,
    },
    standingsUserRow: {
      borderWidth: 1.5,
      borderColor: themeColors.tint + "40",
      backgroundColor: themeColors.tint + "08",
    },
    standingsRankCell: {
      flex: 1,
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.tint,
    },
    standingsNameWrap: {
      flex: 3,
      flexDirection: "row",
      alignItems: "center",
    },
    standingsNameText: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
    },
    coinBadge: {
      backgroundColor: "#FF9800" + "20",
      paddingHorizontal: rMS(6),
      paddingVertical: rV(1),
      borderRadius: 4,
      marginLeft: rS(6),
    },
    coinBadgeText: {
      color: "#FF9800",
      fontSize: rMS(8),
      fontWeight: "800",
    },
    statCellPts: {
      flex: 1,
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
      textAlign: "center",
    },
    statCellWin: {
      flex: 1,
      fontSize: rMS(12),
      color: "#4CAF50",
      textAlign: "center",
      fontWeight: "700",
    },
    statCellDraw: {
      flex: 1,
      fontSize: rMS(12),
      color: themeColors.tint,
      textAlign: "center",
      fontWeight: "700",
    },
    statCellLoss: {
      flex: 1,
      fontSize: rMS(12),
      color: "#F44336",
      textAlign: "center",
      fontWeight: "700",
    },
  });

  // ── Match card renderer ────────────────────────────────────────────────
  const renderMatchCard = (m: CustomH2HMatchItem, idx: number) => {
    const score1Display = m.score1 != null ? String(m.score1) : "—";
    const score2Display = m.score2 != null ? String(m.score2) : "—";

    const p1Parts = m.player1.split("\n");
    const p1Name = p1Parts[0];
    const p1User = p1Parts[1] || "";

    const p2Parts = m.player2.split("\n");
    const p2Name = p2Parts[0];
    const p2User = p2Parts[1] || "";

    const checkIsMe = (parts: string[]) => {
      const myUsername = userInfo?.user.username?.toLowerCase();
      const myFirstName = userInfo?.user.first_name?.toLowerCase();
      const myLastName = userInfo?.user.last_name?.toLowerCase();
      const myFullName = myFirstName && myLastName ? `${myFirstName} ${myLastName}` : null;

      return parts.some(part => {
        const p = part.toLowerCase().trim();
        if (p === "you") return true;
        if (myUsername && p === myUsername) return true;
        if (myFirstName && p === myFirstName) return true;
        if (myFullName && p === myFullName) return true;
        return false;
      });
    };

    const isPlayer1Me = checkIsMe(p1Parts);
    const isPlayer2Me = checkIsMe(p2Parts);
    const isMeInMatch = isPlayer1Me || isPlayer2Me;

    const p1NameColor = isPlayer1Me ? themeColors.tint : themeColors.text;
    const p2NameColor = isPlayer2Me ? themeColors.tint : themeColors.text;

    const cardContent = (
      <View style={styles.matchCardInner}>
        {isMeInMatch}
        <View style={styles.matchTopRow}>
          {/* Player 1 (Left Block, Right Aligned) */}
          <View style={styles.player1Block}>
            <Text
              style={[styles.playerNameText, { color: p1NameColor, textAlign: "right" }]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {p1User ? (
              <Text
                style={[styles.playerUserText, { color: themeColors.textSecondary, textAlign: "right" }]}
                numberOfLines={1}
              >
                {p1User}
              </Text>
            ) : null}
          </View>

          {/* Score Box */}
          <View style={styles.matchScoreBox}>
            <Text style={styles.matchScoreVal}>{score1Display}</Text>
            <View style={styles.matchScoreBoxDivider} />
            <Text style={styles.matchScoreVal}>{score2Display}</Text>
          </View>

          {/* Player 2 (Right Block, Left Aligned) */}
          <View style={styles.player2Block}>
            <Text
              style={[styles.playerNameText, { color: p2NameColor, textAlign: "left" }]}
              numberOfLines={1}
            >
              {p2Name}
            </Text>
            {p2User ? (
              <Text
                style={[styles.playerUserText, { color: themeColors.textSecondary, textAlign: "left" }]}
                numberOfLines={1}
              >
                {p2User}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Study Week / Round */}
        <Text style={[styles.gameweekText, { color: themeColors.textSecondary }]}>
          Study Week {m.round || 1}
        </Text>
      </View>
    );

    return (
      <Animated.View
        key={m.id}
        entering={FadeInDown.duration(250).delay(50 + idx * 40)}
      >
        <View style={[styles.matchCard, isMeInMatch && styles.myMatchCard]}>{cardContent}</View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>1v1 Battles</Text>
      </View>

      <View style={styles.toggleContainer}>
        <Animated.View style={[styles.togglePill, pillAnimStyle]} />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleMatchesPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleText,
              tab === "matches" && styles.toggleTextActive,
            ]}
          >
            Matches
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleStandingsPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleText,
              tab === "standings" && styles.toggleTextActive,
            ]}
          >
            Standings
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "matches" && uniqueWeeks.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekSelectorContainer}
        >
          <TouchableOpacity
            style={[
              styles.weekTab,
              selectedWeek === "all" && styles.weekTabActive,
            ]}
            onPress={() => setSelectedWeek("all")}
          >
            <Text
              style={[
                styles.weekTabText,
                selectedWeek === "all" && styles.weekTabTextActive,
              ]}
            >
              All Weeks
            </Text>
          </TouchableOpacity>

          {uniqueWeeks.map((week) => (
            <TouchableOpacity
              key={week}
              style={[
                styles.weekTab,
                selectedWeek === week && styles.weekTabActive,
              ]}
              onPress={() => setSelectedWeek(week)}
            >
              <Text
                style={[
                  styles.weekTabText,
                  selectedWeek === week && styles.weekTabTextActive,
                ]}
              >
                Week {week}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {tab === "matches" ? (
        filteredMatches.length > 0 ? (
          filteredMatches.map((m, idx) => renderMatchCard(m, idx))
        ) : (
          <View style={styles.emptyWrap}>
            <Swords
              size={36}
              color={themeColors.textSecondary}
              strokeWidth={1.5}
            />
            <Text style={styles.emptyText}>No matches for this week</Text>
          </View>
        )
      ) : (
        <>
          <View style={[styles.standingCard, styles.standingsHeaderRow]}>
            <Text style={[styles.standingsHeaderText, { flex: 1 }]}>#</Text>
            <Text style={[styles.standingsHeaderText, { flex: 3 }]}>
              PLAYER
            </Text>
            <Text
              style={[
                styles.standingsHeaderText,
                { flex: 1, textAlign: "center" },
              ]}
            >
              PTS
            </Text>
            <Text
              style={[
                styles.standingsHeaderText,
                { flex: 1, textAlign: "center" },
              ]}
            >
              W
            </Text>
            <Text
              style={[
                styles.standingsHeaderText,
                { flex: 1, textAlign: "center" },
              ]}
            >
              D
            </Text>
            <Text
              style={[
                styles.standingsHeaderText,
                { flex: 1, textAlign: "center" },
              ]}
            >
              L
            </Text>
          </View>
          {standings.map((s) => {
            const isUser = (s as any).isUser as boolean | undefined;
            return (
              <View
                key={s.rank}
                style={[
                  styles.standingCard,
                  isUser && styles.standingsUserRow,
                ]}
              >
                <Text style={styles.standingsRankCell}>{s.rank}</Text>
                <View style={styles.standingsNameWrap}>
                  <Text style={styles.standingsNameText}>{s.name}</Text>
                  {s.tiebreaker && (
                    <View style={styles.coinBadge}>
                      <Text style={styles.coinBadgeText}>🪙 COIN</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statCellPts}>{s.pts}</Text>
                <Text style={styles.statCellWin}>{s.w}</Text>
                <Text style={styles.statCellDraw}>{s.d}</Text>
                <Text style={styles.statCellLoss}>{s.l}</Text>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

export default memo(H2HBattlesPanel);
