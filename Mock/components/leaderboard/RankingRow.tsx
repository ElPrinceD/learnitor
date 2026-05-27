import React, { memo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { ChevronUp, ChevronDown, Minus } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";
import type { RankingItem } from "../../services/LeaderboardApiCalls";

interface Props {
  item: RankingItem;
  isMe: boolean;
  showWeeklyExamColumn: boolean;
}

const formatRank = (rank: number) => rank.toString().padStart(2, "0");
const formatScore = (score: number) => `${score.toLocaleString()} PTS`;

// Per Mock/BACKEND_RANKING_UPDATES.md Section 3:
//   null      -> current week's exam has not yet started, render em-dash
//   undefined -> not provided yet (show em-dash when SW column is shown)
//   0         -> user did not participate this week, render "0"
//   number    -> render the score (no "PTS" suffix — column header is "SW")
const formatWeeklyExamSW = (sw: number | null | undefined): string => {
  if (sw === undefined || sw === null) return "—";
  return sw.toLocaleString();
};

const RankingRow: React.FC<Props> = ({ item, isMe, showWeeklyExamColumn }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const rankColor =
    item.rank === 1
      ? themeColors.tint
      : item.rank <= 3
      ? "#FFD700"
      : themeColors.textSecondary + "90";

  const styles = StyleSheet.create({
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
      width: rS(72),
      textAlign: "right",
    },
    rankSW: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.textSecondary,
      width: rS(48),
      textAlign: "center",
    },
    indicatorBox: {
      width: rMS(14),
      height: rMS(14),
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View style={[styles.rankCard, isMe && styles.myRankCard]}>
      <View style={styles.rankCardLeft}>
        <Text style={[styles.rankNumber, { color: rankColor }]}>
          {formatRank(item.rank)}
        </Text>
        {item.movement === "up" && (
          <View style={styles.indicatorBox}>
            <ChevronUp size={12} color="#4CAF50" />
          </View>
        )}
        {item.movement === "down" && (
          <View style={styles.indicatorBox}>
            <ChevronDown size={12} color="#F44336" />
          </View>
        )}
        {item.movement === "same" && (
          <View style={styles.indicatorBox}>
            <Minus size={12} color={themeColors.textSecondary} />
          </View>
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
            style={[styles.rankName, isMe && styles.myRankName]}
            numberOfLines={1}
          >
            {item.username}
          </Text>
        </View>
      </View>
      {showWeeklyExamColumn && (
        <Text style={styles.rankSW}>
          {formatWeeklyExamSW(item.weeklyExamScore)}
        </Text>
      )}
      <Text style={styles.rankScore}>{formatScore(item.score)}</Text>
    </View>
  );
};

export default memo(
  RankingRow,
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.rank === next.item.rank &&
    prev.item.score === next.item.score &&
    prev.item.weeklyExamScore === next.item.weeklyExamScore &&
    prev.item.username === next.item.username &&
    prev.item.avatarUrl === next.item.avatarUrl &&
    prev.item.movement === next.item.movement &&
    prev.isMe === next.isMe &&
    prev.showWeeklyExamColumn === next.showWeeklyExamColumn
);
