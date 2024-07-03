import React, { useState, useEffect } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, rMS, rS } from "../constants";

const ErrorMessage = ({ message, visible, duration = 30000, onDismiss }) => {
  const [slideAnim] = useState(new Animated.Value(100)); // Initial position at the bottom
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (visible) {
      // Slide in from the bottom
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Automatically dismiss after a few seconds
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    // Slide out to the bottom
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: rMS(16),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    message: {
      flex: 1,
      fontSize: SIZES.large,
    },
    closeButton: {
      marginLeft: rS(16),
      padding: rMS(8),
    },
    closeButtonText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: themeColors.errorBackground,
        },
      ]}
    >
      <Text style={[styles.message, { color: themeColors.errorText }]}>
        {message}
      </Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons
          name="close"
          size={SIZES.xLarge}
          style={styles.closeButtonText}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ErrorMessage;
