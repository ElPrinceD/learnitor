import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/Themed";
import { router, useGlobalSearchParams } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { LogIn as LogInIcon } from "lucide-react-native";

import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import { StatusBar } from "expo-status-bar";
import { Typewriter } from "../../components/TypewriterText";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const shadow = useShadows();

  const loginScale = useSharedValue(1);
  const loginAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginScale.value }],
  }));
  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

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
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
    blob1: {
      position: "absolute",
      top: -rV(80),
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
      backgroundColor: "#6366F118",
    },
    blob3: {
      position: "absolute",
      top: rV(300),
      right: -rS(30),
      width: rS(160),
      height: rS(160),
      borderRadius: rS(80),
      backgroundColor: "#10B98115",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rMS(16),
    },
    // Hero
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    headerText: {
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1,
      textAlign: "center",
    },
    heroSubtext: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      marginTop: rV(6),
      textAlign: "center",
      lineHeight: rMS(20),
    },
    // Form card — glassmorphic
    formCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      marginTop: rV(28),
      width: "100%",
      maxWidth: rS(320),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    inputContainer: {
      width: "100%",
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
      paddingBottom: rMS(20),
      paddingTop: rV(4),
    },
    forgotPasswordText: {
      fontSize: rMS(13),
      color: themeColors.tint,
      fontWeight: "700",
    },
    loginButton: {
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
    loginButtonDisabled: {
      opacity: 0.5,
    },
    loginButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
    bottomContainer: {
      position: "absolute",
      bottom: Math.max(rV(20), insets.bottom + rV(10)),
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    registerText: {
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
      marginBottom: rV(12),
      borderLeftWidth: 3,
      borderLeftColor: "#D22B2B",
      width: "100%",
    },
    errorText: {
      fontSize: rMS(12),
      color: "#D22B2B",
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={{ alignItems: "center" }}
          >
            <Typewriter
              text="Hello again!"
              delay={10}
              style={styles.headerText}
              onComplete={() => setShowSecondText(true)}
            />
            
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={styles.formCard}
          >
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

            <AnimatedTouchable
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
                loginAnimStyle,
              ]}
              onPress={handleLogin}
              onPressIn={() => onPressIn(loginScale)}
              onPressOut={() => onPressOut(loginScale)}
              activeOpacity={1}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <LogInIcon size={18} color="#fff" />
                  <Text style={styles.loginButtonText}>Login</Text>
                </>
              )}
            </AnimatedTouchable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomContainer}>
        <Text style={styles.existingText}>Don't have an account?</Text>
        <Text style={styles.registerText} onPress={handleSignUp}>
          Register
        </Text>
      </View>
    </View>
  );
};

export default LogIn;
