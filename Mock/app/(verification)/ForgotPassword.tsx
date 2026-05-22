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
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import { StatusBar } from "expo-status-bar";
import { Lock, Send, ShieldCheck, KeyRound } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const shadow = useShadows();

  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

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

  // Choose icon based on current stage
  const currentIcon = resettingPassword
    ? <KeyRound size={rS(28)} color={themeColors.tint} />
    : sent
      ? <ShieldCheck size={rS(28)} color={themeColors.tint} />
      : <Lock size={rS(28)} color={themeColors.tint} />;

  const currentTitle = resettingPassword
    ? "Set New Password"
    : sent
      ? "Verify Code"
      : "Forgot Password?";

  const currentLabel = resettingPassword
    ? "RESET"
    : sent
      ? "VERIFY"
      : "RECOVER";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
    blob1: {
      position: "absolute",
      top: -rV(70),
      right: -rS(50),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(80),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#F9731618",
    },
    blob3: {
      position: "absolute",
      top: rV(320),
      left: -rS(40),
      width: rS(160),
      height: rS(160),
      borderRadius: rS(80),
      backgroundColor: "#8B5CF615",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(24),
      paddingBottom: rV(60),
    },
    // Hero
    heroSection: {
      alignItems: "center",
      marginBottom: rV(8),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(10),
    },
    iconCircle: {
      width: rMS(64),
      height: rMS(64),
      borderRadius: rMS(32),
      backgroundColor: themeColors.tint + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: rV(16),
    },
    title: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(8),
      lineHeight: rMS(20),
      paddingHorizontal: rS(16),
    },
    // Form card — glassmorphic
    formCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      marginTop: rV(24),
      width: "100%",
      maxWidth: rS(320),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    inputContainer: {
      marginBottom: rV(12),
    },
    errorContainer: {
      backgroundColor: "#D22B2B" + "12",
      paddingVertical: rV(10),
      paddingHorizontal: rS(12),
      borderRadius: rMS(16),
      marginBottom: rV(12),
      borderLeftWidth: 3,
      borderLeftColor: "#D22B2B",
    },
    errorText: {
      color: "#D22B2B",
      fontSize: rMS(12),
      fontWeight: "600",
    },
    successContainer: {
      backgroundColor: themeColors.tint + "12",
      paddingVertical: rV(10),
      paddingHorizontal: rS(12),
      borderRadius: rMS(16),
      marginBottom: rV(12),
      borderLeftWidth: 3,
      borderLeftColor: themeColors.tint,
    },
    successText: {
      color: themeColors.tint,
      fontSize: rMS(12),
      fontWeight: "600",
    },
    primaryButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: rS(8),
      ...shadow.small,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
    supportContainer: {
      alignItems: "center",
      marginTop: rV(32),
      paddingHorizontal: rS(20),
    },
    supportText: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: rMS(20),
    },
    supportLink: {
      color: themeColors.tint,
      fontWeight: "700",
    },
  });

  const isButtonDisabled = loading || (
    !sent
      ? !email.trim()
      : !resettingPassword
        ? !resetCode.trim()
        : !newPassword.trim()
  );

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.heroSection}
          >
            <Text style={styles.heroLabel}>{currentLabel}</Text>
            <View style={styles.iconCircle}>
              {currentIcon}
            </View>
            <Text style={styles.title}>{currentTitle}</Text>
            <Text style={styles.subtitle}>
              {resettingPassword
                ? "Choose a strong password to secure your account."
                : sent
                  ? "Enter the code we sent to your email."
                  : "Enter your email address and we'll send you a verification code to reset your password."}
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={styles.formCard}
          >
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <AnimatedTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder=""
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

            {/* Button */}
            <AnimatedTouchable
              style={[
                styles.primaryButton,
                isButtonDisabled && styles.primaryButtonDisabled,
                btnAnimStyle,
              ]}
              onPress={
                !sent
                  ? handleSendCode
                  : !resettingPassword
                    ? CheckVerificationCode
                    : ConfirmNewPassword
              }
              onPressIn={() => onPressIn(btnScale)}
              onPressOut={() => onPressOut(btnScale)}
              activeOpacity={1}
              disabled={isButtonDisabled}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>
                    {!sent
                      ? "Send Reset Code"
                      : !resettingPassword
                        ? "Verify Code"
                        : "Set New Password"}
                  </Text>
                </>
              )}
            </AnimatedTouchable>
          </Animated.View>

          {/* Support */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(500)}
            style={styles.supportContainer}
          >
            <Text style={styles.supportText}>
              Having trouble? Contact us at{" "}
              <Text
                onPress={() => Linking.openURL("mailto:support@elevay.online")}
                style={styles.supportLink}
              >
                support@elevay.online
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPassword;
