import React from "react";
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Share,
} from "react-native";
import {
  User,
  Share2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV } from "../../../constants";
import { useCache } from "../../../contexts/CacheContext";
import { clearSignupDraft } from "../../../hooks/useSignupDraft";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InAppBrowserLink from "../../../components/InAppBrowserLink";

export default function SettingsPage() {
  const { logout } = useAuth();
  const { clear } = useCache();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Subtle highlight color — not tint, just a light grey overlay
  const highlightColor =
    colorScheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const handleLogout = async () => {
    // Auth + navigation first so logout never blocks on SQLite (Android NPE risk)
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } catch (e) {
      console.error("Error clearing AsyncStorage:", e);
    }

    try {
      await clearSignupDraft();
    } catch {
      // best-effort
    }

    await logout();
    router.replace("Intro");

    try {
      await clear();
    } catch {
      // Cache clear is best-effort after navigation
    }
  };

  const handleTellAFriend = async () => {
    try {
      const shareOptions = {
        message: "Check out this cool app Buddy!",
        url: "https://your-app-url.com",
        title: "Share with Friends",
      };
      await Share.share(shareOptions);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleAccountSettings = () => router.navigate("AccountSettings");
  const handleReportProblem = () => router.navigate("ReportProblem");
  const handleHelpCenter = () => router.navigate("FAQScreen");
  const handlePrivacySettings = () => router.navigate("ConsentSettings");

  const renderItem = (
    IconComponent: React.FC<any>,
    label: string,
    onPress: () => void,
    iconColor?: string
  ) => (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={highlightColor}
    >
      <View style={styles.option}>
        <View style={styles.optionLeft}>
          <IconComponent
            size={20}
            color={iconColor || themeColors.textSecondary}
          />
          <Text
            style={[
              styles.optionText,
              iconColor ? { color: iconColor } : undefined,
            ]}
          >
            {label}
          </Text>
        </View>
        <ChevronRight size={16} color={themeColors.textSecondary + "80"} />
      </View>
    </TouchableHighlight>
  );

  const renderLinkItem = (
    IconComponent: React.FC<any>,
    label: string,
    url: string
  ) => (
    <InAppBrowserLink url={url}>
      <View style={styles.option}>
        <View style={styles.optionLeft}>
          <IconComponent size={20} color={themeColors.textSecondary} />
          <Text style={styles.optionText}>{label}</Text>
        </View>
        <ChevronRight size={16} color={themeColors.textSecondary + "80"} />
      </View>
    </InAppBrowserLink>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      paddingTop: rV(4),
      paddingBottom: rV(40),
    },
    sectionTitle: {
      fontSize: rMS(11),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1,
      color: themeColors.textSecondary,
      marginTop: rV(20),
      marginBottom: rV(4),
      paddingHorizontal: rS(20),
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: rV(14),
      paddingHorizontal: rS(20),
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(14),
    },
    optionText: {
      fontSize: rMS(14),
      fontWeight: "600",
      color: themeColors.text,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border + "30",
      marginLeft: rS(54),
    },
    logoutOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: rV(14),
      paddingHorizontal: rS(20),
    },
    logoutLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(14),
    },
    logoutText: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: "#DC2626",
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      {renderItem(User, "Account Settings", handleAccountSettings)}
      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>Support</Text>
      {renderItem(AlertCircle, "Report a Problem", handleReportProblem)}
      <View style={styles.separator} />
      {renderItem(HelpCircle, "FAQs", handleHelpCenter)}

      <Text style={styles.sectionTitle}>Privacy & Legal</Text>
      {renderItem(ShieldCheck, "Privacy Settings", handlePrivacySettings)}
      <View style={styles.separator} />
      {renderLinkItem(FileText, "Terms of Use", `${ApiUrl}/terms-and-conditions/`)}
      <View style={styles.separator} />
      {renderLinkItem(Shield, "Privacy Policy", `${ApiUrl}/privacy-policy/`)}

      <View style={{ marginTop: rV(24) }}>
        <TouchableHighlight
          onPress={handleLogout}
          underlayColor={highlightColor}
        >
          <View style={styles.logoutOption}>
            <View style={styles.logoutLeft}>
              <LogOut size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    </ScrollView>
  );
}
