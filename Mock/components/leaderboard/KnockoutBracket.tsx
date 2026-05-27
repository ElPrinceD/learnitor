import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trophy } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants/index.js";
import type {
  KnockoutRound,
  SquadInfo,
} from "../../services/LeaderboardApiCalls";

interface Props {
  rounds: KnockoutRound[];
  squadInfo?: SquadInfo;
  isMe: (username: string) => boolean;
}

// Build the "KNOCKOUT STARTED IN SW X" / "KNOCKOUT STARTS IN SW X" info copy
// from the squad's knockout config. Falls back to a generic line when the
// backend hasn't populated `knockoutStartWeek` yet.
const buildKnockoutInfoText = (squadInfo?: SquadInfo): string => {
  if (!squadInfo?.knockoutStartWeek) {
    return "KNOCKOUT ROUNDS\nCALCULATED BY SQUAD MEMBERS";
  }
  return squadInfo.knockoutStarted
    ? `KNOCKOUT STARTED IN SW ${squadInfo.knockoutStartWeek}`
    : `KNOCKOUT STARTS IN SW ${squadInfo.knockoutStartWeek}`;
};

const KnockoutBracket: React.FC<Props> = ({ rounds, squadInfo, isMe }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const knockoutInfoText = buildKnockoutInfoText(squadInfo);

  const styles = StyleSheet.create({
    bracketContainer: {
      paddingTop: rV(10),
    },
    matchCardOuter: {
      marginBottom: rV(10),
    },
    matchCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
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
    myMatchHighlightBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: rS(5),
      backgroundColor: themeColors.tint,
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
    roundText: {
      textAlign: "center",
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.textSecondary,
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
      backgroundColor: themeColors.border,
    },
    bracketInfoText: {
      marginHorizontal: rS(16),
      fontSize: rMS(10),
      color: themeColors.textSecondary,
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
      color: themeColors.textSecondary,
      fontSize: rMS(13),
      fontWeight: "600",
      marginTop: rV(10),
      textAlign: "center",
    },
  });

  return (
    <View style={styles.bracketContainer}>
      {rounds.length > 0 ? (
        rounds.map((round, rIdx) => (
          <Animated.View
            key={`round-${round.round}`}
            entering={FadeInDown.duration(300).delay(200 + rIdx * 100)}
          >
            <Text
              style={[
                styles.roundText,
                {
                  marginBottom: rV(12),
                  marginTop: rIdx > 0 ? rV(16) : 0,
                },
              ]}
            >
              ROUND {round.round}
            </Text>
            {round.matches.map((match, mIdx) => {
              const score1Display = match.score1 != null ? String(match.score1) : "—";
              const score2Display = match.score2 != null ? String(match.score2) : "—";

              const p1Parts = match.player1.split("\n");
              const p1Name = p1Parts[0];
              const p1User = p1Parts[1] || "";

              const p2Parts = match.player2.split("\n");
              const p2Name = p2Parts[0];
              const p2User = p2Parts[1] || "";

              const checkIsMe = (parts: string[]) => {
                return parts.some(part => {
                  return isMe(part);
                });
              };

              const isPlayer1Me = checkIsMe(p1Parts);
              const isPlayer2Me = checkIsMe(p2Parts);
              const isMeInMatch = isPlayer1Me || isPlayer2Me;

              const p1NameColor = isPlayer1Me ? themeColors.tint : themeColors.text;
              const p2NameColor = isPlayer2Me ? themeColors.tint : themeColors.text;

              return (
                <View
                  key={`match-${rIdx}-${mIdx}`}
                  style={styles.matchCardOuter}
                >
                  <View style={[styles.matchCard, isMeInMatch && styles.myMatchCard]}>
                    <View style={styles.matchCardInner}>
                      {isMeInMatch && <View style={styles.myMatchHighlightBar} />}
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
                    </View>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyWrap}>
          <Trophy
            size={36}
            color={themeColors.textSecondary}
            strokeWidth={1.5}
          />
          <Text style={styles.emptyText}>No knockout matches yet</Text>
        </View>
      )}

      <View style={styles.bracketInfoRow}>
        <View style={styles.bracketInfoLine} />
        <Text style={styles.bracketInfoText}>{knockoutInfoText}</Text>
        <View style={styles.bracketInfoLine} />
      </View>
    </View>
  );
};

export default memo(KnockoutBracket);
