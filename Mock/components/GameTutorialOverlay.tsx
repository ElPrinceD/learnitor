import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";

const GAME_TUTORIAL_SEEN_KEY = "game_tutorial_seen";
const CARD_RADIUS = 18;
const BUTTON_RADIUS = 22;

const SLIDES = [
  {
    title: "Welcome to the Arena!",
    text: "Join a game with a code from a friend, or create your own game to invite others.",
    icon: "game-controller" as const,
  },
  {
    title: "Power-ups",
    text: " 'Double Dip' lets you pick 2 answers. 'Ask Prince' gives you a helpful hint. Use them wisely!",
    icon: "bulb" as const,
  },
  {
    title: "Beat the Clock",
    text: "Answer before time runs out. Quick thinking pays off!",
    icon: "time" as const,
  },
];

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function GameTutorialOverlay({ visible, onDismiss }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  const handleGotIt = async () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      await AsyncStorage.setItem(GAME_TUTORIAL_SEEN_KEY, "true");
      onDismiss();
    }
  };

  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.card,
              width: SCREEN_WIDTH - rS(48),
              shadowColor: themeColors.shadow,
            },
          ]}
        >
          <View style={[styles.iconRing, { backgroundColor: themeColors.tint + "18" }]}>
            <Ionicons
              name={slide.icon}
              size={40}
              color={themeColors.tint}
            />
          </View>
          <View style={styles.titleSlot}>
            <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
              {slide.title}
            </Text>
          </View>
          <View style={styles.textSlot}>
            <Text style={[styles.text, { color: themeColors.textSecondary }]}>
              {slide.text}
            </Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
              {slideIndex + 1} of {SLIDES.length}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleGotIt}
              activeOpacity={0.8}
              style={[
                styles.button,
                {
                  backgroundColor: themeColors.tintSecond ?? themeColors.tint,
                  shadowColor: themeColors.shadow,
                },
              ]}
            >
              <Text style={styles.buttonText}>
                {isLast ? "Got it" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: rMS(24),
  },
  card: {
    borderRadius: CARD_RADIUS,
    padding: rMS(28),
    alignItems: "center",
    height: 400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rV(16),
  },
  titleSlot: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rV(8),
    paddingHorizontal: rS(8),
  },
  title: {
    fontSize: SIZES.xxLarge,
    fontWeight: "bold",
    textAlign: "center",
  },
  textSlot: {
    flex: 1,
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: rS(4),
    marginBottom: rV(8),
  },
  text: {
    fontSize: SIZES.medium,
    textAlign: "center",
    lineHeight: 24,
  },
  progressRow: {
    minHeight: 24,
    marginBottom: rV(16),
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: SIZES.small,
    opacity: 0.8,
  },
  buttonRow: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    paddingVertical: rV(10),
    paddingHorizontal: rMS(28),
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: SIZES.medium,
    fontWeight: "bold",
  },
});

export { GAME_TUTORIAL_SEEN_KEY };
