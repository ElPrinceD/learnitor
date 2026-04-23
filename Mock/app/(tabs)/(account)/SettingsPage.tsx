import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import { useCache } from "../../../contexts/CacheContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InAppBrowserLink from "../../../components/InAppBrowserLink";

export default function SettingsPage() {
  const { logout, userToken } = useAuth();
  const { clear } = useCache();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const clearUserDataCache = async () => {
    try {
      await clear();
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
  };

  const clearUserTokenDataCache = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } catch (e) {
      console.error("Error clearing AsyncStorage:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await clearUserDataCache();
      await clearUserTokenDataCache();
      logout();
      router.replace("Intro");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleTellAFriend = async () => {
    try {
      const shareOptions = {
        message: "Check out this cool app Buddy!",
        url: "https://your-app-url.com",
        title: "Share with Friends",
      };
      const result = await Share.share(shareOptions);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleAccountSettings = () => router.navigate("AccountSettings");
  const handleReportProblem = () => router.navigate("ReportProblem");
  const handleHelpCenter = () => router.navigate("FAQScreen");
  const handlePrivacySettings = () => router.navigate("ConsentSettings");

  type SettingsItem = {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
    dividerAbove?: boolean;
  };

  const settingsItems: SettingsItem[] = [
    { icon: "person-outline", label: "Account Settings", onPress: handleAccountSettings },
    { icon: "share-social-outline", label: "Tell a Friend", onPress: handleTellAFriend },
    { icon: "alert-circle-outline", label: "Report a Problem", onPress: handleReportProblem, dividerAbove: true },
    { icon: "help-circle-outline", label: "FAQs", onPress: handleHelpCenter },
    { icon: "shield-checkmark-outline", label: "Privacy Settings", onPress: handlePrivacySettings, dividerAbove: true },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      paddingHorizontal: rS(16),
      paddingTop: rV(8),
      paddingBottom: rV(40),
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(14),
      paddingHorizontal: rS(14),
      backgroundColor: themeColors.card,
      borderRadius: rMS(14),
      marginBottom: rV(8),
    },
    optionText: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: themeColors.text,
      marginLeft: rS(12),
      flex: 1,
    },
    sectionTitle: {
      fontSize: rMS(10),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
      marginTop: rV(16),
      marginBottom: rV(8),
      paddingHorizontal: rS(4),
    },
    linkOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(14),
      paddingHorizontal: rS(14),
      backgroundColor: themeColors.card,
      borderRadius: rMS(14),
      marginBottom: rV(8),
    },
    logoutOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(14),
      paddingHorizontal: rS(14),
      backgroundColor: themeColors.errorBackground
        ? themeColors.errorBackground + "12"
        : "#FF000012",
      borderRadius: rMS(14),
      marginTop: rV(16),
    },
    logoutText: {
      fontSize: SIZES.small,
      fontWeight: "700",
      color: themeColors.errorBackground || "#DC2626",
      marginLeft: rS(12),
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      {settingsItems
        .filter((item) => !item.dividerAbove)
        .map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon as any}
              size={22}
              color={themeColors.tint}
            />
            <Text style={styles.optionText}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        ))}

      <Text style={styles.sectionTitle}>Support</Text>
      {settingsItems
        .filter((item) => item.dividerAbove && item.label !== "Privacy Settings")
        .map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon as any}
              size={22}
              color={themeColors.tint}
            />
            <Text style={styles.optionText}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        ))}

      <Text style={styles.sectionTitle}>Privacy & Legal</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={handlePrivacySettings}
        activeOpacity={0.7}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={22}
          color={themeColors.tint}
        />
        <Text style={styles.optionText}>Privacy Settings</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={themeColors.textSecondary}
        />
      </TouchableOpacity>

      <InAppBrowserLink url={`${ApiUrl}/terms-and-conditions/`}>
        <View style={styles.linkOption}>
          <Ionicons
            name="document-text-outline"
            size={22}
            color={themeColors.tint}
          />
          <Text style={styles.optionText}>Terms of Use</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={themeColors.textSecondary}
          />
        </View>
      </InAppBrowserLink>

      <InAppBrowserLink url={`${ApiUrl}/privacy-policy/`}>
        <View style={styles.linkOption}>
          <Ionicons
            name="shield-outline"
            size={22}
            color={themeColors.tint}
          />
          <Text style={styles.optionText}>Privacy Policy</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={themeColors.textSecondary}
          />
        </View>
      </InAppBrowserLink>

      <TouchableOpacity
        style={styles.logoutOption}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons
          name="log-out-outline"
          size={22}
          color={themeColors.errorBackground || "#DC2626"}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
