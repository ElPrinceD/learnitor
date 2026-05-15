import React, { useState, useEffect, useCallback, memo } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import { X } from "lucide-react-native";
import { SIZES, rMS, rS } from "../constants";

// Function to convert technical error messages to user-friendly messages
const getUserFriendlyMessage = (technicalMessage: string): string => {
  const message = technicalMessage.toLowerCase();

  // Network and connection errors
  if (
    message.includes("network error") ||
    message.includes("connection failed")
  ) {
    return "Please check your internet connection and try again.";
  }

  if (message.includes("timeout") || message.includes("request timeout")) {
    return "The request is taking too long. Please try again.";
  }

  if (message.includes("fetch")) {
    return "Unable to connect to the server. Please check your connection.";
  }

  // HTTP status codes
  if (message.includes("400") || message.includes("bad request")) {
    return "There was an issue with your request. Please try again.";
  }

  if (message.includes("401") || message.includes("unauthorized")) {
    return "Please log in again to continue.";
  }

  if (message.includes("403") || message.includes("forbidden")) {
    return "You don't have permission to perform this action.";
  }

  if (message.includes("404") || message.includes("not found")) {
    return "The requested information could not be found.";
  }

  if (message.includes("500") || message.includes("internal server error")) {
    return "Something went wrong on our end. Please try again later.";
  }

  if (message.includes("502") || message.includes("bad gateway")) {
    return "The server is temporarily unavailable. Please try again later.";
  }

  if (message.includes("503") || message.includes("service unavailable")) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  // Authentication and authorization errors
  if (
    message.includes("token") &&
    (message.includes("expired") || message.includes("invalid"))
  ) {
    return "Your session has expired. Please log in again.";
  }

  if (message.includes("authentication") || message.includes("auth")) {
    return "Please log in to continue.";
  }

  // Database and data errors
  if (message.includes("database") || message.includes("db error")) {
    return "There was an issue accessing the data. Please try again.";
  }

  if (message.includes("constraint") || message.includes("duplicate")) {
    return "This information already exists. Please check and try again.";
  }

  // Validation errors
  if (message.includes("validation") || message.includes("invalid input")) {
    return "Please check your input and try again.";
  }

  if (message.includes("required") || message.includes("missing")) {
    return "Please fill in all required fields.";
  }

  // File and upload errors
  if (
    message.includes("file") &&
    (message.includes("too large") || message.includes("size"))
  ) {
    return "The file is too large. Please choose a smaller file.";
  }

  if (message.includes("upload") || message.includes("file upload")) {
    return "There was an issue uploading the file. Please try again.";
  }

  // Course and enrollment specific errors
  if (message.includes("enrollment") || message.includes("enroll")) {
    return "There was an issue with the enrollment process. Please try again.";
  }

  if (message.includes("course") && message.includes("not found")) {
    return "The course could not be found. Please check and try again.";
  }

  if (message.includes("topic") && message.includes("not found")) {
    return "The topic could not be found. Please check and try again.";
  }

  // Progress and tracking errors
  if (message.includes("progress") && message.includes("not found")) {
    return "Progress information is not available yet.";
  }

  // Generic fallbacks for common technical terms
  if (message.includes("error") && message.includes("code")) {
    return "Something went wrong. Please try again.";
  }

  if (message.includes("exception") || message.includes("unexpected")) {
    return "An unexpected error occurred. Please try again.";
  }

  if (message.includes("failed") && message.includes("request")) {
    return "The request failed. Please try again.";
  }

  // If no specific pattern matches, return the original message
  // but clean up common technical jargon
  return (
    technicalMessage
      .replace(/request failed with status code \d+/gi, "Request failed")
      .replace(/error: /gi, "")
      .replace(/failed to /gi, "Unable to ")
      .replace(/cannot /gi, "Unable to ")
      .replace(/unable to /gi, "Unable to ")
      .replace(/api\/.*?\/ /gi, "")
      .replace(/\.$/, "") + "."
  );
};

// Static styles
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

interface ErrorMessageProps {
  message: string | null;
  visible: boolean;
  duration?: number;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible,
  duration = 60000,
  onDismiss,
}) => {
  const [slideAnim] = useState(new Animated.Value(100)); // Initial position at the bottom
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  }, [onDismiss, slideAnim]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    } else {
      // Ensure slide out if visible becomes false
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      // Stop any ongoing animations
      slideAnim.stopAnimation();
    };
  }, [visible, duration, slideAnim, handleClose]);

  if (!visible || !message) {
    return null;
  }

  // Convert technical error message to user-friendly message
  const userFriendlyMessage = getUserFriendlyMessage(message);

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
        {userFriendlyMessage}
      </Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <X
          size={SIZES.xLarge}
          color={themeColors.errorText}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(ErrorMessage);
