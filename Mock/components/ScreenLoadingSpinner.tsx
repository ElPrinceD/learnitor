import React, { memo, useEffect } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Colors from "../constants/Colors";
import { rMS } from "../constants";

// ── Config ─────────────────────────────────────────────────────────────
const DOT_COUNT = 3;
const DOT_SIZE = rMS(7);
const DOT_GAP = rMS(10);
const BOUNCE_HEIGHT = rMS(10);
const DURATION = 350;
const STAGGER = 120;

interface Props {
  /** Override the default flex:1 centered layout. */
  style?: object;
}

// ── Individual Dot ─────────────────────────────────────────────────────
// Each dot runs the same animation but offset by `index * STAGGER`ms,
// creating a cascading wave. All animation values live on the UI thread
// via Reanimated shared values — zero JS-thread work per frame.
const Dot: React.FC<{ index: number; color: string; glowColor: string }> =
  memo(({ index, color, glowColor }) => {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.45);

    useEffect(() => {
      // Bounce: rest → up → rest, then hold for the remaining dots
      const totalCycle = DURATION * 2 + STAGGER * (DOT_COUNT - 1);
      const holdAfter = totalCycle - DURATION * 2;

      translateY.value = withDelay(
        index * STAGGER,
        withRepeat(
          withSequence(
            withTiming(-BOUNCE_HEIGHT, {
              duration: DURATION,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0, {
              duration: DURATION,
              easing: Easing.in(Easing.cubic),
            }),
            withTiming(0, { duration: holdAfter })
          ),
          -1 // infinite
        )
      );

      // Scale pulse paired with the bounce
      scale.value = withDelay(
        index * STAGGER,
        withRepeat(
          withSequence(
            withTiming(1.25, {
              duration: DURATION,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(1, {
              duration: DURATION,
              easing: Easing.in(Easing.cubic),
            }),
            withTiming(1, { duration: holdAfter })
          ),
          -1
        )
      );

      // Opacity pulse: dim → bright → dim
      opacity.value = withDelay(
        index * STAGGER,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: DURATION,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0.45, {
              duration: DURATION,
              easing: Easing.in(Easing.cubic),
            }),
            withTiming(0.45, { duration: holdAfter })
          ),
          -1
        )
      );
    }, [index, translateY, scale, opacity]);

    const animStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    }));

    return (
      <Animated.View style={animStyle}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: color,
              shadowColor: glowColor,
            },
          ]}
        />
      </Animated.View>
    );
  });

Dot.displayName = "Dot";

// ── Spinner ────────────────────────────────────────────────────────────
/**
 * Branded loading indicator — three bouncing dots with a subtle glow
 * that matches the app's tint color. Fully GPU-driven via Reanimated
 * worklets (no JS-thread animation ticks).
 *
 * Usage:
 *   <ScreenLoadingSpinner />
 *   <ScreenLoadingSpinner style={{ paddingVertical: 20 }} />
 */
const ScreenLoadingSpinner: React.FC<Props> = ({ style }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[styles.container, style]}
    >
      <View style={styles.dotRow}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <Dot
            key={i}
            index={i}
            color={themeColors.tint}
            glowColor={themeColors.tint}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: rMS(40),
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DOT_GAP,
    height: DOT_SIZE + BOUNCE_HEIGHT + rMS(4), // room for the bounce
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    // Subtle glow via shadow (iOS) — Android uses elevation
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: rMS(6),
    elevation: 3,
  },
});

export default memo(ScreenLoadingSpinner);
