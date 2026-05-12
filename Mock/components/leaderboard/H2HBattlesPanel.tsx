import React, { memo, useCallback, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type {
  CustomH2HMatchItem,
  CustomH2HStanding,
} from "../../services/LeaderboardApiCalls";
import type { H2HTab } from "../play/types";

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

const H2HBattlesPanel: React.FC<Props> = ({
  matches,
  standings,
  initialTab = "matches",
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const [tab, setTab] = useState<H2HTab>(initialTab);

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
    standingName: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.text,
    },
    standingRank: {
      fontSize: rMS(12),
      fontWeight: "bold",
      color: themeColors.tint,
    },
    matchRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    matchResultDot: {
      width: rMS(8),
      height: rMS(8),
      borderRadius: 4,
      marginRight: rS(8),
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

      {tab === "matches" ? (
        matches.map((m) => (
          <View key={m.id} style={styles.standingCard}>
            <View style={styles.matchRowLeft}>
              <View
                style={[
                  styles.matchResultDot,
                  {
                    backgroundColor:
                      m.result === "w"
                        ? "#4CAF50"
                        : m.result === "l"
                        ? "#F44336"
                        : themeColors.tint,
                  },
                ]}
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
