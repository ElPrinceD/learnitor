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

    const memberCount = item.memberCount;
    const memberLabel =
      memberCount != null
        ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
        : null;
    const hasRank = item.userRank != null;

    return (
      <TouchableOpacity
        style={[
          styles.squadItem,
          {
            backgroundColor: themeColors.cardGlass,
            borderColor: themeColors.border + "40",
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.squadItemLeft}>
          <View
            style={[
              styles.squadIcon,
              { backgroundColor: themeColors.tint + "20" },
            ]}
          >
            <Users size={18} color={themeColors.tint} />
          </View>
          <View>
            <Text style={[styles.squadName, { color: themeColors.text }]}>
              {item.name}
            </Text>
            {memberLabel && (
              <Text
                style={[
                  styles.squadMembers,
                  { color: themeColors.textSecondary },
                ]}
              >
                {memberLabel}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.squadItemRight}>
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

  return (
    <Animated.View entering={enterAnim(200)} style={styles.squadSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Study Squads
        </Text>
        <View style={styles.sectionRightActions}>
         
          <TouchableOpacity
            style={[
              styles.squadAddBtn,
              {
                backgroundColor: themeColors.tint + "15",
                borderColor: themeColors.tint + "30",
              },
            ]}
            onPress={onAddSquad}
            activeOpacity={0.7}
          >
            <Plus size={20} color={themeColors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {showEmptyState ? (
        <View
          style={[
            styles.squadEmpty,
            {
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.border + "40",
            },
          ]}
        >
          <Users
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
            Join or create a study squad to compete with friends
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
    letterSpacing: -0.2,
  },
  sectionSeeAll: {
    fontSize: SIZES.small,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    // FlashList v2 inside a ScrollView with scrollEnabled=false; this
    // wrapper lets FlashList measure and recycle cells.
    minHeight: SQUAD_ROW_HEIGHT,
  },
  squadItem: {
    padding: rMS(12),
    borderRadius: rMS(24),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rV(6),
    borderWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  squadName: {
    fontSize: SIZES.small,
    fontWeight: "700",
  },
  squadMembers: {
    fontSize: SIZES.small,
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
  },
  rankPlaceholder: {
    fontSize: rMS(12),
    fontWeight: "bold",
  },
});

export default memo(StudySquadsSection);
