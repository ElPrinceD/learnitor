import React from "react";
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "../../constants/Colors";

import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";

const SignUp = () => {
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

  const handleNavigateToLogin = () => {
    router.navigate("LogIn");
  };

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(1),
      backgroundColor: themeColors.background,
    },

    title: {
      fontSize: SIZES.xLarge,
      color: themeColors.text,
      fontWeight: "bold",
      marginBottom: rMS(5),
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

    bottomContainer: {
      position: "absolute",
      bottom: rMS(5),
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    loginButton: {
      marginLeft: rMS(8),
    },
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textDecorationLine: "underline",
      color: themeColors.buttonBackground,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create a free account to discover your personalized learning path
      </Text>
      <View style={styles.buttonRow}>
        {/* Apple Sign Up */}
        <VerificationButton
          style={styles.threeButtons}
          onPress={handleSignUpWithApple}
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
          onPress={handleSignUpWithGoogle}
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
          onPress={handleSignUpWithTwitter}
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
      <VerificationButton
        onPress={handleSignUpWithEmail}
        title="Continue with email"
      ></VerificationButton>
      <View style={styles.bottomContainer}>
        <Text style={styles.existingText}>Existing User?</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleNavigateToLogin}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUp;
