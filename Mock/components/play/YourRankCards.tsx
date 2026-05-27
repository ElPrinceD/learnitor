import React, { memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flag,
  Globe,
  Minus,
  School,
} from "lucide-react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type { RankingSummary } from "../../services/LeaderboardApiCalls";

type RankMovement = "up" | "down" | "same";

interface StandingItem {
  id: string;
  name: string;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  rank: string | null;
  color: string;
  movement?: RankMovement;
}

interface Props {
  rankings: RankingSummary;
  onOpenLeaderboard: (id: string, name: string) => void;
  enterAnim: (delay: number) => any;
}

const parseRankField = (field: any): { rank: string | null; movement: RankMovement } => {
  if (!field) {
    return { rank: null, movement: "same" };
  }
  if (typeof field === "object" && field !== null) {
    return {
      rank: field.rank ?? null,
      movement: (field.movement as RankMovement) ?? "same",
    };
  }
  return {
    rank: String(field),
    movement: "same",
  };
};

const YourRankCards: React.FC<Props> = ({
  rankings,
  onOpenLeaderboard,
  enterAnim,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const items: StandingItem[] = useMemo(() => {
    const worldParsed = parseRankField(rankings.world);
    const countryParsed = parseRankField(rankings.country);
    const schoolParsed = parseRankField(rankings.school);

    return [
      {
        id: "world",
        name: "World Rankings",
        IconComponent: Globe,
        rank: worldParsed.rank,
        movement: worldParsed.movement,
        color: themeColors.tint,
      },
      {
        id: "country",
        name: "Country Rankings",
        IconComponent: Flag,
        rank: countryParsed.rank,
        movement: countryParsed.movement,
        color: themeColors.tintSecond ?? themeColors.tint,
      },
      {
        id: "school",
        name: "School Rankings",
        IconComponent: School,
        rank: schoolParsed.rank,
        movement: schoolParsed.movement,
        color: "#8b3b8f",
      },
    ];
  }, [
    rankings.world,
    rankings.country,
    rankings.school,
    themeColors.tint,
    themeColors.tintSecond,
  ]);

  const renderRankIndicator = useCallback(
    (movement?: RankMovement) => {
      if (movement === "up") {
        return (
          <View style={styles.indicatorBox}>
            <ChevronUp size={12} color="#4CAF50" />
          </View>
        );
      }
      if (movement === "down") {
        return (
          <View style={styles.indicatorBox}>
            <ChevronDown size={12} color="#F44336" />
          </View>
        );
      }
      return (
        <View style={styles.indicatorBox}>
          <Minus size={12} color={themeColors.textSecondary} />
        </View>
      );
    },
    [themeColors.textSecondary]
  );

  return (
    <Animated.View entering={enterAnim(300)}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Your Rank
        </Text>
      </View>

      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={enterAnim(350 + index * 50)}
        >
          <TouchableOpacity
            style={[
              styles.standingCard,
              {
                backgroundColor: themeColors.cardGlass,
                borderColor: themeColors.border + "40",
              },
            ]}
            onPress={() => onOpenLeaderboard(item.id, item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.standingCardLeft}>
              <View
                style={[
                  styles.standingIconBox,
                  { backgroundColor: item.color },
                ]}
              >
                <item.IconComponent size={18} color="#fff" />
              </View>
              <Text style={[styles.standingName, { color: themeColors.text }]}>
                {item.name}
              </Text>
            </View>
            <View style={styles.standingCardRight}>
              {renderRankIndicator(item.movement)}
              {item.rank && (
                <Text
                  style={[styles.standingRank, { color: themeColors.tint }]}
                >
                  {item.rank}
                </Text>
              )}
              <ChevronRight size={16} color={themeColors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rV(14),
  },
  sectionTitle: {
    fontSize: rMS(16),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  standingCard: {
    padding: rMS(10),
    borderRadius: rMS(20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rV(6),
    borderWidth: 1,
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
  },
  standingCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: rS(6),
  },
  standingRank: {
    fontSize: rMS(12),
    fontWeight: "bold",
  },
  indicatorBox: {
    width: rMS(18),
    height: rMS(18),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(YourRankCards);
