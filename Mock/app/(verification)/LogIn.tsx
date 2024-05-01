import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/components/Themed";
import { router, useNavigation } from "expo-router";
import axios from "axios";
import { RootParamList } from "../../components/types";

const LogIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
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
      .post("http://192.168.83.198:8000/api/login/", {
        email: email,
        password: password,
      })
      .then((response) => {
        setLoading(false);
        setUser(response.data.user);
        // Handle successful response from backend
        console.log(response.data.user);

        navigation.navigate("(tabs)", {
          firstName: response.data.user.first_name,
        });
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
    router.navigate("SignUp");
  };

  const buttonTextColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "text"
  );

  const themeColor = useThemeColor(
    {
      dark: "#0063cd",
      light: "#0063cd",
    },
    "background"
  );

  const buttonBackgroundColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
  );
  const buttonBorderColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "tint"
  );
  const dividerTextColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "text"
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, "background") },
      ]}
    >
      <Image
        source={require("../../assets/images/Login-rafiki.png")} // Replace with your image path
        style={styles.image}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
              color: buttonTextColor,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={buttonTextColor}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                borderColor: buttonBorderColor,
                color: buttonTextColor,
              },
            ]}
            placeholder="Password"
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
      <TouchableOpacity
        style={[
          styles.button,
          styles.loginButton,
          {
            backgroundColor: themeColor,
            borderColor: buttonBorderColor,
          },
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.buttonText, { color: "white" }]}>Log in</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text
          style={[
            styles.forgotPasswordText,
            { color: themeColor, textDecorationLine: "none" },
          ]}
        >
          Forgot password?
        </Text>
      </TouchableOpacity>
      <View style={styles.dividerRow}>
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
      </View>
      <View style={styles.bottomContainer}>
        <Text style={[styles.existingText, { color: dividerTextColor }]}>
          No account yet?
        </Text>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text
            style={[
              styles.loginText,
              { color: themeColor, textDecorationLine: "none" },
            ]}
          >
            Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    color: "#000",
  },
  toggleIcon: {
    position: "absolute",
    right: 10,
    top: 20,
  },
  dividerText: {
    fontSize: 16,
    fontWeight: "bold",
    opacity: 0.4,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: 300,
  },
  image: {
    width: 400,
    height: 350,
    resizeMode: "contain",
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 8,
  },

  bottomContainer: {
    position: "absolute",
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  existingText: {
    fontSize: 16,
    fontWeight: "bold",
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
  passwordContainer: {
    position: "relative",
  },
});

export default LogIn;
