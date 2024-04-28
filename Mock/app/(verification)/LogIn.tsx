import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/components/Themed";
import { router } from "expo-router";
// import KeyboardAvoidingWrapper from "../../components/KeyboardAvoidingWrapper";

const LogIn = () => {
  const colorScheme = useColorScheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // State to manage loading

  const handleSignUpWithApple = () => {
    // Set loading state to true
    // Handle sign up with Apple ID
    // After completion, setLoading(false);
  };

  const handleSignUpWithGoogle = () => {
    // Set loading state to true
    // Handle sign up with Google Account
    // After completion, setLoading(false);
  };

  const handleSignUpWithTwitter = () => {
    // Set loading state to true
    // Handle sign up with Twitter
    // After completion, setLoading(false);
  };

  const handleLogin = () => {
    setLoading(true); // Set loading state to true
    // Simulate API call
    setTimeout(() => {
      if (email === "yawopokugyamerah@gmail.com" || password === "12345678") {
        setError("Please enter email and password");
      } else if (email === "wrong" || password === "wrong") {
        setError("Email and/or password is incorrect");
      } else {
        router.navigate("(tabs)");
      }
      setLoading(false); // Set loading state to false after API call
    }, 2000); // Simulating API delay of 2 seconds
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
    // <KeyboardAvoidingWrapper>
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, "background") },
      ]}
    >
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
          disabled={loading} // Disable button when loading
        >
          {<Ionicons name="logo-apple" size={25} color={buttonTextColor} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithGoogle}
          disabled={loading} // Disable button when loading
        >
          {<Ionicons name="logo-google" size={25} color={buttonTextColor} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.twitterButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithTwitter}
          disabled={loading} // Disable button when loading
        >
          {<Ionicons name="logo-twitter" size={25} color={buttonTextColor} />}
        </TouchableOpacity>
      </View>
      <View style={styles.dividerRow}>
        <Text style={[styles.dividerText, { color: dividerTextColor }]}>
          ---------------- or ----------------
        </Text>
      </View>
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
          secureTextEntry={true}
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          styles.loginButton,
          {
            backgroundColor: colorScheme === "dark" ? "#333" : "#808080",
            borderColor: buttonBorderColor,
          },
        ]}
        onPress={handleLogin}
        disabled={loading} // Disable button when loading
      >
        {loading ? (
          <ActivityIndicator size="small" color={buttonTextColor} />
        ) : (
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Log in
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={[styles.forgotPasswordText, { color: dividerTextColor }]}>
          Forgot password?
        </Text>
      </TouchableOpacity>
      <View style={styles.bottomContainer}>
        <Text
          style={[styles.existingText, { color: useThemeColor({}, "text") }]}
        >
          No account yet?
        </Text>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text
            style={[styles.loginText, { color: useThemeColor({}, "text") }]}
          >
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    // </KeyboardAvoidingWrapper>
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
  dividerText: {
    fontSize: 16,
    fontWeight: "bold",
    opacity: 0.4,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    // borderWidth: 0.5,
    width: "100%",
    alignItems: "center",
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
});

export default LogIn;
