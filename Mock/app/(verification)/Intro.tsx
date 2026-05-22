import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { BookOpen, LogIn as LogInIcon } from "lucide-react-native";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { StatusBar } from "expo-status-bar";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Intro = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  const signUpScale = useSharedValue(1);
  const loginScale = useSharedValue(1);

  const signUpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signUpScale.value }],
  }));
  const loginAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginScale.value }],
  }));

  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleSignUp = () => {
    router.navigate("ContinueWithEmail");
  };

  const handleLogIn = () => {
    router.navigate("LogIn");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
    blob1: {
      position: "absolute",
      top: -rV(80),
      left: -rS(60),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(80),
      right: -rS(80),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#8B5CF618",
    },
    blob3: {
      position: "absolute",
      top: rV(350),
      left: -rS(40),
      width: rS(180),
      height: rS(180),
      borderRadius: rS(90),
      backgroundColor: "#10B98115",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: rMS(16),
    },
    // Hero
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    image: {
      width: rS(240),
      height: rV(200),
      resizeMode: "contain",
      marginBottom: rV(8),
    },
    title: {
      color: themeColors.text,
      fontSize: rMS(32),
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: -1,
    },
    subtitle: {
      color: themeColors.textSecondary,
      fontSize: rMS(13),
      textAlign: "center",
      marginTop: rV(10),
      lineHeight: rMS(20),
      paddingHorizontal: rS(12),
    },
    // Text card — glassmorphic (wraps image + title + subtitle)
    textCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      paddingTop: rMS(28),
      width: "100%",
      maxWidth: rS(320),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    // Buttons below the card
    buttonContainer: {
      marginTop: rV(28),
      width: "100%",
      maxWidth: rS(320),
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: rS(8),
      ...shadow.small,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderRadius: rMS(22),
      paddingVertical: rV(12),
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: rS(6),
      marginTop: rV(8),
    },
    secondaryButtonText: {
      color: themeColors.tint,
      fontSize: rMS(14),
      fontWeight: "700",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <View style={styles.content}>
        {/* Welcome label — outside the card */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{ alignItems: "center", marginBottom: rV(16) }}
        >
          <Text style={styles.heroLabel}>Welcome</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(150)}
          style={{ alignItems: "center" }}
        >
          <Image
            source={require("../../assets/images/homepage.png")}
            style={styles.image}
          />
        </Animated.View>

        {/* Text Card — glassmorphic wrapping title + subtitle */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(250)}
          style={styles.textCard}
        >
          <Text style={styles.title}>The Best{"\n"}Educational Guide</Text>
          <Text style={styles.subtitle}>
            Make learning easier by following our study guides curated uniquely
            for your field of choice.
          </Text>
        </Animated.View>

        {/* Buttons — outside the card */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(400)}
          style={styles.buttonContainer}
        >
          <AnimatedTouchable
            style={[styles.primaryButton, signUpAnimStyle]}
            onPress={handleSignUp}
            onPressIn={() => onPressIn(signUpScale)}
            onPressOut={() => onPressOut(signUpScale)}
            activeOpacity={1}
          >
            <BookOpen size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Create an account</Text>
          </AnimatedTouchable>

          <AnimatedTouchable
            style={[styles.secondaryButton, loginAnimStyle]}
            onPress={handleLogIn}
            onPressIn={() => onPressIn(loginScale)}
            onPressOut={() => onPressOut(loginScale)}
            activeOpacity={1}
          >
            <LogInIcon size={16} color={themeColors.tint} />
            <Text style={styles.secondaryButtonText}>Log in</Text>
          </AnimatedTouchable>
        </Animated.View>
      </View>
    </View>
  );
};

export default Intro;
