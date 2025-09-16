import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
import InAppBrowserLink from "./InAppBrowserLink";

interface SimpleLegalLinksProps {
  termsOfUseUrl?: string;
  privacyPolicyUrl?: string;
}

const SimpleLegalLinks: React.FC<SimpleLegalLinksProps> = ({
  termsOfUseUrl = "https://example.com/terms",
  privacyPolicyUrl = "https://example.com/privacy",
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.background,
      paddingVertical: rV(20),
    },
    linkItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: rV(15),
      paddingHorizontal: rS(20),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    linkContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    linkIcon: {
      marginRight: rS(12),
    },
    linkText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
      fontWeight: "500",
    },
    linkDescription: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    chevronIcon: {
      marginLeft: rS(8),
    },
  });

  return (
    <View style={styles.container}>
      {/* Terms of Use Link */}
      <InAppBrowserLink url={termsOfUseUrl}>
        <View style={styles.linkItem}>
          <View style={styles.linkContent}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={themeColors.tint}
              style={styles.linkIcon}
            />
            <View>
              <Text style={styles.linkText}>Terms of Use</Text>
              <Text style={styles.linkDescription}>
                Read our terms and conditions
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={themeColors.textSecondary}
            style={styles.chevronIcon}
          />
        </View>
      </InAppBrowserLink>

      {/* Privacy Policy Link */}
      <InAppBrowserLink url={privacyPolicyUrl}>
        <View style={styles.linkItem}>
          <View style={styles.linkContent}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={themeColors.tint}
              style={styles.linkIcon}
            />
            <View>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.linkDescription}>
                Learn how we protect your data
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={themeColors.textSecondary}
            style={styles.chevronIcon}
          />
        </View>
      </InAppBrowserLink>
    </View>
  );
};

export default SimpleLegalLinks;
