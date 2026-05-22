import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import { useConsent } from "../../contexts/ConsentContext";
import InAppBrowserLink from "../../components/InAppBrowserLink";
import ApiUrl from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

const ConsentScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { updateMultipleConsents } = useConsent();
  const { email } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const shadow = useShadows();

  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: "essential",
      title: "Essential App Functionality",
      description:
        "We need to save your account information, learning progress, and course data to provide the core learning experience.",
      required: true,
      enabled: true,
    },
    {
      id: "notifications",
      title: "Learning Reminders",
      description:
        "Send you notifications about your learning goals, course updates, and study reminders to help you stay on track.",
      required: false,
      enabled: true,
    },
    {
      id: "analytics",
      title: "App Improvement",
      description:
        "Help us improve the app by sharing anonymous usage data and performance information. No personal data is shared.",
      required: false,
      enabled: true,
    },
    {
      id: "marketing",
      title: "Updates & Tips",
      description:
        "Send you occasional emails about new features, learning tips, and educational content to enhance your experience.",
      required: false,
      enabled: true,
    },
    {
      id: "advertising",
      title: "Personalized Ads",
      description:
        "Show you relevant ads based on your interests to support the free app experience. You can disable this anytime.",
      required: false,
      enabled: true,
    },
  ]);

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((consent) =>
        consent.id === id ? { ...consent, enabled: !consent.enabled } : consent
      )
    );
  };

  const handleContinue = async () => {
    try {
      const consentUpdates: Record<string, boolean> = {};
      consents.forEach((consent) => {
        consentUpdates[consent.id] = consent.enabled;
      });

      await updateMultipleConsents(consentUpdates);

      const savedConsents = await AsyncStorage.getItem("user_consents");

      router.replace({
        pathname: "LogIn",
        params: { email: email || "" },
      });
    } catch (error) {
      console.error("Error saving consents:", error);
      router.replace("/(verification)/LogIn");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
    blob1: {
      position: "absolute",
      top: -rV(70),
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
      backgroundColor: "#10B98118",
    },
    blob3: {
      position: "absolute",
      top: rV(400),
      left: -rS(50),
      width: rS(160),
      height: rS(160),
      borderRadius: rS(80),
      backgroundColor: "#6366F115",
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: rMS(16),
      paddingTop: rV(40),
    },
    scrollContent: {
      paddingBottom: rV(30),
    },
    // Hero
    header: {
      alignItems: "center",
      marginBottom: rV(20),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(10),
    },
    iconCircle: {
      width: rMS(64),
      height: rMS(64),
      borderRadius: rMS(32),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(16),
    },
    title: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(10),
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
      paddingHorizontal: rS(10),
    },
    // Consent items — glassmorphic cards
    consentItem: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(18),
      marginBottom: rV(12),
      borderWidth: 1,
      borderColor: themeColors.border + "50",
      ...shadow.small,
    },
    consentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(6),
    },
    consentTitle: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: themeColors.text,
      flex: 1,
    },
    requiredBadge: {
      backgroundColor: themeColors.tint,
      paddingHorizontal: rS(10),
      paddingVertical: rV(3),
      borderRadius: rMS(12),
      marginLeft: rS(8),
    },
    requiredText: {
      color: "white",
      fontSize: rMS(10),
      fontWeight: "700",
    },
    descriptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    consentDescription: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      lineHeight: rMS(17),
      flex: 1,
      marginRight: rS(12),
    },
    // Footer
    footer: {
      paddingHorizontal: rMS(16),
      paddingBottom: Math.max(rV(20), insets.bottom + rV(10)),
      paddingTop: rV(10),
      alignItems: "center",
    },
    privacyText: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(17),
      marginBottom: rV(16),
    },
    privacyLink: {
      color: themeColors.tint,
      fontWeight: "600",
      fontSize: rMS(11),
      lineHeight: rMS(17),
    },
    continueButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      width: rS(260),
      alignItems: "center",
      justifyContent: "center",
      ...shadow.small,
    },
    continueButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={rMS(28)} color={themeColors.tint} />
          </View>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.subtitle}>
            We respect your privacy and want you to understand how we use your
            data. Please review and choose your preferences below.
          </Text>
        </Animated.View>

        {consents.map((consent, index) => (
          <Animated.View
            key={consent.id}
            entering={FadeInDown.duration(400).delay(200 + index * 60)}
          >
            <View style={styles.consentItem}>
              <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>{consent.title}</Text>
                {consent.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )}
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.consentDescription}>
                  {consent.description}
                </Text>
                {!consent.required && (
                  <Switch
                    value={consent.enabled}
                    onValueChange={() => toggleConsent(consent.id)}
                    trackColor={{
                      false: themeColors.border,
                      true: themeColors.tint,
                    }}
                    thumbColor="white"
                  />
                )}
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.privacyText}>
          By continuing, you agree to our{"  "}
          <InAppBrowserLink url={`${ApiUrl}/privacy-policy/`}>
            <Text style={styles.privacyLink}>Privacy Policy</Text>
          </InAppBrowserLink>
          {"    "}and{"  "}
          <InAppBrowserLink url={`${ApiUrl}/terms-and-conditions/`}>
            <Text style={styles.privacyLink}>Terms of Service</Text>
          </InAppBrowserLink>
          {"   "}.You can change these settings anytime in your account
          settings.
        </Text>

        <AnimatedTouchable
          style={[styles.continueButton, btnAnimStyle]}
          onPress={handleContinue}
          onPressIn={() => onPressIn(btnScale)}
          onPressOut={() => onPressOut(btnScale)}
          activeOpacity={1}
        >
          <Text style={styles.continueButtonText}>Continue to Login</Text>
        </AnimatedTouchable>
      </View>
    </View>
  );
};

export default ConsentScreen;
