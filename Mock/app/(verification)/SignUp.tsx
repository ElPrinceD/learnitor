import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/components/Themed";
import { router } from "expo-router";

const SignUp = () => {
  // Define navigation
  const handleSignUpWithApple = () => {
    // Handle sign up with Apple ID
  };

  const handleSignUpWithGoogle = () => {
    // Handle sign up with Google Account
  };

  const handleSignUpWithTwitter = () => {
    // Handle sign up with Twitter
  };

  const handleSignUpWithEmail = () => {
    router.navigate("ContinueWithEmail");
  };

  // Fetch theme colors
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

  // Function to navigate to the login page
  const handleNavigateToLogin = () => {
    router.navigate("LogIn"); // Navigate to the Login screen
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, "background") },
      ]}
    >
      <Text style={[styles.title, { color: useThemeColor({}, "text") }]}>
        Create a free account to discover your personalized learning path
      </Text>
      <View style={styles.buttonRow}>
        {/* Apple Sign Up */}
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
        >
          <Ionicons name="logo-apple" size={25} color={buttonTextColor} />
        </TouchableOpacity>

        {/* Google Sign Up */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithGoogle}
        >
          <Ionicons name="logo-google" size={25} color={buttonTextColor} />
        </TouchableOpacity>

        {/* Twitter Sign Up */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.twitterButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithTwitter}
        >
          <Ionicons name="logo-twitter" size={25} color={buttonTextColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <Text style={[styles.dividerText, { color: dividerTextColor }]}>
          ---------------- or ----------------
        </Text>
      </View>

      {/* Email Sign Up */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.emailButton,
          {
            backgroundColor: buttonBackgroundColor,
            borderColor: buttonBorderColor,
          },
        ]}
        onPress={handleSignUpWithEmail}
      >
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>
          Continue with email
        </Text>
      </TouchableOpacity>

      {/* Existing User? and Log in */}
      <View style={styles.bottomContainer}>
        <Text
          style={[styles.existingText, { color: useThemeColor({}, "text") }]}
        >
          Existing User?
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleNavigateToLogin}
        >
          <Text
            style={[styles.loginText, { color: useThemeColor({}, "text") }]}
          >
            Log in
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
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
    marginRight: 8,
    borderRadius: 20,
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
  emailButton: {
    borderColor: "buttonBorder",
    borderWidth: 2,
    width: 350,
  },
  dividerText: {
    fontSize: 16,
    fontWeight: "bold",
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
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
  loginButton: {
    marginLeft: 8,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default SignUp; // Export the component
