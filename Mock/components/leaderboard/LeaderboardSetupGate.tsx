import React, { memo, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Flag, School } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import { useAuth } from "../../store/authStore";
import {
  getLeaderboardSetupCopy,
  type LeaderboardSetupVariant,
} from "../../utils/leaderboardProfile";

interface Props {
  variant: LeaderboardSetupVariant;
  onPrimaryPress: () => void;
  onBack: () => void;
}

const LeaderboardSetupGate: React.FC<Props> = ({
  variant,
  onPrimaryPress,
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userInfo } = useAuth();
  const copy = getLeaderboardSetupCopy(variant, userInfo?.user);
  const IconComponent = variant === "country" ? Flag : School;
  const iconBg =
    variant === "country"
      ? (themeColors.tintSecond ?? themeColors.tint)
      : "#8b3b8f";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          paddingHorizontal: rS(16),
          paddingTop: rV(8),
          paddingBottom: rV(24),
        },
        card: {
          backgroundColor: themeColors.cardGlass,
          borderRadius: rMS(24),
          borderWidth: 1,
          borderColor: themeColors.border + "40",
          paddingHorizontal: rMS(18),
          paddingVertical: rV(20),
          alignItems: "center",
        },
        label: {
          fontSize: rMS(10),
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 3,
          color: themeColors.tint,
          marginBottom: rV(12),
        },
        iconCircle: {
          width: rMS(48),
          height: rMS(48),
          borderRadius: rMS(24),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBg + "20",
          marginBottom: rV(12),
        },
        title: {
          fontSize: rMS(18),
          fontWeight: "900",
          color: themeColors.text,
          textAlign: "center",
          letterSpacing: -0.3,
          marginBottom: rV(8),
        },
        body: {
          fontSize: rMS(13),
          fontWeight: "500",
          color: themeColors.textSecondary,
          textAlign: "center",
          lineHeight: rMS(20),
          marginBottom: rV(18),
        },
        primaryButton: {
          width: "100%",
          borderRadius: rMS(24),
          paddingVertical: rV(13),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: themeColors.tint,
          minHeight: rV(48),
        },
        primaryButtonText: {
          color: "#fff",
          fontSize: rMS(14),
          fontWeight: "800",
        },
        backButton: {
          marginTop: rV(12),
          paddingVertical: rV(10),
          paddingHorizontal: rS(16),
          minHeight: rV(44),
          justifyContent: "center",
        },
        backButtonText: {
          fontSize: rMS(13),
          fontWeight: "700",
          color: themeColors.textSecondary,
        },
      }),
    [themeColors, iconBg]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.label}>Setup required</Text>
        <View style={styles.iconCircle}>
          <IconComponent size={24} color={iconBg} strokeWidth={1.75} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onPrimaryPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Set up school"
        >
          <Text style={styles.primaryButtonText}>{copy.cta}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(LeaderboardSetupGate);
