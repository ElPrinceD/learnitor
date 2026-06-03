import React, { memo, useCallback, useMemo } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Trophy } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants/index.js";
import type {
  KnockoutRound,
  SquadInfo,
} from "../../services/LeaderboardApiCalls";

// ── Types ──────────────────────────────────────────────────────────────────
// We flatten rounds + a trailing info row into a single list so FlashList
// can virtualise the whole bracket.
type BracketItem =
  | { type: "round_header"; roundNumber: number; roundIndex: number }
  | { type: "match"; match: KnockoutRound["matches"][0]; roundIndex: number; matchIndex: number }
  | { type: "info"; text: string }
  | { type: "empty" };

// ── Helpers ────────────────────────────────────────────────────────────────
const buildKnockoutInfoText = (squadInfo?: SquadInfo): string => {
  if (!squadInfo?.knockoutStartWeek) {
    return "KNOCKOUT ROUNDS\nCALCULATED BY SQUAD MEMBERS";
  }
  return squadInfo.knockoutStarted
    ? `KNOCKOUT STARTED IN SW ${squadInfo.knockoutStartWeek}`
    : `KNOCKOUT STARTS IN SW ${squadInfo.knockoutStartWeek}`;
};

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  rounds: KnockoutRound[];
  squadInfo?: SquadInfo;
  isMe: (username: string) => boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

// ── Estimated item sizes for FlashList ─────────────────────────────────────
// A single match card is ~85-90px. A header is ~40px. An average of 80 is optimal.
const ESTIMATED_ITEM_SIZE = 80;

// ── Sub-components ─────────────────────────────────────────────────────────

