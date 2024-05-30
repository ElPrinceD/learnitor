import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Text } from "../../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "../../components/Themed";
import { router, useNavigation } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { RootParamList } from "../../components/types";
import { useGlobalSearchParams } from "expo-router";
import { useAuth } from "../../components/AuthContext"; // Adjust the path

const LogIn = () => {
  const { login } = useAuth(); // Accessing login function from AuthProvider
  const params = useGlobalSearchParams();
  const registeredEmail = params.email;
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<RootParamList>();

  const handleSignUpWithApple = () => {
    // Handle sign up with Apple ID
  };

  const handleSignUpWithGoogle = () => {
    // Handle sign up with Google Account
  };

  const handleSignUpWithTwitter = () => {
    // Handle sign up with Twitter
  };

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
        // Handle successful response from backend
        login(response.data, response.data.token); // Logging in user with token

        router.replace({ pathname: "(tabs)" });
        console.log(response.data.user);
      })
      .catch((error) => {
        setLoading(false);
        // Handle error
        console.error(error);
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

  const themeColor = useThemeColor(
    {
      dark: "#9a580d",
      light: "#9a580d",
    },
    "background"
  );

  const buttonTextColor = useThemeColor(
    { light: "#b9b9b9", dark: "#fff" },
    "text"
  );
  const buttonBackgroundColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
  );

  const dividerTextColor = useThemeColor(
    { light: "#292929", dark: "#fff" },
    "text"
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#ffffff"]} style={styles.container}>
      <Text style={[styles.header, { color: buttonTextColor }]}>Sign in</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,

                color: "#4d4c4c",
              },
            ]}
            placeholder="Myemail@learnitor.com"
            placeholderTextColor={buttonTextColor}
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                color: "#4d4c4c",
              },
            ]}
            placeholder="*************"
            placeholderTextColor={buttonTextColor}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <TouchableOpacity
            onPress={toggleShowPassword}
            style={styles.toggleIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color={colorScheme === "dark" ? "#fff" : "gray"}
            />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      </View>
      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text
            style={[styles.forgotPasswordText, { textDecorationLine: "none" }]}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        <LinearGradient
          colors={["#c17319", "#9a580d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.loginButton]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, { color: "white" }]}>Login</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <Text style={[styles.existingText, { color: dividerTextColor }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text
            style={[
              styles.loginText,
              { color: "#9a580d", textDecorationLine: "none" },
            ]}
          >
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* <View style={styles.dividerRow}>
        <Text style={[styles.dividerText, { color: dividerTextColor }]}>
          ---------------------OR----------------------
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.appleButton,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
            },
          ]}
          onPress={handleSignUpWithApple}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={25} color={buttonTextColor} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithGoogle}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={25} color={buttonTextColor} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.twitterButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithTwitter}
          disabled={loading}
        >
          <Ionicons name="logo-twitter" size={25} color={buttonTextColor} />
        </TouchableOpacity>
      </View> */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "normal",
    position: "absolute",
    top: 70,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  label: {
    position: "absolute",
    top: -8,
    left: 17,
    backgroundColor: "white", // Make the label background transparent
    paddingHorizontal: 8,
    zIndex: 1,
    fontSize: 16,
    color: "#515050",
    fontWeight: "light",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdbbb9",
    borderRadius: 12.5,
    padding: 16,
    marginBottom: 25,
    color: "#000",
    height: 65,
    position: "relative",
    zIndex: 0,
  },
  passwordContainer: {
    position: "relative",
  },
  toggleIcon: {
    position: "absolute",
    right: 10,
    top: 20,
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 16,
    paddingTop: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerText: {
    fontSize: 16,
    fontWeight: "bold",
    opacity: 0.4,
    marginTop: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    marginRight: 9,
  },
  appleButton: {
    borderWidth: 1,
    width: 120,
  },
  googleButton: {
    borderWidth: 1,
    width: 120,
  },
  twitterButton: {
    borderWidth: 1,
    width: 120,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loginButton: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 1,
    width: 350,
  },
  image: {
    width: 400,
    height: 350,
    resizeMode: "contain",
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginTop: -50,

    paddingBottom: 50,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: "#9a580d",
    fontWeight: "bold",
  },
  bottomContainer: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  existingText: {
    fontSize: 16,
    fontWeight: "light",
  },
  signupButton: {
    marginLeft: 8,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorMessage: {
    fontSize: 16,
    color: "red",
    marginBottom: 16,
  },
});

export default LogIn;
