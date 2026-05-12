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
import { ChevronRight, Minus, Plus, Users } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import type { CustomLeaderboard } from "../../services/LeaderboardApiCalls";

interface Props {
  squads: CustomLeaderboard[];
  totalCustomCount: number;
  onOpenSquad: (id: string, name: string) => void;
  onOpenAllSquads: () => void;
  onAddSquad: () => void;
  enterAnim: (delay: number) => any;
}

const SQUAD_ROW_HEIGHT = 72;

interface SquadRowProps {
  item: CustomLeaderboard;
  themeColors: any;
  onPress: (id: string, name: string) => void;
}

const SquadRow: React.FC<SquadRowProps> = memo(
  ({ item, themeColors, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(item.id, item.name);
    }, [onPress, item.id, item.name]);

    const styles = StyleSheet.create({
      squadItem: {
        backgroundColor: themeColors.cardGlass,
        padding: rMS(12),
        borderRadius: rMS(24),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: rV(6),
        borderWidth: 1,
        borderColor: themeColors.border + "40",
      },
      squadItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: rS(12),
      },
      squadIcon: {
        width: rMS(32),
        height: rMS(32),
        borderRadius: rMS(16),
        backgroundColor: themeColors.tint + "20",
        alignItems: "center",
        justifyContent: "center",
      },
      squadName: {
        fontSize: SIZES.small,
        fontWeight: "700",
        color: themeColors.text,
      },
      squadMembers: {
        fontSize: SIZES.small,
        color: themeColors.textSecondary,
      },
      squadItemRight: {
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
        color: themeColors.tint,
      },
      rankPlaceholder: {
        fontSize: rMS(12),
        fontWeight: "bold",
        color: themeColors.textSecondary,
      },
    });

    const memberCount = item.memberCount;
    const memberLabel =
      memberCount != null
        ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
        : null;
    const hasRank = item.userRank != null;

    return (
      <TouchableOpacity
        style={styles.squadItem}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.squadItemLeft}>
          <View style={styles.squadIcon}>
            <Users size={18} color={themeColors.tint} />
          </View>
          <View>
            <Text style={styles.squadName}>{item.name}</Text>
            {memberLabel && (
              <Text style={styles.squadMembers}>{memberLabel}</Text>
            )}
          </View>
        </View>
        <View style={styles.squadItemRight}>
          <View style={styles.indicatorBox}>
            <Minus size={12} color={themeColors.textSecondary} />
          </View>
          {hasRank ? (
            <Text style={styles.rankNumber}>#{item.userRank}</Text>
          ) : (
            <Text style={styles.rankPlaceholder}>—</Text>
          )}
          <ChevronRight size={16} color={themeColors.textSecondary} />
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
SquadRow.displayName = "SquadRow";

const StudySquadsSection: React.FC<Props> = ({
  squads,
  totalCustomCount,
  onOpenSquad,
  onOpenAllSquads,
  onAddSquad,
  enterAnim,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const showEmptyState = totalCustomCount === 0;
  const showSeeAll = totalCustomCount > 0;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CustomLeaderboard>) => (
      <SquadRow
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

  const styles = StyleSheet.create({
    squadSection: {
      marginBottom: rV(28),
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
    sectionSeeAll: {
      fontSize: SIZES.small,
      color: themeColors.tint,
      fontWeight: "700",
    },
    sectionRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
    },
    squadAddBtn: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    squadEmpty: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(16),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    squadEmptyText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      textAlign: "center",
      marginTop: rV(6),
      marginBottom: rV(12),
    },
    listWrapper: {
      // FlashList v2 inside a ScrollView with scrollEnabled=false; this
      // wrapper lets FlashList measure and recycle cells.
      minHeight: SQUAD_ROW_HEIGHT,
    },
  });

  return (
    <Animated.View entering={enterAnim(200)} style={styles.squadSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Study Squads</Text>
        <View style={styles.sectionRightActions}>
          {showSeeAll && (
            <TouchableOpacity onPress={onOpenAllSquads}>
              <Text style={styles.sectionSeeAll}>See All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.squadAddBtn}
            onPress={onAddSquad}
            activeOpacity={0.7}
          >
            <Plus size={20} color={themeColors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {showEmptyState ? (
        <View style={styles.squadEmpty}>
          <Users
            size={28}
            color={themeColors.textSecondary}
            strokeWidth={1.5}
          />
          <Text style={styles.squadEmptyText}>
            Join or create a study squad to compete with friends
          </Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <FlashList
            data={squads}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={SQUAD_ROW_HEIGHT}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </Animated.View>
  );
};

export default memo(StudySquadsSection);
