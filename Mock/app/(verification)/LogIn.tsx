import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text } from "../../components/Themed";
import { router, useGlobalSearchParams } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";

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
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.background,
    },
    headerText: {
      fontSize: SIZES.xxxLarge,
      fontWeight: "bold",
      color: themeColors.text,
    },
    inputContainer: {
      width: rS(270),
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
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",      
      color: themeColors.buttonBackground,
      marginLeft: rMS(8),
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

        <View style={styles.container}>
          <Typewriter
            text="Hello again!"
            delay={100}
            style={[styles.headerText, { marginBottom: rMS(150) }]}
            onComplete={() => setShowSecondText(true)}
          />
          

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
            <Text
              style={styles.forgotPasswordText}
              onPress={handleForgotPassword}
            >
              Forgot password?
            </Text>
          </View>

          <VerificationButton
            onPress={handleLogin}
            title={loading ? <ActivityIndicator color="white" /> : "Login"}
            disabled={loading}
          />
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.existingText}>Don't have an account?</Text>
          <Text style={styles.loginText} onPress={handleSignUp}>
            Register
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LogIn;
