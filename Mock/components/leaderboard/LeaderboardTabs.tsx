import React, { memo, useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants/index.js";

export type LeaderboardTab = "rankings" | "knockout";

interface Props {
  activeTab: LeaderboardTab;
  onTabChange: (tab: LeaderboardTab) => void;
}

const TABS: { key: LeaderboardTab; label: string }[] = [
  { key: "rankings", label: "Rankings" },
  { key: "knockout", label: "Knockout" },
];

// Translation distance for the sliding indicator. Mirrors the math from the
// pre-refactor LeaderboardDetail: viewport width minus the page's horizontal
// padding (rS(32)) minus the row's internal padding (rMS(8)), divided by 2
// (the indicator covers half the row).
const INDICATOR_TRANSLATE_X =
  (Dimensions.get("window").width - rS(32) - rMS(8)) / 2;

const LeaderboardTabs: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const tabIndicatorX = useSharedValue(
    activeTab === "knockout" ? INDICATOR_TRANSLATE_X : 0
  );

  const tabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  const handlePress = useCallback(
    (tab: LeaderboardTab, idx: number) => {
      onTabChange(tab);
      tabIndicatorX.value = withTiming(
        idx === 0 ? 0 : INDICATOR_TRANSLATE_X,
        { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) }
      );
    },
    [onTabChange, tabIndicatorX]
  );

  return (
    <View
      style={[
        styles.subTabRow,
        {
          backgroundColor: themeColors.cardGlass,
          borderColor: themeColors.border + "40",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.subTabIndicator,
          { backgroundColor: themeColors.tint },
          tabAnimStyle,
        ]}
      />
      {TABS.map((tab, idx) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.subTab}
          onPress={() => handlePress(tab.key, idx)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.subTabText,
              { color: themeColors.textSecondary },
              activeTab === tab.key && styles.subTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  subTabRow: {
    flexDirection: "row",
    borderRadius: rMS(24),
    padding: rMS(4),
    marginBottom: rV(20),
    borderWidth: 1,
    position: "relative",
  },
  subTabIndicator: {
    position: "absolute",
    top: rMS(4),
    bottom: rMS(4),
    left: rMS(4),
    width: "50%",
    borderRadius: rMS(22),
  },
  subTab: {
    flex: 1,
    paddingVertical: rV(10),
    borderRadius: rMS(22),
    alignItems: "center",
    zIndex: 1,
  },
  subTabText: {
    fontSize: rMS(13),
    fontWeight: "800",
  },
  subTabTextActive: {
    color: "#fff",
  },
});

export default memo(LeaderboardTabs);
