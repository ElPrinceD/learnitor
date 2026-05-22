import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, useShadows } from "../../constants";

interface Props {
  step: 1 | 2 | 3;
}

const SignupStepIndicator: React.FC<Props> = ({ step }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    wrapper: {
      width: "100%",
      maxWidth: rS(320),
      alignSelf: "center",
      marginBottom: rV(16),
    },
    label: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginBottom: rV(10),
      textAlign: "center",
    },
    segments: {
      flexDirection: "row",
      gap: rS(8),
    },
    segment: {
      flex: 1,
      height: rV(4),
      borderRadius: rMS(2),
      backgroundColor: themeColors.border + "40",
    },
    segmentActive: {
      backgroundColor: themeColors.tint,
    },
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Step {step} of 3</Text>
      <View style={styles.segments}>
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={[styles.segment, n <= step && styles.segmentActive]}
          />
        ))}
      </View>
    </View>
  );
};

export default memo(SignupStepIndicator);
