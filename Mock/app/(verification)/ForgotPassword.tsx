import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetCodeError, setResetCodeError] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleSendCode = () => {
    const lowerCaseEmail = email.toLowerCase();
    setLoading(true);

    axios
      .post(`${ApiUrl}/api/forgetpassword/`, { email: lowerCaseEmail })
      .then(() => {
        setLoading(false);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Email not found";
        setError(errorMessage);
        clearErrorsAfterTimeout();
      });
  };

  const clearErrorsAfterTimeout = () => {
    setTimeout(() => {
      setError("");
      setResetCodeError("");
    }, 8000); // Clear errors after 8 seconds
  };

  const CheckVerificationCode = () => {
    setLoading(true);

    axios
      .post(`${ApiUrl}/api/verify-code/`, {
        email,
        verification_code: resetCode,
      })
      .then(() => {
        setLoading(false);
        setResettingPassword(true);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Invalid reset code";
        setResetCodeError(errorMessage);
        clearErrorsAfterTimeout();
      });
  };

  const ConfirmNewPassword = () => {
    setLoading(true);

    axios
      .post(`${ApiUrl}/api/reset-password/`, {
        new_password: newPassword,
        verification_code: resetCode,
      })
      .then(() => {
        setLoading(false);
        router.navigate("LogIn");
        setResettingPassword(true);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Invalid Password";
        setResetCodeError(errorMessage);
        clearErrorsAfterTimeout();
      });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: rS(24),
      paddingTop: rV(60),
      paddingBottom: rV(40),
    },
    header: {
      alignItems: "center",
      marginBottom: rV(40),
    },
    iconContainer: {
      width: rS(80),
      height: rS(80),
      borderRadius: rS(40),
      backgroundColor: themeColors.tint + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: rV(24),
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(8),
    },
    subtitle: {
      fontSize: SIZES.large,
      color: themeColors.textSecondary,
      textAlign: "center",
      marginBottom: rV(16),
    },
    description: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: rS(20),
    },
    formContainer: {
      marginBottom: rV(32),
    },
    inputContainer: {
      marginBottom: rV(20),
    },
    errorContainer: {
      backgroundColor: "#D22B2B" + "15",
      padding: rS(12),
      borderRadius: rMS(8),
      marginBottom: rV(16),
      borderLeftWidth: 4,
      borderLeftColor: "#D22B2B",
    },
    errorText: {
      color: "#D22B2B",
      fontSize: SIZES.small,
      fontWeight: "500",
    },
    successContainer: {
      backgroundColor: themeColors.tint + "15",
      padding: rS(12),
      borderRadius: rMS(8),
      marginBottom: rV(16),
      borderLeftWidth: 4,
      borderLeftColor: themeColors.tint,
    },
    successText: {
      color: themeColors.tint,
      fontSize: SIZES.small,
      fontWeight: "500",
    },
    buttonContainer: {
      marginTop: rV(24),
      alignItems: "center",
    },
    supportContainer: {
      alignItems: "center",
      marginTop: rV(40),
      paddingHorizontal: rS(20),
    },
    supportText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    supportLink: {
      color: themeColors.tint,
      fontWeight: "600",
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar hidden={true} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={rS(32)}
              color={themeColors.tint}
            />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries, we'll help you reset it
          </Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a verification code to
            reset your password.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <AnimatedTextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
            />
          </View>

          {/* Error Messages */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Messages */}
          {sent && !resettingPassword ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Check your email for a password reset code
              </Text>
            </View>
          ) : null}

          {/* Reset Code Input */}
          {sent ? (
            <View style={styles.inputContainer}>
              <AnimatedTextInput
                label="Reset Code"
                value={resetCode}
                onChangeText={setResetCode}
                placeholder="Enter reset code"
              />
            </View>
          ) : null}

          {/* Reset Code Error */}
          {resetCodeError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{resetCodeError}</Text>
            </View>
          ) : null}

          {/* New Password Input */}
          {resettingPassword ? (
            <View style={styles.inputContainer}>
              <AnimatedTextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!sent ? (
              <VerificationButton
                onPress={handleSendCode}
                title={
                  loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    "Send Reset Code"
                  )
                }
                disabled={loading || !email.trim()}
              />
            ) : !resettingPassword ? (
              <VerificationButton
                onPress={CheckVerificationCode}
                title={
                  loading ? <ActivityIndicator color="white" /> : "Verify Code"
                }
                disabled={loading || !resetCode.trim()}
              />
            ) : (
              <VerificationButton
                onPress={ConfirmNewPassword}
                title={
                  loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    "Set New Password"
                  )
                }
                disabled={loading || !newPassword.trim()}
              />
            )}
          </View>
        </View>

        {/* Support */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            Having trouble? Contact us at{" "}
            <Text
              onPress={() => Linking.openURL("mailto:support@learnitor.org")}
              style={styles.supportLink}
            >
              support@learnitor.org
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
