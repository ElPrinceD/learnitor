import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useThemeColor } from "../../components/Themed";

// Define the type for the navigation prop
// type IntroProps = StackScreenProps<RootStackParamList, 'Intro'>;

const Intro = () => {
  // Get theme colors for text and background
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  const themeColor = useThemeColor(
    {
      dark: "#0063cd",
      light: "#0063cd",
    },
    "background"
  );

  // Navigate to the sign up page
  const handleSignUp = () => {
    router.navigate("SignUp");
  };
  // Navigate to the log in modal page
  const handleLogIn = () => {
    router.navigate("LogIn");
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Image */}
      <Image
        source={require("../../assets/images/Learn.png")} // Replace with your image path
        style={styles.image}
      />

      {/* Text Container */}
      <View style={styles.textContainer}>
        {/* Text */}
        <Text style={[styles.title, { color: textColor }]}>
          The Best Educational Guide
        </Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Make learning easier by following our study guides curated uniquely
          for your field of choice.
        </Text>
      </View>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColor }]}
          onPress={handleSignUp}
        >
          <Text style={[styles.buttonText, { color: backgroundColor }]}>
            Sign Up
          </Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <TouchableOpacity style={styles.loginLink} onPress={handleLogIn}>
          <Text style={[styles.loginText, { color: textColor }]}>Log In</Text>
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
  image: {
    width: 300, // Make the image bigger
    height: 300,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
  },
  textContainer: {
    alignItems: "center", // Center text horizontally
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center", // Center the text horizontally
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.6, // Reduce opacity of subtitles
  },
  buttonContainer: {
    marginTop: 20, // Bring the sign-up and log-in down a little
    alignItems: "center",
  },
  button: {
    width: 350, // Make the button wider
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // More rounded edges
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 12, // Space between sign-up and log-in
  },
  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "none", // Underline to resemble a link
  },
});

export default Intro;
