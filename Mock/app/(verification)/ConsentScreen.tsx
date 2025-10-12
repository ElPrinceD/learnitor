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
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import { useConsent } from "../../contexts/ConsentContext";
import InAppBrowserLink from "../../components/InAppBrowserLink";
import ApiUrl from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      enabled: true, // Default enabled
    },
    {
      id: "analytics",
      title: "App Improvement",
      description:
        "Help us improve the app by sharing anonymous usage data and performance information. No personal data is shared.",
      required: false,
      enabled: true, // Default enabled
    },
    {
      id: "marketing",
      title: "Updates & Tips",
      description:
        "Send you occasional emails about new features, learning tips, and educational content to enhance your experience.",
      required: false,
      enabled: true, // Default enabled
    },
    {
      id: "advertising",
      title: "Personalized Ads",
      description:
        "Show you relevant ads based on your interests to support the free app experience. You can disable this anytime.",
      required: false,
      enabled: true, // Default enabled
    },
  ]);

  const [allRequiredAccepted, setAllRequiredAccepted] = useState(false);

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((consent) =>
        consent.id === id ? { ...consent, enabled: !consent.enabled } : consent
      )
    );
  };

  const handleContinue = async () => {
    try {
      // Convert consents array to object for batch update
      const consentUpdates: Record<string, boolean> = {};
      consents.forEach((consent) => {
        consentUpdates[consent.id] = consent.enabled;
      });

      // Save all consent preferences in one batch
      await updateMultipleConsents(consentUpdates);

      // Check what was actually saved
      const savedConsents = await AsyncStorage.getItem("user_consents");

      // Navigate to login with pre-filled email
      router.replace({
        pathname: "LogIn",
        params: { email: email || "" },
      });
    } catch (error) {
      console.error("Error saving consents:", error);
      // Still navigate to app even if consent saving fails
      router.replace("/(verification)/LogIn");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingTop: rV(40),
    },
    header: {
      alignItems: "center",
      marginBottom: rV(20), // Reduced from 40
    },
    title: {
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(10),
    },
    subtitle: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    consentItem: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(6), // Further reduced
      padding: rMS(12), // Further reduced
      marginBottom: rV(16), // Further increased to prevent footer overlap
      borderWidth: 1,
      borderColor: themeColors.text + "40", // Darker shade with opacity
    },
    consentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(4), // Reduced
    },
    consentTitle: {
      fontSize: SIZES.large,
      fontWeight: "600",
      color: themeColors.text,
      flex: 1,
    },
    requiredBadge: {
      backgroundColor: themeColors.tint, // Changed to themeColors.tint
      paddingHorizontal: rS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(4),
      marginLeft: rS(8),
    },
    requiredText: {
      color: "white",
      fontSize: SIZES.small,
      fontWeight: "600",
    },
    descriptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    consentDescription: {
      fontSize: SIZES.small, // Reduced from medium
      color: themeColors.textSecondary,
      lineHeight: 16, // Reduced from 18
      flex: 1, // Take up available space
      marginRight: rS(12), // Space between text and toggle
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end", // Move toggle to right
      marginTop: rV(4), // Reduced further
    },
    switchLabel: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      marginRight: rS(12),
    },
    footer: {
      paddingHorizontal: rMS(20),
      paddingBottom: Math.max(rV(20), insets.bottom + rV(10)), // Use safe area bottom + padding
      paddingTop: rV(10),
      alignItems: "center", // Center the button
    },
    privacyText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: rV(20),
    },
    privacyLink: {
      color: themeColors.tint, // Changed to themeColors.tint
      textDecorationLine: "underline",
      fontSize: SIZES.small, // Match the parent text size
      lineHeight: 18, // Match the parent line height
      textAlignVertical: "center", // Ensure vertical alignment
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: rV(50) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons
            name="shield-checkmark"
            size={48}
            color={themeColors.text} // Changed to themeColors.text
            style={{ marginBottom: rV(16) }}
          />
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.subtitle}>
            We respect your privacy and want you to understand how we use your
            data. Please review and choose your preferences below.
          </Text>
        </View>

        {consents.map((consent) => (
          <View key={consent.id} style={styles.consentItem}>
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
                    false: themeColors.text,
                    true: themeColors.tint,
                  }}
                  thumbColor={consent.enabled ? "white" : themeColors.text}
                />
              )}
            </View>
          </View>
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
          {"   "} .You can change these settings anytime in your account
          settings.
        </Text>

        <VerificationButton
          onPress={handleContinue}
          title="Continue to Login"
        />
      </View>
    </View>
  );
};

export default ConsentScreen;
