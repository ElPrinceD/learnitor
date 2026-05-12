import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";

interface Props {
  timeframe: string | undefined;
  name: string | undefined;
}

const LeaderboardHero: React.FC<Props> = ({ timeframe, name }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    heroSection: {
      marginBottom: rV(28),
      paddingHorizontal: rS(8),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    heroTitle: {
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1,
      lineHeight: rMS(38),
    },
  });

  return (
    <View style={styles.heroSection}>
      <Text style={styles.heroLabel}>
        {timeframe === "season" ? "Current Season" : "All-Time"}
      </Text>
      <Text style={styles.heroTitle}>
        {(name || "Rankings").toUpperCase()}
      </Text>
    </View>
  );
};

export default memo(
  LeaderboardHero,
  (prev, next) => prev.timeframe === next.timeframe && prev.name === next.name
);
