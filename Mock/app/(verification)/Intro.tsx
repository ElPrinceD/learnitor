import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SIZES, rMS, rS, rV } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import { StatusBar } from "expo-status-bar";

const Intro = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

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
      backgroundColor: themeColors.background,
      padding: rMS(16),
    },
    blob1: {
      position: "absolute",
      top: -rV(80),
      left: -rS(60),
      width: rS(240),
      height: rS(240),
      borderRadius: rS(120),
      backgroundColor: themeColors.tint + "15",
    },
    blob2: {
      position: "absolute",
      bottom: rV(80),
      right: -rS(80),
      width: rS(280),
      height: rS(280),
      borderRadius: rS(140),
      backgroundColor: "#8B5CF615",
    },
    image: {
      width: rS(260),
      height: rV(230),
      resizeMode: "contain",
    },
    textContainer: {
      alignItems: "center",
      marginTop: rV(8),
    },
    title: {
      color: themeColors.text,
      fontSize: rMS(28),
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      color: themeColors.textSecondary,
      fontSize: rMS(14),
      textAlign: "center",
      marginTop: rV(10),
      lineHeight: rMS(20),
      paddingHorizontal: rS(20),
    },
    buttonContainer: {
      marginTop: rV(32),
      alignItems: "center",
      gap: rV(12),
    },
    loginLink: {
      backgroundColor: "transparent",
    },
    loginText: {
      color: themeColors.tint,
      fontSize: rMS(14),
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    bottomText: {
      position: "absolute",
      bottom: Math.max(rV(20), insets.bottom + rV(10)),
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    existingLink: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      marginLeft: rS(4),
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View entering={FadeInDown.duration(600).delay(100)}>
        <Image
          source={require("../../assets/images/homepage.png")}
          style={styles.image}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(500).delay(250)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>The Best Educational Guide</Text>
        <Text style={styles.subtitle}>
          Make learning easier by following our study guides curated uniquely
          for your field of choice.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={styles.buttonContainer}
      >
        <VerificationButton
          onPress={handleSignUp}
          title="Create an account"
        />
        <VerificationButton
          style={styles.loginLink}
          onPress={handleLogIn}
          title="Log in"
          textStyle={styles.loginText}
        />
      </Animated.View>
    </View>
  );
};

export default Intro;
