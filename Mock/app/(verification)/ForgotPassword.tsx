import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Linking,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import Animated, {
  ReduceMotion,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

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
      .catch(() => {
        setLoading(false);
        setError("Email not found");
        clearErrorsAfterTimeout();
      });
  };

  const clearErrorsAfterTimeout = () => {
    setTimeout(() => {
      setError("");
      setResetCodeError("");
    }, 5000); // Clear errors after 5 seconds
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
      .catch(() => {
        setLoading(false);
        setResetCodeError("Invalid reset code");
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
      .catch(() => {
        setLoading(false);
        setResetCodeError("Invalid Password");
        clearErrorsAfterTimeout();
      });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: rMS(20),
      alignItems: "center",
      padding: rMS(16),
      backgroundColor: themeColors.background,
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rMS(16),
      color: themeColors.text,
      textAlign: "center",
    },
    description: {
      fontSize: SIZES.medium,
      marginBottom: rMS(16),
      textAlign: "center",
      color: themeColors.text,
    },
    input: {
      borderWidth: 1,
      padding: rMS(16),
      width: rS(320),
      marginBottom: rMS(16),
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 1,
      borderColor: themeColors.border,
      color: themeColors.text,
    },
    errorMessage: {
      fontSize: SIZES.medium,
      marginBottom: rMS(16),
      color: "#D22B2B",
    },
    sentMessage: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      marginBottom: rMS(16),
      marginTop: rMS(16),
      color: themeColors.text,
    },
    support: {
      fontSize: SIZES.medium,
      bottom: rV(10),
      textAlign: "center",
      color: themeColors.text,
    },
    supportLink: {
      fontSize: SIZES.medium,
      textDecorationLine: "underline",
      color: themeColors.buttonBackground,
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar hidden={true} />

      <Animated.View
        entering={SlideInUp.delay(300)
          .randomDelay()
          .reduceMotion(ReduceMotion.Never)
          .withInitialValues({ transform: [{ scaleY: 0.5 }] })}
        exiting={SlideOutUp.delay(300)
          .randomDelay()
          .reduceMotion(ReduceMotion.Never)
          .withInitialValues({ transform: [{ scaleY: 0.5 }] })}
        style={styles.container}
      >
        <Text style={[styles.title, { marginBottom: -rMS(12) }]}>
          Forgot your password?
        </Text>
        <Text style={[styles.title, { fontSize: 20, marginTop: rMS(10) }]}>
          Don't Worry!
        </Text>
        <Text style={styles.description}>
          Enter your email and we'll send you a code to reset your password.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          placeholderTextColor={themeColors.textSecondary}
        />
        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
        {sent ? (
          <Animated.Text style={styles.sentMessage}>
            Check your email for a password reset code
          </Animated.Text>
        ) : (
          <VerificationButton
            onPress={handleSendCode}
            title={loading ? <ActivityIndicator color="white" /> : "Send code"}
            disabled={loading}
          />
        )}
        {sent ? (
          <TextInput
            style={styles.input}
            placeholder="Reset code"
            value={resetCode}
            onChangeText={(text) => setResetCode(text)}
            placeholderTextColor={themeColors.textSecondary}
          />
        ) : null}
        {resetCodeError ? (
          <Text style={styles.errorMessage}>{resetCodeError}</Text>
        ) : null}
        {sent ? (
          <VerificationButton
            onPress={CheckVerificationCode}
            title={
              loading ? <ActivityIndicator color="white" /> : "Reset Password"
            }
            disabled={loading}
          />
        ) : null}
        {resettingPassword ? (
          <Text style={styles.sentMessage}>Enter new password</Text>
        ) : null}
        {resettingPassword && sent ? (
          <TextInput
            style={styles.input}
            placeholder="New password"
            value={newPassword}
            onChangeText={(text) => setNewPassword(text)}
            secureTextEntry
            placeholderTextColor={themeColors.textSecondary}
          />
        ) : null}
        {resettingPassword ? (
          <VerificationButton
            onPress={ConfirmNewPassword}
            title={
              loading ? <ActivityIndicator color="white" /> : "Set New Password"
            }
            disabled={loading}
          />
        ) : null}
      </Animated.View>
      <Text style={styles.support}>
        If you have trouble resetting your password, contact us at{" "}
        <Text
          onPress={() => Linking.openURL("mailto:support@learnitor.org")}
          style={styles.supportLink}
        >
          support@learnitor.org
        </Text>
      </Text>
    </ScrollView>
  );
};

export default ForgotPassword;
