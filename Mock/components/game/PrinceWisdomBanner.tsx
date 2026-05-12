import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lightbulb } from "lucide-react-native";

import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants/index.js";

interface Props {
  visible: boolean;
  wisdomPrefix: string;
  predictionText: string | undefined;
}

const PrinceWisdomBanner: React.FC<Props> = ({
  visible,
  wisdomPrefix,
  predictionText,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    aiPrediction: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      backgroundColor:
        colorScheme === "dark"
          ? "rgba(15,17,23,0.96)"
          : "rgba(245,246,250,0.96)",
      borderBottomLeftRadius: rMS(24),
      borderBottomRightRadius: rMS(24),
      paddingTop: Math.max(rV(20), insets.top + rV(10)),
      paddingBottom: rV(16),
      paddingHorizontal: rS(20),
      borderBottomWidth: 2,
      borderBottomColor: themeColors.tint + "40",
    },
    aiPredictionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(8),
    },
    aiPredictionTitle: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.tint,
    },
    aiPredictionText: {
      fontSize: rMS(14),
      color: themeColors.text,
      fontStyle: "italic",
      lineHeight: rMS(14) * 1.5,
    },
  });

  if (!visible) return null;

  return (
    <View style={styles.aiPrediction}>
      <View style={styles.aiPredictionTitleRow}>
        <Lightbulb
          size={22}
          color={themeColors.tint}
          style={{ marginRight: rS(6) }}
        />
        <Text style={styles.aiPredictionTitle}>The Prince's Wisdom</Text>
      </View>
      <Text style={styles.aiPredictionText}>
        "{wisdomPrefix}
        {predictionText}"
      </Text>
    </View>
  );
};

export default memo(PrinceWisdomBanner);
