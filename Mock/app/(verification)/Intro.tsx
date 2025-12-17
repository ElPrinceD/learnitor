import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  useColorScheme,
  Button,
} from "react-native";
import { router } from "expo-router";
import { SIZES, rMS, rS, rV } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";

const Intro = () => {
  console.log("[Intro] Component starting to render");
  
  try {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? "light"];
    
    console.log("[Intro] Component rendering", { colorScheme, hasThemeColors: !!themeColors });

  const handleSignUp = () => {
    router.navigate("ContinueWithEmail");
  };

  const handleLogIn = () => {
    router.navigate("LogIn");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: themeColors.background,
    },
    image: {
      width: rS(280),
      height: rV(250),
      resizeMode: "contain",
    },
    textContainer: {
      alignItems: "center",
    },
    title: {
      color: themeColors.text,
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
      textAlign: "center",
    },
    subtitle: {
      color: themeColors.textSecondary,
      fontSize: SIZES.medium,
      textAlign: "center",
      marginTop: rV(1),
      opacity: 0.6,
    },
    buttonContainer: {
      marginTop: 20,
      alignItems: "center",
    },
    button: {
      marginBottom: rS(2),
    },

    loginLink: {
      marginTop: rV(2),
      backgroundColor: "transparent",
      color: themeColors.text,
    },
    loginText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textDecorationLine: "underline",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <Image
        source={require("../../assets/images/homepage.png")}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>The Best Educational Guide</Text>
        <Text style={styles.subtitle}>
          Make learning easier by following our study guides curated uniquely
          for your field of choice.
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <VerificationButton
          style={styles.button}
          onPress={handleSignUp}
          title="Create an account"
        ></VerificationButton>
        <VerificationButton
          style={styles.loginLink}
          onPress={handleLogIn}
          title="Log in"
        ></VerificationButton>
      </View>
    </View>
  );
  } catch (error) {
    console.error("[Intro] Error rendering Intro component:", error);
    // Return a fallback UI
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <Text style={{ fontSize: 16, color: "#000000" }}>Error loading screen</Text>
      </View>
    );
  }
};

export default Intro;
