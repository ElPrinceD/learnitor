import React, { SetStateAction, useState } from "react";
import { StyleSheet, Text, View, useColorScheme, Image } from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import VerificationButton from "../../components/VerificationButton";
import Animated, {
  ReduceMotion,
  StretchInY,
  StretchOutY,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

// import { GoogleSignin, User } from "@react-native-google-signin/google-signin";
// import { ios, googleSignIn, web } from "../../OAuth";
//import { twitterSignIn, twitterClientId } from "../../OAuth";
import { Alert } from "react-native";

// GoogleSignin.configure({
//   scopes: [
//     "https://www.googleapis.com/auth/userinfo.email", // Access the user's email
//     "https://www.googleapis.com/auth/userinfo.profile", // Access the user's public profile information
//     "openid", // Use OpenID Connect to associate the user with their Google info
//   ],
//   offlineAccess: true,
//   forceCodeForRefreshToken: true,
//   webClientId: web,
// });

const SignUp = () => {
  

  // const handleGoogleSignIn = async () => {
  //   try {
  //     const userI = await googleSignIn();
  //     if (userI) {
  //       // Display user data using an alert
  //       Alert.alert(
  //         "Google Sign-In Success",
  //         `Name: ${userI.data?.user.givenName}\nEmail: ${userI.data?.user.email} \nToken: ${userI.data?.idToken}`
  //       );
  //       setUserInfo(userI.data); // Set the complete user object
  //     } else {
  //       Alert.alert("No user data returned");
  //     }
  //   } catch (error) {
  //     Alert.alert("Google Sign-In Error", error.message);
  //   }
  // };

  const handleSignUpWithApple = () => {
    // Handle sign up with Apple ID
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
      paddingVertical: rV(3),
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
      bottom: rV(10),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textDecorationLine: "underline",
      color: themeColors.buttonBackground,
      marginLeft: rMS(8),
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Animated.View
        entering={StretchInY.delay(300)
          .randomDelay()
          .reduceMotion(ReduceMotion.Never)
          .withInitialValues({ transform: [{ scaleY: 0.5 }] })}
        exiting={StretchOutY.delay(300)
          .randomDelay()
          .reduceMotion(ReduceMotion.Never)
          .withInitialValues({ transform: [{ scaleY: 0.5 }] })}
        style={styles.container}
      >
        <Text style={styles.title}>
          Create a free account to discover your personalized learning path
        </Text>
        
        {status ? <Text>{status}</Text> : null}
        <View style={styles.dividerRow}>
          <Text style={styles.dividerText}>
            ---------------- or ----------------
          </Text>
        </View>
        <VerificationButton
          onPress={handleSignUpWithEmail}
          title="Continue with email"
        ></VerificationButton>
      </Animated.View>
      <View style={styles.bottomContainer}>
        <Text style={styles.existingText}>Existing User?</Text>
        <Text style={styles.loginText} onPress={handleNavigateToLogin}>
          Login
        </Text>
      </View>
    </View>
  );
};

export default SignUp;
