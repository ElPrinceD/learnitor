import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Mail } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { SIZES, rMS, rS, rV } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import { StatusBar } from "expo-status-bar";

const Verification = () => {
  const params = useLocalSearchParams();
  const email = params.email;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(24),
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(80),
      left: -rS(60),
      width: rS(220),
      height: rS(220),
      borderRadius: rS(110),
      backgroundColor: themeColors.tint + "15",
    },
    blob2: {
      position: "absolute",
      bottom: rV(60),
      right: -rS(80),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: "#8B5CF615",
    },
    iconCircle: {
      width: rMS(80),
      height: rMS(80),
      borderRadius: rMS(40),
      backgroundColor: themeColors.tint + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(24),
    },
    title: {
      fontSize: rMS(26),
      fontWeight: "900",
      color: themeColors.text,
      marginBottom: rV(12),
      letterSpacing: -0.5,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(20),
    },
    emailLabel: {
      fontSize: rMS(14),
      color: themeColors.textSecondary,
    },
    email: {
      fontWeight: "800",
      fontSize: rMS(16),
      color: themeColors.tint,
      marginTop: rV(4),
    },
    text: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
      marginBottom: rV(8),
      paddingHorizontal: rS(16),
    },
    boldText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginBottom: rV(24),
    },
    bold: {
      fontWeight: "700",
      color: themeColors.text,
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
        <View style={styles.iconCircle}>
          <Mail size={rMS(36)} color={themeColors.tint} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={{ alignItems: "center" }}>
        <Text style={styles.title}>You're almost there!</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.centered}>
        <Text style={styles.emailLabel}>We've sent an email to:</Text>
        <Text style={styles.email}>{email}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(400)} style={{ alignItems: "center" }}>
        <Text style={styles.text}>
          Just tap on the link in that email to complete your sign up.
        </Text>
        <Text style={styles.boldText}>
          If you don't see it, you need to check your{" "}
          <Text style={styles.bold}>spam folder</Text>.
        </Text>
        <Text style={styles.text}>
          Still can't find the email? No problem.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(500)}>
        <VerificationButton
          onPress={() => console.log("Resend verification email")}
          title="Resend Verification Email"
        />
      </Animated.View>
    </View>
  );
};

export default Verification;
