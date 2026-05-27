import React, { memo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import type { RankingItem } from "../../services/LeaderboardApiCalls";

import RankingRow from "./RankingRow";

// Stable row height — matches the rendered `rankCard` (padding rMS(10) +
// avatar rMS(32) + marginBottom rV(6)). Locking it lets FlashList skip
// expensive per-item measurement at scroll-time.
const ESTIMATED_ROW_HEIGHT = 78;

interface Props {
  rankings: RankingItem[];
  isMe: (id: number, username: string) => boolean;
  showWeeklyExamColumn: boolean;
  // Rendered above the column headers as the FlashList's list header so it
  // scrolls with the list (true virtualization, no nested-scroll trap).
  heroSlot?: React.ReactNode;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const ColumnHeaders: React.FC<{
  themeColors: any;
  showWeeklyExamColumn: boolean;
}> = ({ themeColors, showWeeklyExamColumn }) => {
  const styles = StyleSheet.create({
    columnHeaders: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: rMS(10),
      marginBottom: rV(12),
    },
    columnLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
    },
    columnLabelStudent: { flex: 1, textAlign: "left" },
    columnLabelSW: { width: rS(48), textAlign: "center" },
    columnLabelPoints: { width: rS(72), textAlign: "right" },
  });

  return (
    <View style={styles.columnHeaders}>
      <Text style={[styles.columnLabel, styles.columnLabelStudent]}>
        Rank / Student
      </Text>
      {showWeeklyExamColumn && (
        <Text style={[styles.columnLabel, styles.columnLabelSW]}>SW</Text>
      )}
      <Text style={[styles.columnLabel, styles.columnLabelPoints]}>
        Points
      </Text>
    </View>
  );
};

const RankingsList: React.FC<Props> = ({
  rankings,
  isMe,
  showWeeklyExamColumn,
  heroSlot,
  ListEmptyComponent,
  ListFooterComponent,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RankingItem>) => (
      <RankingRow
        item={item}
        isMe={isMe(item.id, item.username)}
        showWeeklyExamColumn={showWeeklyExamColumn}
      />
    ),
    [isMe, showWeeklyExamColumn]
  );

  const keyExtractor = useCallback(
    (item: RankingItem) => String(item.id),
    []
  );

  // The hero ships in from the consumer; we pin the column headers right
  // beneath it so they stay above row 1 but still scroll out of view as
  // the user paginates through hundreds of rows.
  const renderListHeader = useCallback(
    () => (
      <>
        {heroSlot}
        <ColumnHeaders
          themeColors={themeColors}
          showWeeklyExamColumn={showWeeklyExamColumn}
        />
      </>
    ),
    [heroSlot, themeColors, showWeeklyExamColumn]
  );

  // When `heroSlot` is provided the list is the only thing onscreen, so we
  // need topbar-clearing padding ourselves. When it's omitted (the parent
  // page now renders the hero + tabs as a static header above us), the
  // header already pushes us into position and we just need a small gap.
  const contentContainerStyle = {
    paddingHorizontal: rS(16),
    paddingTop: heroSlot ? Math.max(rV(80), insets.top + rV(50)) : 0,
    paddingBottom: Math.max(rV(40), insets.bottom + rV(40)),
  };

  return (
    // FlashList needs a bounded parent height to render. Wrap it in a
    // flex:1 view so it fills the remaining viewport below the fixed
    // header in LeaderboardDetail.
    <View style={styles.flex}>
      <FlashList
        data={rankings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default memo(RankingsList);
