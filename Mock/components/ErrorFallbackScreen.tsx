import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColorScheme } from "./useColorScheme";
import Colors from "../constants/Colors";
import { SIZES, rMS, rV, rS } from "../constants";

interface ErrorFallbackScreenProps {
  error?: Error | string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const ErrorFallbackScreen: React.FC<ErrorFallbackScreenProps> = ({
  error,
  onRetry,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const errorMessage =
    error instanceof Error ? error.message : error || "An unexpected error occurred";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(20),
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.xxxLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(10),
      textAlign: "center",
    },
    message: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      marginBottom: rV(30),
      textAlign: "center",
      paddingHorizontal: rS(20),
    },
    retryButton: {
      backgroundColor: themeColors.tint,
      paddingHorizontal: rS(30),
      paddingVertical: rV(15),
      borderRadius: rMS(10),
      minWidth: rS(150),
    },
    retryButtonText: {
      color: "white",
      fontSize: SIZES.large,
      fontWeight: "bold",
      textAlign: "center",
    },
    loadingContainer: {
      marginTop: rV(20),
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.retryButtonText}>Retry</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

