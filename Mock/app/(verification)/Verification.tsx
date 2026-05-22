import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { Mail, RefreshCw } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { StatusBar } from "expo-status-bar";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Verification = () => {
  const params = useLocalSearchParams();
  const email = params.email;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  const resendScale = useSharedValue(1);
  const resendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resendScale.value }],
  }));
  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
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
      bottom: rV(60),
      right: -rS(80),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#8B5CF618",
    },
    blob3: {
      position: "absolute",
      top: rV(350),
      left: -rS(30),
      width: rS(160),
      height: rS(160),
      borderRadius: rS(80),
      backgroundColor: "#10B98115",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: rMS(24),
    },
    // Hero
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(10),
    },
    iconCircle: {
      width: rMS(72),
      height: rMS(72),
      borderRadius: rMS(36),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(20),
    },
    title: {
      fontSize: rMS(30),
      fontWeight: "900",
      color: themeColors.text,
      marginBottom: rV(8),
      letterSpacing: -0.5,
      textAlign: "center",
    },
    // Info card — glassmorphic
    infoCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(28),
      marginTop: rV(24),
      width: "100%",
      maxWidth: rS(320),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    emailLabel: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    email: {
      fontWeight: "800",
      fontSize: rMS(16),
      color: themeColors.tint,
      marginTop: rV(4),
      marginBottom: rV(20),
    },
    text: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
      marginBottom: rV(6),
      paddingHorizontal: rS(8),
    },
    boldText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginBottom: rV(20),
    },
    bold: {
      fontWeight: "700",
      color: themeColors.text,
    },
    // Resend button
    resendButton: {
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
    resendButtonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "800",
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
          <Text style={styles.heroLabel}>Almost There</Text>
          <View style={styles.iconCircle}>
            <Mail size={rMS(36)} color={themeColors.tint} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{ alignItems: "center" }}
        >
          <Text style={styles.title}>You're almost there!</Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={styles.infoCard}
        >
          <Text style={styles.emailLabel}>We've sent an email to:</Text>
          <Text style={styles.email}>{email}</Text>

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

          <AnimatedTouchable
            style={[styles.resendButton, resendAnimStyle]}
            onPress={() => console.log("Resend verification email")}
            onPressIn={() => onPressIn(resendScale)}
            onPressOut={() => onPressOut(resendScale)}
            activeOpacity={1}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.resendButtonText}>Resend Verification Email</Text>
          </AnimatedTouchable>
        </Animated.View>
      </View>
    </View>
  );
};

export default Verification;
