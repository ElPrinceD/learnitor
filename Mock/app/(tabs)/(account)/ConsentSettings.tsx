import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { Settings } from "lucide-react-native";
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
      marginBottom: rV(20),
    },
    title: {
      fontSize: rMS(20),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(8),
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
    consentItem: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      padding: rMS(14),
      marginBottom: rV(12),
      borderWidth: 1,
      borderColor: themeColors.border + "30",
    },
    consentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(4),
    },
    consentTitle: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: themeColors.text,
      flex: 1,
    },
    descriptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    consentDescription: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      lineHeight: 16,
      flex: 1,
      marginRight: rS(12),
      fontWeight: "500",
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: rV(8),
    },
    switchLabel: {
      fontSize: rMS(13),
      color: themeColors.text,
    },
    infoText: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginTop: rV(20),
      paddingHorizontal: rMS(20),
      fontWeight: "500",
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border + "30",
      marginVertical: rV(24),
      marginHorizontal: rS(20),
    },
    sectionTitle: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(14),
      paddingHorizontal: rS(20),
      letterSpacing: -0.1,
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
          <Settings
            size={40}
            color={themeColors.textSecondary}
            style={{ marginBottom: rV(14) }}
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
