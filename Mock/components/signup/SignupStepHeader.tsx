import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";

interface Props {
  title: string;
  subtitle: string;
}

const SignupStepHeader: React.FC<Props> = ({ title, subtitle }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    wrapper: {
      width: rS(280),
      alignSelf: "center",
      marginBottom: rV(28),
    },
    title: {
      fontSize: rMS(24),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.4,
      marginBottom: rV(8),
    },
    subtitle: {
      fontSize: rMS(13),
      fontWeight: "500",
      color: themeColors.textSecondary,
      lineHeight: rV(20),
    },
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

export default memo(SignupStepHeader);
