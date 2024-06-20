import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text } from "../../components/Themed";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { useGlobalSearchParams } from "expo-router";
import { useAuth } from "../../components/AuthContext"; // Adjust the path
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import Animated, {
  ReduceMotion,
  StretchInY,
  StretchOutY,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const LogIn = () => {
  const { login } = useAuth(); // Accessing login function from AuthProvider
  const params = useGlobalSearchParams();
  const registeredEmail = typeof params.email === "string" ? params.email : "";
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const themeColors = Colors[colorScheme ?? "light"];

  const handleLogInWithApple = () => {
    // Handle sign up with Apple ID
  };

  const handleLogInWithGoogle = () => {
    // Handle sign up with Google Account
  };

  const handleLogInWithTwitter = () => {
    // Handle sign up with Twitter
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
        login(response.data, response.data.token); // Logging in user with token
        router.replace({ pathname: "(tabs)" });
      })
      .catch((error) => {
        setLoading(false);
        setError("Email and/or password is incorrect");
      });
  };

  const handleForgotPassword = () => {
    router.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    router.navigate("SignUp");
  };
  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.background,
    },

    buttonRow: {
      flexDirection: "row",
      marginBottom: rMS(5),
      gap: rMS(5),
    },
    threeButtons: {
      backgroundColor: "transparent",
      borderColor: themeColors.text,
      padding: rMS(16),
      borderRadius: 10,
      borderWidth: 1,
      width: rS(100),
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rMS(5),
    },
    dividerText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.medium,
      fontWeight: "bold",
      opacity: 0.6,
    },

    inputContainer: {
      width: rS(300),
    },
    inputWrapper: {
      marginBottom: rMS(16),
    },
    label: {
      position: "absolute",
      top: -8,
      left: 17,
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      zIndex: 1,
      fontSize: 16,
      color: "#515050",
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 10,
      padding: rMS(16),
      marginBottom: rMS(16),
      color: themeColors.text,
    },

    forgotPasswordContainer: {
      alignSelf: "flex-end",
      flexDirection: "row",
      paddingBottom: rMS(45),
    },
    forgotPasswordText: {
      fontSize: SIZES.medium,
      color: themeColors.selectedText,
      fontWeight: "bold",
    },
    bottomContainer: {
      bottom: rV(10),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    signupButton: {
      marginLeft: rMS(8),
    },
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textDecorationLine: "underline",
      color: themeColors.buttonBackground,
    },
    errorMessage: {
      alignSelf: "flex-start",
      fontSize: SIZES.medium,
      color: "#D22B2B",
    },
  });

  return (
    <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
      <View style={styles.container}>
        <StatusBar hidden={true} />

        <Animated.View
          entering={StretchInY.delay(200)
            .randomDelay()
            .reduceMotion(ReduceMotion.Never)
            .withInitialValues({ transform: [{ scaleY: 0.5 }] })}
          exiting={StretchOutY.delay(200)
            .randomDelay()
            .reduceMotion(ReduceMotion.Never)
            .withInitialValues({ transform: [{ scaleY: 0.1 }] })}
          style={styles.container}
        >
          <View style={styles.buttonRow}>
            {/* Apple Sign Up */}
            <VerificationButton
              style={styles.threeButtons}
              onPress={handleLogInWithApple}
            >
              <Text>
                <Ionicons
                  name="logo-apple"
                  size={SIZES.xLarge}
                  color={themeColors.text}
                />
              </Text>
            </VerificationButton>

            {/* Google Sign Up */}

            <VerificationButton
              style={styles.threeButtons}
              onPress={handleLogInWithGoogle}
            >
              <Text>
                <Ionicons
                  name="logo-google"
                  size={SIZES.xLarge}
                  color={themeColors.text}
                />
              </Text>
            </VerificationButton>

            {/* Twitter Sign Up */}

            <VerificationButton
              style={styles.threeButtons}
              onPress={handleLogInWithTwitter}
            >
              <Text>
                <FontAwesome6
                  name="x-twitter"
                  size={SIZES.xLarge}
                  color={themeColors.text}
                />
              </Text>
            </VerificationButton>
          </View>
          <View style={styles.dividerRow}>
            <Text style={styles.dividerText}>
              ---------------- or ----------------
            </Text>
          </View>

          <AnimatedTextInput
            label="Email"
            value={email}
            onChangeText={(text) => setEmail(text)}
            placeholderTextColor={themeColors.textSecondary}
            style={styles.inputContainer}
          />

          <AnimatedTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={themeColors.textSecondary}
            secureTextEntry={!showPassword}
            showToggleIcon={true}
            style={styles.inputContainer}
          />

          {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <VerificationButton
            onPress={handleLogin}
            title={loading ? <ActivityIndicator color="white" /> : "Login"}
            disabled={loading}
          />
        </Animated.View>

        <View style={styles.bottomContainer}>
          <Text style={styles.existingText}>Don't have an account?</Text>
          <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
            <Text style={styles.loginText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LogIn;
