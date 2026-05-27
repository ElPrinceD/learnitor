import React, { memo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants/index.js";
import ErrorMessage from "../ErrorMessage";
import ScreenLoadingSpinner from "../ScreenLoadingSpinner";

interface Props {
  loadingText: string;
  error: string;
  onDismissError: () => void;
}

const GameLoadingShell: React.FC<Props> = ({
  loadingText,
  error,
  onDismissError,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    blob1: {
      position: "absolute",
      top: -rV(100),
      left: -rS(50),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      top: rV(300),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#6366F118",
    },
    loadingText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      marginTop: rV(16),
      fontWeight: "700",
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <ScreenLoadingSpinner style={{ flex: 0, paddingVertical: 0 }} />
      <Text style={styles.loadingText}>{loadingText}</Text>
      <ErrorMessage
        message={error}
        visible={!!error}
        onDismiss={onDismissError}
      />
    </View>
  );
};

export default memo(GameLoadingShell);
