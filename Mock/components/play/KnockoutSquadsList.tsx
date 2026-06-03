import React, { memo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { ChevronRight, Minus, Trophy, Zap } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import type { CustomLeaderboard } from "../../services/LeaderboardApiCalls";

interface Props {
  squads: CustomLeaderboard[];
  onOpenSquad: (id: string, name: string, mode: string) => void;
  enterAnim: (delay: number) => any;
}

const CUP_CARD_HEIGHT = 88;

interface KnockoutCupCardProps {
  item: CustomLeaderboard;
  themeColors: any;
  onPress: (id: string, name: string, mode: string) => void;
}

const KnockoutCupCard: React.FC<KnockoutCupCardProps> = memo(
  ({ item, themeColors, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(item.id, item.name, "h2h");
    }, [onPress, item.id, item.name]);

    const memberCount = item.memberCount;
    const memberLabel =
      memberCount != null
        ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
        : null;
    const hasRank = item.userRank != null;

    return (
      <TouchableOpacity
        style={[
          styles.cupCard,
          {
            backgroundColor: themeColors.cardGlass,
            borderColor: themeColors.border + "40",
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cupCardLeft}>
          <View
            style={[
              styles.cupIcon,
              { backgroundColor: themeColors.tint + "15" },
            ]}
          >
            <Zap size={18} color={themeColors.tint} />
          </View>
          <View>
            <Text style={[styles.cupName, { color: themeColors.text }]}>
              {item.name}
            </Text>
            {memberLabel && (
              <Text
                style={[styles.cupWeek, { color: themeColors.textSecondary }]}
              >
                {memberLabel}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cupCardRight}>
          <View style={styles.indicatorBox}>
            <Minus size={12} color={themeColors.textSecondary} />
          </View>
          {hasRank ? (
            <Text style={[styles.rankNumber, { color: themeColors.tint }]}>
              #{item.userRank}
            </Text>
          ) : (
            <Text
              style={[
                styles.rankPlaceholder,
                { color: themeColors.textSecondary },
              ]}
            >
              —
            </Text>
          )}
          <ChevronRight size={18} color={themeColors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.memberCount === next.item.memberCount &&
    prev.item.userRank === next.item.userRank &&
    prev.onPress === next.onPress &&
    prev.themeColors === next.themeColors
);
KnockoutCupCard.displayName = "KnockoutCupCard";

const KnockoutSquadsList: React.FC<Props> = ({
  squads,
  onOpenSquad,
  enterAnim,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CustomLeaderboard>) => (
      <KnockoutCupCard
        item={item}
        themeColors={themeColors}
        onPress={onOpenSquad}
      />
    ),
    [themeColors, onOpenSquad]
  );

  const keyExtractor = useCallback(
    (item: CustomLeaderboard) => String(item.id),
    []
  );

  return (
    <Animated.View entering={enterAnim(200)}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Squad Knockouts
        </Text>
      </View>

      {squads.length === 0 ? (
        <View
          style={[
            styles.squadEmpty,
            {
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.border + "40",
            },
          ]}
        >
          <Trophy
            size={28}
            color={themeColors.textSecondary}
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.squadEmptyText,
              { color: themeColors.textSecondary },
            ]}
          >
            Create an H2H League squad to compete in knockouts!
          </Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <FlashList
            data={squads}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
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
  squadEmpty: {
    borderRadius: rMS(28),
    padding: rMS(16),
    alignItems: "center",
    borderWidth: 1,
  },
  squadEmptyText: {
    fontSize: SIZES.small,
    textAlign: "center",
    marginTop: rV(6),
    marginBottom: rV(12),
  },
  listWrapper: {
    minHeight: CUP_CARD_HEIGHT,
  },
  cupCard: {
    borderRadius: rMS(20),
    padding: rMS(12),
    marginBottom: rV(8),
    borderWidth: 1,
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
  },
  cupWeek: {
    fontSize: rMS(10),
    fontWeight: "600",
    marginTop: rV(2),
  },
  cupCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: rS(6),
  },
  indicatorBox: {
    width: rMS(18),
    height: rMS(18),
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: rMS(12),
    fontWeight: "bold",
  },
  rankPlaceholder: {
    fontSize: rMS(12),
    fontWeight: "bold",
  },
});

export default memo(KnockoutSquadsList);
