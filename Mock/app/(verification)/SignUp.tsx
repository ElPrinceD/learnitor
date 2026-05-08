import React, { useState } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const SignUp = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleSignUpWithEmail = () => {
    router.navigate("ContinueWithEmail");
  };

  const handleNavigateToLogin = () => {
    router.navigate("LogIn");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(16),
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(80),
      right: -rS(40),
      width: rS(200),
      height: rS(200),
      borderRadius: rS(100),
      backgroundColor: themeColors.tint + "12",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(80),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: "#F59E0B12",
    },
    title: {
      fontSize: rMS(22),
      color: themeColors.text,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: -0.3,
      lineHeight: rMS(30),
      paddingHorizontal: rS(20),
      marginBottom: rV(32),
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(24),
      width: rS(260),
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
    bottomContainer: {
      position: "absolute",
      bottom: Math.max(rV(20), insets.bottom + rV(10)),
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

      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={{ alignItems: "center" }}
      >
        <Text style={styles.title}>
          Create a free account to discover your personalized learning path
        </Text>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <VerificationButton
          onPress={handleSignUpWithEmail}
          title="Continue with email"
        />
      </Animated.View>

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
