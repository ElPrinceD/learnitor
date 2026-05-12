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
      marginBottom: rV(28),
    },
    matchCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
      backgroundColor: themeColors.cardGlass,
      padding: rMS(16),
      borderRadius: rMS(32),
      ...shadow.large,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    matchPlayerLeft: {
      flex: 1,
      alignItems: "flex-end",
    },
    matchPlayerRight: {
      flex: 1,
      alignItems: "flex-start",
    },
    matchPlayerText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
    },
    scoreBlock: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      paddingHorizontal: rMS(16),
      paddingVertical: rV(8),
      marginHorizontal: rS(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: rMS(80),
      ...shadow.light,
    },
    scoreText: {
      fontSize: rMS(18),
      fontWeight: "900",
      color: themeColors.text,
    },
    scoreDivider: {
      width: 1,
      height: rV(16),
      backgroundColor: themeColors.border,
      marginHorizontal: rS(10),
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
            {round.matches.map((match, mIdx) => (
              <View
                key={`match-${rIdx}-${mIdx}`}
                style={styles.matchCardOuter}
              >
                <View style={styles.matchCard}>
                  <View style={styles.matchPlayerLeft}>
                    <Text
                      style={[
                        styles.matchPlayerText,
                        isMe(match.player1) && { color: themeColors.tint },
                      ]}
                      numberOfLines={1}
                    >
                      {match.player1}
                    </Text>
                  </View>

                  <View style={styles.scoreBlock}>
                    {match.score1 != null && match.score2 != null ? (
                      <>
                        <Text style={styles.scoreText}>{match.score1}</Text>
                        <View style={styles.scoreDivider} />
                        <Text style={styles.scoreText}>{match.score2}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.scoreText}>—</Text>
                        <View style={styles.scoreDivider} />
                        <Text style={styles.scoreText}>—</Text>
                      </>
                    )}
                  </View>

                  <View style={styles.matchPlayerRight}>
                    <Text
                      style={[
                        styles.matchPlayerText,
                        isMe(match.player2) && { color: themeColors.tint },
                      ]}
                      numberOfLines={1}
                    >
                      {match.player2}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
