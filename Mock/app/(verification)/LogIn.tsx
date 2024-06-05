import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text } from "../../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "../../components/Themed";
import { router, useNavigation } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { useGlobalSearchParams } from "expo-router";
import { useAuth } from "../../components/AuthContext"; // Adjust the path
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import AnimatedTextInput from "../../components/AnimatedTextInput";

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

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please enter email and/or password");
      return;
    }

    setLoading(true);
    axios
      .post(`${ApiUrl}:8000/api/login/`, {
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
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
      padding: rMS(16),
      backgroundColor: themeColors.background,
    },

    inputContainer: {
      width: rS(320),
      marginBottom: rMS(16),
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
    toggleIcon: {
      position: "absolute",
      right: rMS(10),
      top: rMS(17),
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
      position: "absolute",
      bottom: rMS(5),
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
      fontSize: SIZES.medium,
      color: "#D22B2B",
    },
  });

  return (
    <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
      <View style={styles.container}>
        <AnimatedTextInput
          label="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          placeholderTextColor={themeColors.textSecondary}
        />

        <AnimatedTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={themeColors.textSecondary}
          secureTextEntry={!showPassword}
          showToggleIcon={true}
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
