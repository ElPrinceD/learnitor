import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import {
  Zap,
  Gamepad2,
  Users,
  Swords,
  GraduationCap,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";

export const PLAY_TUTORIAL_SEEN_KEY = "play_tutorial_seen";

const SLIDES: { title: string; text: string; IconComponent: LucideIcon }[] = [
  {
    title: "Welcome to\nPlay",
    text: "This is your hub for everything competitive — games, exams, rankings, and study squads. Let's show you around!",
    IconComponent: Zap,
  },
  {
    title: "Game\nModes",
    text: "Challenge friends in multiplayer or practice solo. Create a game, share the code, and compete in real-time quiz battles.",
    IconComponent: Gamepad2,
  },
  {
    title: "Study\nSquads",
    text: "Create or join squads to compete with friends. Squad members earn points and climb the squad leaderboard together.",
    IconComponent: Users,
  },
  {
    title: "Knockout\nBattles",
    text: "Go head-to-head in 1v1 knockout rounds. Win matches, climb the bracket, and prove you're the best in your squad.",
    IconComponent: Swords,
  },
  {
    title: "Weekly\nExams",
    text: "Scheduled exams are the main way to earn ranking points for World, Country, School, and squad leaderboards. They run on a strict schedule with specific start and end times — you can ONLY access and complete them during this live period!",
    IconComponent: GraduationCap,
  },
  {
    title: "Leader-\nboards",
    text: "Track your progress across World, Country, and School rankings. Every game and exam counts towards your standing.",
    IconComponent: Trophy,
  },
];

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function PlayTutorialOverlay({ visible, onDismiss }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  // Icon pulse animation
  const iconPulse = useSharedValue(1);
  useEffect(() => {
    if (!visible) return;
    iconPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [visible, iconPulse]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  // Button press animation
  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleNext = useCallback(async () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      await AsyncStorage.setItem(PLAY_TUTORIAL_SEEN_KEY, "true");
      setSlideIndex(0);
      onDismiss();
    }
  }, [slideIndex, onDismiss]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem(PLAY_TUTORIAL_SEEN_KEY, "true");
    setSlideIndex(0);
    onDismiss();
  }, [onDismiss]);

  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(20),
    },
    card: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(32),
      paddingTop: rMS(36),
      alignItems: "center",
      width: SCREEN_WIDTH - rS(40),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    skipButton: {
      position: "absolute",
      top: rV(14),
      right: rS(18),
      paddingVertical: rV(4),
      paddingHorizontal: rS(10),
    },
    skipText: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.textSecondary,
      letterSpacing: 0.5,
    },
    iconRing: {
      width: rMS(80),
      height: rMS(80),
      borderRadius: rMS(40),
      backgroundColor: (themeColors.tintSecond ?? themeColors.tint) + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(20),
      borderWidth: 1.5,
      borderColor: (themeColors.tintSecond ?? themeColors.tint) + "25",
    },
    title: {
      fontSize: rMS(24),
      fontWeight: "900",
      textAlign: "center",
      color: themeColors.text,
      letterSpacing: -0.5,
      lineHeight: rMS(28),
      marginBottom: rV(12),
    },
    text: {
      fontSize: rMS(14),
      textAlign: "center",
      lineHeight: rMS(22),
      color: themeColors.textSecondary,
      paddingHorizontal: rS(8),
      marginBottom: rV(24),
    },
    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(6),
      marginBottom: rV(24),
    },
    dot: {
      width: rMS(7),
      height: rMS(7),
      borderRadius: rMS(4),
      backgroundColor: themeColors.border,
    },
    dotActive: {
      width: rMS(20),
      backgroundColor: themeColors.tintSecond ?? themeColors.tint,
    },
    button: {
      backgroundColor: "transparent",
      paddingVertical: rV(14),
      paddingHorizontal: rMS(40),
      borderRadius: rMS(24),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: themeColors.tintSecond ?? themeColors.tint,
      width: "100%",
    },
    buttonText: {
      color: themeColors.tintSecond ?? themeColors.tint,
      fontSize: rMS(15),
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
          {/* Skip button */}
          {!isLast && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Animated icon */}
          <Animated.View style={[styles.iconRing, iconPulseStyle]}>
            <slide.IconComponent
              size={36}
              color={themeColors.tintSecond ?? themeColors.tint}
            />
          </Animated.View>

          {/* Title */}
          <Animated.Text
            key={`play-title-${slideIndex}`}
            entering={SlideInRight.duration(250)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.title}
          >
            {slide.title}
          </Animated.Text>

          {/* Description */}
          <Animated.Text
            key={`play-text-${slideIndex}`}
            entering={SlideInRight.duration(250).delay(50)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.text}
          >
            {slide.text}
          </Animated.Text>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === slideIndex && styles.dotActive]}
              />
            ))}
          </View>

          {/* Action button */}
          <AnimatedTouchable
            style={[styles.button, buttonAnimStyle]}
            onPress={handleNext}
            onPressIn={() => {
              buttonScale.value = withTiming(0.96, { duration: 100 });
            }}
            onPressOut={() => {
              buttonScale.value = withTiming(1, { duration: 100 });
            }}
            activeOpacity={1}
          >
            <Text style={styles.buttonText}>
              {isLast ? "Let's Play!" : "Next"}
            </Text>
          </AnimatedTouchable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(PlayTutorialOverlay);