const MatchCard = memo(
  ({
    match,
    rIdx,
    mIdx,
    isMe,
    themeColors,
    shadow,
  }: {
    match: KnockoutRound["matches"][0];
    rIdx: number;
    mIdx: number;
    isMe: (username: string) => boolean;
    themeColors: any;
    shadow: any;
  }) => {
    const score1Display =
      match.score1 != null ? String(match.score1) : "—";
    const score2Display =
      match.score2 != null ? String(match.score2) : "—";

    const p1Parts = match.player1.split("\n");
    const p1Name = p1Parts[0];
    const p1User = p1Parts[1] || "";

    const p2Parts = match.player2.split("\n");
    const p2Name = p2Parts[0];
    const p2User = p2Parts[1] || "";

    const checkIsMe = (parts: string[]) => parts.some((part) => isMe(part));
    const isPlayer1Me = checkIsMe(p1Parts);
    const isPlayer2Me = checkIsMe(p2Parts);
    const isMeInMatch = isPlayer1Me || isPlayer2Me;

    const p1NameColor = isPlayer1Me ? themeColors.tint : themeColors.text;
    const p2NameColor = isPlayer2Me ? themeColors.tint : themeColors.text;

    return (
      <View style={matchStyles.matchCardOuter}>
        <View
          style={[
            matchStyles.matchCard,
            { backgroundColor: themeColors.cardGlass, borderColor: themeColors.border + "40", ...shadow.light },
            isMeInMatch && {
              backgroundColor: themeColors.tint + "1c",
              borderColor: themeColors.tint + "60",
              borderWidth: 1.5,
            },
          ]}
        >
          <View style={matchStyles.matchCardInner}>
            {isMeInMatch && (
              <View
                style={[
                  matchStyles.myMatchHighlightBar,
                  { backgroundColor: themeColors.tint },
                ]}
              />
            )}
            <View style={matchStyles.matchTopRow}>
              {/* Player 1 */}
              <View style={matchStyles.player1Block}>
                <Text
                  style={[
                    matchStyles.playerNameText,
                    { color: p1NameColor, textAlign: "right" },
                  ]}
                  numberOfLines={1}
                >
                  {p1Name}
                </Text>
                {p1User ? (
                  <Text
                    style={[
                      matchStyles.playerUserText,
                      { color: themeColors.textSecondary, textAlign: "right" },
                    ]}
                    numberOfLines={1}
                  >
                    {p1User}
                  </Text>
                ) : null}
              </View>

              {/* Score Box */}
              <View
                style={[
                  matchStyles.matchScoreBox,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border + "30",
                  },
                ]}
              >
                <Text style={[matchStyles.matchScoreVal, { color: themeColors.text }]}>
                  {score1Display}
                </Text>
                <View
                  style={[
                    matchStyles.matchScoreBoxDivider,
                    { backgroundColor: themeColors.border },
                  ]}
                />
                <Text style={[matchStyles.matchScoreVal, { color: themeColors.text }]}>
                  {score2Display}
                </Text>
              </View>

              {/* Player 2 */}
              <View style={matchStyles.player2Block}>
                <Text
                  style={[
                    matchStyles.playerNameText,
                    { color: p2NameColor, textAlign: "left" },
                  ]}
                  numberOfLines={1}
                >
                  {p2Name}
                </Text>
                {p2User ? (
                  <Text
                    style={[
                      matchStyles.playerUserText,
                      { color: themeColors.textSecondary, textAlign: "left" },
                    ]}
                    numberOfLines={1}
                  >
                    {p2User}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

// ── Main component ─────────────────────────────────────────────────────────
const KnockoutBracketList: React.FC<Props> = ({
  rounds,
  squadInfo,
  isMe,
  refreshing = false,
  onRefresh,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const knockoutInfoText = buildKnockoutInfoText(squadInfo);

  // Flatten into a single list for FlashList so each match card and header is recycled separately.
  const listData: BracketItem[] = useMemo(() => {
    if (rounds.length === 0) {
      return [{ type: "empty" }, { type: "info", text: knockoutInfoText }];
    }
    const items: BracketItem[] = [];
    rounds.forEach((round, roundIndex) => {
      items.push({
        type: "round_header" as const,
        roundNumber: round.round,
        roundIndex,
      });
      round.matches.forEach((match, matchIndex) => {
        items.push({
          type: "match" as const,
          match,
          roundIndex,
          matchIndex,
        });
      });
    });
    items.push({ type: "info", text: knockoutInfoText });
    return items;
  }, [rounds, knockoutInfoText]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BracketItem>) => {
      if (item.type === "empty") {
        return (
          <View style={listStyles.emptyWrap}>
            <Trophy
              size={36}
              color={themeColors.textSecondary}
              strokeWidth={1.5}
            />
            <Text style={[listStyles.emptyText, { color: themeColors.textSecondary }]}>
              No knockout matches yet
            </Text>
          </View>
        );
      }

      if (item.type === "info") {
        return (
          <View style={listStyles.bracketInfoRow}>
            <View style={[listStyles.bracketInfoLine, { backgroundColor: themeColors.border }]} />
            <Text style={[listStyles.bracketInfoText, { color: themeColors.textSecondary }]}>
              {item.text}
            </Text>
            <View style={[listStyles.bracketInfoLine, { backgroundColor: themeColors.border }]} />
          </View>
        );
      }

      if (item.type === "round_header") {
        return (
          <Text
            style={[
              listStyles.roundText,
              { color: themeColors.textSecondary },
              {
                marginBottom: rV(12),
                marginTop: item.roundIndex > 0 ? rV(16) : 0,
              },
            ]}
          >
            ROUND {item.roundNumber}
          </Text>
        );
      }

      // type === "match"
      return (
        <MatchCard
          match={item.match}
          rIdx={item.roundIndex}
          mIdx={item.matchIndex}
          isMe={isMe}
          themeColors={themeColors}
          shadow={shadow}
        />
      );
    },
    [themeColors, shadow, isMe]
  );

  const keyExtractor = useCallback(
    (item: BracketItem, index: number) => {
      if (item.type === "round_header") return `round-header-${item.roundNumber}`;
      if (item.type === "match") return `match-${item.roundIndex}-${item.matchIndex}`;
      return `${item.type}-${index}`;
    },
    []
  );

  const getItemType = useCallback((item: BracketItem) => {
    return item.type;
  }, []);

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={themeColors.tint}
          colors={[themeColors.tint, themeColors.text]}
          progressBackgroundColor={themeColors.background}
        />
      ) : undefined,
    [onRefresh, refreshing, themeColors]
  );

  return (
    <View style={listStyles.flex}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        contentContainerStyle={listStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </View>
  );
};

// ── Styles (static, outside component) ─────────────────────────────────────
const matchStyles = StyleSheet.create({
  matchCardOuter: {
    marginBottom: rV(10),
  },
  matchCard: {
    borderRadius: rMS(20),
    borderWidth: 1,
    overflow: "hidden",
  },
  matchCardInner: {
    paddingVertical: rV(16),
    paddingHorizontal: rMS(16),
  },
  myMatchHighlightBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: rS(5),
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
    borderWidth: 1,
    borderRadius: rMS(8),
    paddingHorizontal: rMS(12),
    paddingVertical: rV(6),
    minWidth: rS(68),
  },
  matchScoreVal: {
    fontSize: rMS(16),
    fontWeight: "900",
  },
  matchScoreBoxDivider: {
    width: 1,
    height: rV(14),
    marginHorizontal: rS(8),
  },
});

const listStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: rS(16),
    paddingTop: rV(8),
    paddingBottom: rV(60),
  },
  roundText: {
    textAlign: "center",
    fontSize: rMS(11),
    fontWeight: "700",
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
  },
  bracketInfoText: {
    marginHorizontal: rS(16),
    fontSize: rMS(10),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: rMS(16),
    letterSpacing: 0.5,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: rV(32),
  },
  emptyText: {
    fontSize: rMS(13),
    fontWeight: "600",
    marginTop: rV(10),
    textAlign: "center",
  },
});

export default memo(KnockoutBracketList);
