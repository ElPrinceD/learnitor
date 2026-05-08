import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/Themed";
import { router, useGlobalSearchParams } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import { StatusBar } from "expo-status-bar";
import { Typewriter } from "../../components/TypewriterText";

const LogIn = () => {
  const { login } = useAuth();
  const params = useGlobalSearchParams();
  const registeredEmail = typeof params.email === "string" ? params.email : "";
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const themeColors = Colors[colorScheme ?? "light"];
  const [showSecondText, setShowSecondText] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please enter email and/or password");
      return;
    }

    setLoading(true);
    axios
      .post(`${ApiUrl}/api/login/`, {
        email: email,
        password: password,
      })
      .then((response) => {
        setLoading(false);
        login(response.data, response.data.token);
        router.replace({ pathname: "/home" });
      })
      .catch(() => {
        setLoading(false);
        setError("Email and/or password is incorrect");
      });
  };

  const handleForgotPassword = () => {
    router.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    router.navigate("ContinueWithEmail");
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      backgroundColor: themeColors.background,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(70),
      right: -rS(50),
      width: rS(220),
      height: rS(220),
      borderRadius: rS(110),
      backgroundColor: themeColors.tint + "12",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(80),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: "#6366F112",
    },
    headerText: {
      fontSize: rMS(32),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.5,
    },
    inputContainer: {
      width: rS(280),
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
      flexDirection: "row",
      paddingBottom: rMS(40),
    },
    forgotPasswordText: {
      fontSize: rMS(13),
      color: themeColors.tint,
      fontWeight: "700",
    },
    bottomContainer: {
      bottom: Math.max(rV(15), insets.bottom + rV(5)),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    loginText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      marginLeft: rMS(4),
    },
    errorContainer: {
      backgroundColor: "#D22B2B" + "12",
      paddingVertical: rV(10),
      paddingHorizontal: rMS(16),
      borderRadius: rMS(16),
      marginBottom: rV(8),
      borderLeftWidth: 3,
      borderLeftColor: "#D22B2B",
      width: rS(280),
    },
    errorText: {
      fontSize: rMS(12),
      color: "#D22B2B",
      fontWeight: "600",
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
        <View style={styles.container}>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <View style={styles.container}>
            <Typewriter
              text="Hello again!"
              delay={100}
              style={[styles.headerText, { marginBottom: rMS(120) }]}
              onComplete={() => setShowSecondText(true)}
            />

            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <AnimatedTextInput
                label="Email"
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholderTextColor={themeColors.textSecondary}
                style={styles.inputContainer}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <AnimatedTextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={themeColors.textSecondary}
                secureTextEntry={!showPassword}
                showToggleIcon={true}
                style={styles.inputContainer}
              />
            </Animated.View>

            {error ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <View style={styles.forgotPasswordContainer}>
                <Text
                  style={styles.forgotPasswordText}
                  onPress={handleForgotPassword}
                >
                  Forgot password?
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <VerificationButton
                onPress={handleLogin}
                title={loading ? <ActivityIndicator color="white" /> : "Login"}
                disabled={loading}
              />
            </Animated.View>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={styles.existingText}>Don't have an account?</Text>
            <Text style={styles.loginText} onPress={handleSignUp}>
              Register
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
};

export default LogIn;
