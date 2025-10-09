import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import { useConsent } from "../../../contexts/ConsentContext";

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const ConsentSettings = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { consents, updateConsent, hasConsent } = useConsent();

  const [consentItems, setConsentItems] = useState<ConsentItem[]>([
    {
      id: "essential",
      title: "Essential App Functionality",
      description: "Account information, learning progress, and course data",
      enabled: true,
    },
    {
      id: "notifications",
      title: "Learning Reminders",
      description:
        "Notifications about your learning goals and study reminders",
      enabled: true, // Default enabled
    },
    {
      id: "analytics",
      title: "App Improvement",
      description: "Anonymous usage data to help us improve the app",
      enabled: true, // Default enabled
    },
    {
      id: "marketing",
      title: "Updates & Tips",
      description: "Emails about new features and learning tips",
      enabled: true, // Default enabled
    },
    {
      id: "advertising",
      title: "Personalized Ads",
      description: "Show relevant ads to support the free app experience",
      enabled: true, // Default enabled
    },
  ]);

  useEffect(() => {
    // Load current consent states from backend, with defaults for new users
    setConsentItems((prev) =>
      prev.map((item) => {
        const hasBackendConsent = hasConsent(item.id);
        const isNewUser = Object.keys(consents).length === 0;

        return {
          ...item,
          enabled: hasBackendConsent || (item.id !== "essential" && isNewUser),
        };
      })
    );
  }, [consents, hasConsent]);

  const toggleConsent = async (id: string) => {
    // Get current state from backend data or default for new users
    const hasBackendConsent = hasConsent(id);
    const isNewUser = Object.keys(consents).length === 0;
    const currentState = hasBackendConsent || (id !== "essential" && isNewUser);
    const newState = !currentState;

    // Update consent - the context will handle optimistic updates and backend sync
    await updateConsent(id, newState);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: rMS(20),
      paddingTop: rV(20),
    },
    checkStoredConsents: {
      marginBottom: rV(20),
      alignSelf: "flex-end",
      backgroundColor: themeColors.tint,
      padding: rS(10),
      borderRadius: rMS(10),
    },
    checkStoredConsentsText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    header: {
      alignItems: "center",
      marginBottom: rV(20), // Reduced from 30
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
      marginTop: rV(8), // Added margin
    },
    switchLabel: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    infoText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginTop: rV(20),
      paddingHorizontal: rMS(20),
    },
    sectionDivider: {
      height: 1,
      backgroundColor: themeColors.border,
      marginVertical: rV(24),
      marginHorizontal: rS(20),
    },
    sectionTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(16),
      paddingHorizontal: rS(20),
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
            name="settings"
            size={48}
            color={themeColors.text} // Changed to themeColors.text
            style={{ marginBottom: rV(16) }}
          />
          <Text style={styles.title}>Privacy Settings</Text>
          <Text style={styles.subtitle}>
            Manage your privacy preferences and control how we use your data.
          </Text>
        </View>

        {consentItems.map((item) => (
          <View key={item.id} style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>{item.title}</Text>
            </View>
            <View style={styles.descriptionRow}>
              <Text style={styles.consentDescription}>{item.description}</Text>
              {item.id !== "essential" && (
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleConsent(item.id)}
                  trackColor={{
                    false: themeColors.text,
                    true: themeColors.tint,
                  }}
                  thumbColor={item.enabled ? "white" : themeColors.text}
                />
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ConsentSettings;
