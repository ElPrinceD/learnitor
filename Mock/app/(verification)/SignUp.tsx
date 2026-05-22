import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { Mail, Sparkles } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SignUp = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const emailScale = useSharedValue(1);
  const emailAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }],
  }));

  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleSignUpWithEmail = () => {
    router.navigate("ContinueWithEmail");
  };

  const handleNavigateToLogin = () => {
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
      right: -rS(40),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(80),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#F59E0B18",
    },
    blob3: {
      position: "absolute",
      top: rV(250),
      left: -rS(50),
      width: rS(180),
      height: rS(180),
      borderRadius: rS(90),
      backgroundColor: "#8B5CF615",
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
    heroIconCircle: {
      width: rMS(64),
      height: rMS(64),
      borderRadius: rMS(32),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(20),
    },
    title: {
      fontSize: rMS(28),
      color: themeColors.text,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: -0.5,
      lineHeight: rMS(34),
      paddingHorizontal: rS(16),
      marginBottom: rV(8),
    },
    subtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
      paddingHorizontal: rS(20),
      marginBottom: rV(32),
    },
    // CTA card — glassmorphic
    ctaCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      width: "100%",
      maxWidth: rS(320),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(20),
      width: "100%",
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border,
    },
    dividerText: {
      color: themeColors.textSecondary,
      fontSize: rMS(12),
      fontWeight: "600",
      marginHorizontal: rS(16),
    },
    emailButton: {
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
    emailButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
    bottomContainer: {
      position: "absolute",
      bottom: Math.max(rV(20), insets.bottom + rV(10)),
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      color: themeColors.textSecondary,
      fontSize: rMS(13),
    },
    loginText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      marginLeft: rMS(4),
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <View style={styles.content}>
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{ alignItems: "center" }}
        >
          <Text style={styles.heroLabel}>Get Started</Text>
          <View style={styles.heroIconCircle}>
            <Sparkles size={28} color={themeColors.tint} />
          </View>
          <Text style={styles.title}>
            Create a free account to discover your personalized learning path
          </Text>
          <Text style={styles.subtitle}>
            Join thousands of students leveling up every day
          </Text>
        </Animated.View>

        {/* CTA Card */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={styles.ctaCard}
        >
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <AnimatedTouchable
            style={[styles.emailButton, emailAnimStyle]}
            onPress={handleSignUpWithEmail}
            onPressIn={() => onPressIn(emailScale)}
            onPressOut={() => onPressOut(emailScale)}
            activeOpacity={1}
          >
            <Mail size={18} color="#fff" />
            <Text style={styles.emailButtonText}>Continue with email</Text>
          </AnimatedTouchable>
        </Animated.View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.existingText}>Existing User?</Text>
        <Text style={styles.loginText} onPress={handleNavigateToLogin}>
          Login
        </Text>
      </View>
    </View>
  );
};

export default SignUp;
