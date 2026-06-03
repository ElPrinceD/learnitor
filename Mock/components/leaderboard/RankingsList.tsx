import React, { memo, useCallback, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  RefreshControl,
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
  // When true, omit the inline ColumnHeaders from the list header. Used
  // when the parent renders its own sticky column headers above this list.
  hideColumnHeaders?: boolean;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  // ── Server-side pagination ─────────────────────────────────────────────
  // When provided, the list uses server-side pagination.
  // When omitted, falls back to client-side "See More" (slicing).
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
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
  hideColumnHeaders = false,
  ListEmptyComponent,
  ListFooterComponent,
  refreshing = false,
  onRefresh,
  hasMore: serverHasMore,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  // Client-side fallback: only used when the parent doesn't provide
  // server-side pagination props.
  const useServerPagination = onLoadMore != null;
  const [visibleCount, setVisibleCount] = useState(15);

  const visibleRankings = useMemo(() => {
    if (useServerPagination) return rankings;
    return rankings.slice(0, visibleCount);
  }, [rankings, visibleCount, useServerPagination]);

  const hasMore = useServerPagination
    ? (serverHasMore ?? false)
    : rankings.length > visibleCount;

  const handleSeeMore = useCallback(() => {
    if (useServerPagination && onLoadMore) {
      onLoadMore();
    } else {
      setVisibleCount((prev) => prev + 15);
    }
  }, [useServerPagination, onLoadMore]);

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
        {!hideColumnHeaders && (
          <ColumnHeaders
            themeColors={themeColors}
            showWeeklyExamColumn={showWeeklyExamColumn}
          />
        )}
      </>
    ),
    [heroSlot, hideColumnHeaders, themeColors, showWeeklyExamColumn]
  );

  const renderFooterContent = useCallback(() => {
    if (!ListFooterComponent) return null;
    if (React.isValidElement(ListFooterComponent)) {
      return ListFooterComponent;
    }
    const Component = ListFooterComponent as React.ComponentType<any>;
    return <Component />;
  }, [ListFooterComponent]);

  const renderFooter = useCallback(() => {
    if (!hasMore) {
      return renderFooterContent();
    }

    return (
      <View style={styles.footerContainer}>
        {isLoadingMore ? (
          <Text style={styles.seeMoreText}>Loading…</Text>
        ) : (
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={handleSeeMore}
            activeOpacity={0.7}
          >
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        )}
        {renderFooterContent()}
      </View>
    );
  }, [hasMore, isLoadingMore, renderFooterContent, handleSeeMore, themeColors]);

  // When `heroSlot` is provided the list is the only thing onscreen, so we
  // need topbar-clearing padding ourselves. When it's omitted (the parent
  // page now renders the hero + tabs as a static header above us), the
  // header already pushes us into position and we just need a small gap.
  const contentContainerStyle = useMemo(() => ({
    paddingHorizontal: rS(16),
    paddingTop: heroSlot ? Math.max(rV(80), insets.top + rV(50)) : 0,
    paddingBottom: Math.max(rV(40), insets.bottom + rV(40)),
  }), [heroSlot, insets.top, insets.bottom]);

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    footerContainer: {
      paddingVertical: rV(16),
      alignItems: "center",
      justifyContent: "center",
    },
    seeMoreButton: {
      backgroundColor: themeColors.tint + "12",
      borderColor: themeColors.tint + "30",
      borderWidth: 1,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rS(24),
      alignItems: "center",
      justifyContent: "center",
    },
    seeMoreText: {
      color: themeColors.tint,
      fontSize: rMS(13),
      fontWeight: "800",
    },
  }), [themeColors.tint]);

  return (
    // FlashList needs a bounded parent height to render. Wrap it in a
    // flex:1 view so it fills the remaining viewport below the fixed
    // header in LeaderboardDetail.
    <View style={styles.flex}>
      <FlashList
        data={visibleRankings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.tint}
              colors={[themeColors.tint, themeColors.text]}
              progressBackgroundColor={themeColors.background}
            />
          ) : undefined
        }
      />
    </View>
  );
};

export default memo(RankingsList);
