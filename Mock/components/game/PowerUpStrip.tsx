import React, { memo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lightbulb, RefreshCw } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants/index.js";

interface Props {
  doubleDipActive: boolean;
  doubleDipUsed: boolean;
  askTheAIActive: boolean;
  askTheAIUsed: boolean;
  onDoubleDip: () => void;
  onAskPrince: () => void;
  // Animated.Values owned by the parent screen (so press/glow animations
  // can be driven from the same place that owns the activation logic).
  doubleDipScale: Animated.Value;
  doubleDipGlow: Animated.Value;
  askTheAIScale: Animated.Value;
  askTheAIGlow: Animated.Value;
  // When the parent's game is ended/loading, the strip is functionally
  // disabled and rendered in its locked state.
  disabled?: boolean;
}

const PowerUpStrip: React.FC<Props> = ({
  doubleDipActive,
  doubleDipUsed,
  askTheAIActive,
  askTheAIUsed,
  onDoubleDip,
  onAskPrince,
  doubleDipScale,
  doubleDipGlow,
  askTheAIScale,
  askTheAIGlow,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    powerUpContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: rS(16),
      paddingVertical: rV(16),
      paddingBottom: Math.max(rV(16), insets.bottom + rV(8)),
      backgroundColor:
        colorScheme === "dark" ? themeColors.cardGlass : "transparent",
      borderTopLeftRadius: rMS(32),
      borderTopRightRadius: rMS(32),
      borderTopWidth: 1,
      borderTopColor: themeColors.border + "40",
    },
    powerUpCard: {
      backgroundColor: "transparent",
      borderRadius: rMS(28),
      padding: rMS(10),
      alignItems: "center",
      justifyContent: "center",
      minWidth: rS(100),
      minHeight: rV(80),
      borderWidth: 1.5,
      borderColor: themeColors.border + "50",
    },
    powerUpButton: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    powerUpCardActive: {
      borderColor: "#FFD700",
      shadowColor: "#FFD700",
      shadowOpacity: 0.6,
    },
    powerUpCardUsed: {
      opacity: 0.5,
      backgroundColor: themeColors.textSecondary + "15",
    },
    powerUpIcon: {
      marginBottom: rV(4),
    },
    powerUpTitle: {
      fontSize: rMS(11),
      fontWeight: "600",
      color: themeColors.text,
      textAlign: "center",
    },
    powerUpDescription: {
      fontSize: rMS(9),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(2),
    },
    powerUpBadge: {
      position: "absolute",
      top: -rV(4),
      right: -rV(4),
      backgroundColor: "#FF6B6B",
      borderRadius: rMS(8),
      width: rS(16),
      height: rS(16),
      alignItems: "center",
      justifyContent: "center",
    },
    powerUpBadgeText: {
      color: "white",
      fontSize: rMS(8),
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.powerUpContainer}>
      <Animated.View
        style={[
          styles.powerUpCard,
          doubleDipActive && styles.powerUpCardActive,
          doubleDipUsed && styles.powerUpCardUsed,
          {
            transform: [{ scale: doubleDipScale }],
            shadowOpacity: doubleDipGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8],
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={onDoubleDip}
          disabled={
            doubleDipUsed || doubleDipActive || askTheAIActive || disabled
          }
          style={styles.powerUpButton}
        >
          <RefreshCw
            size={20}
            color={
              doubleDipActive
                ? "#FFD700"
                : doubleDipUsed
                ? themeColors.textSecondary
                : themeColors.tint
            }
            style={styles.powerUpIcon}
          />
          <Text
            style={[
              styles.powerUpTitle,
              { color: doubleDipActive ? "#FFD700" : themeColors.text },
            ]}
          >
            Double Dip
          </Text>
          <Text style={styles.powerUpDescription}>
            {doubleDipActive
              ? "Active!"
              : doubleDipUsed
              ? "Used"
              : "2 attempts"}
          </Text>
          {doubleDipActive && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.powerUpCard,
          askTheAIActive && styles.powerUpCardActive,
          askTheAIUsed && styles.powerUpCardUsed,
          {
            transform: [{ scale: askTheAIScale }],
            shadowOpacity: askTheAIGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8],
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={onAskPrince}
          disabled={
            askTheAIUsed || askTheAIActive || doubleDipActive || disabled
          }
          style={styles.powerUpButton}
        >
          <Lightbulb
            size={20}
            color={
              askTheAIActive
                ? "#FFD700"
                : askTheAIUsed
                ? themeColors.textSecondary
                : themeColors.tint
            }
            style={styles.powerUpIcon}
          />
          <Text
            style={[
              styles.powerUpTitle,
              { color: askTheAIActive ? "#FFD700" : themeColors.text },
            ]}
          >
            Ask Prince
          </Text>
          <Text style={styles.powerUpDescription}>
            {askTheAIActive
              ? "Thinking..."
              : askTheAIUsed
              ? "Used"
              : "Get hint"}
          </Text>
          {askTheAIActive && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpBadgeText}>?</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default memo(PowerUpStrip);
