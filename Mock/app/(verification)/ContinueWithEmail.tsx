import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  Keyboard,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import DateSelector from "../../components/DateSelector";
import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rS, rV } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import { StatusBar } from "expo-status-bar";
import { Typewriter } from "../../components/TypewriterText";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import Animated, { FadeInDown } from "react-native-reanimated";

const ContinueWithEmail = () => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<string>("");
  const [institution, setInstitution] = useState("");

  const [user, setUser] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [allFieldsError, setAllFieldsError] = useState("");
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [showSecondText, setShowSecondText] = useState(false);

  const handleDateChange = (dateString: string) => {
    setDob(dateString);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (allFieldsError) setAllFieldsError("");
  };

  const handleSurnameChange = (text: string) => {
    setSurname(text);
    if (allFieldsError) setAllFieldsError("");
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setAllFieldsError("");
  };

  const handleSignUp = () => {
    clearErrors();

    if (!firstName || !surname || !email || !password || !dob) {
      setAllFieldsError("Please fill in all fields");
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
    } else {
      axios
        .post(`${ApiUrl}/api/register/`, {
          first_name: firstName,
          last_name: surname,
          email: email,
          password: password,
          dob: dob,
        })
        .then((response) => {
          setUser(response.data.user);
          router.navigate({
            pathname: "ConsentScreen",
            params: { email: response.data.user.email },
          });
        })
        .catch((error) => {
          console.error("Registration failed:", error);
          if (error.response?.status === 400) {
            setAllFieldsError(
              "Registration failed. Please check your information and try again."
            );
          } else if (error.response?.status === 409) {
            setEmailError("An account with this email already exists.");
          } else if (error.response?.status === 500) {
            setAllFieldsError("Server error. Please try again later.");
          } else {
            setAllFieldsError(
              "Registration failed. Please check your internet connection and try again."
            );
          }
        });
    }
  };

  const handleSignIn = () => {
    router.dismissTo("LogIn");
  };

  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);

  const hasError = !!(emailError || passwordError || allFieldsError);

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      backgroundColor: themeColors.background,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(16),
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(60),
      left: -rS(70),
      width: rS(230),
      height: rS(230),
      borderRadius: rS(115),
      backgroundColor: themeColors.tint + "12",
    },
    blob2: {
      position: "absolute",
      bottom: rV(60),
      right: -rS(90),
      width: rS(270),
      height: rS(270),
      borderRadius: rS(135),
      backgroundColor: "#10B98112",
    },
    headerText: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.5,
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    halfInput: {
      flex: 1,
    },
    inputContainer: {
      width: rS(280),
    },
    dateContainer: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: rMS(12),
      paddingHorizontal: rS(16),
      paddingVertical: rV(8),
      backgroundColor: themeColors.background,
      width: rS(280),
      alignSelf: "center",
    },
    spacing: {
      height: rV(20),
    },
    errorContainer: {
      backgroundColor: "#D22B2B" + "12",
      paddingVertical: rV(10),
      paddingHorizontal: rMS(16),
      borderRadius: rMS(16),
      marginTop: rV(12),
      borderLeftWidth: 3,
      borderLeftColor: "#D22B2B",
      width: rS(280),
    },
    errorText: {
      fontSize: rMS(12),
      color: "#D22B2B",
      fontWeight: "600",
    },
    bottomContainer: {
      bottom: Math.max(rV(15), insets.bottom + rV(5)),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    loginText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      marginLeft: rMS(4),
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.container}>
          <Typewriter
            text="Create an account"
            delay={100}
            style={[styles.headerText, { marginBottom: rS(50) }]}
            onComplete={() => setShowSecondText(true)}
          />

          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <AnimatedTextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholderTextColor={themeColors.textSecondary}
              style={styles.inputContainer}
              labelColor={emailError ? "#D22B2B" : undefined}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <AnimatedTextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholderTextColor={themeColors.textSecondary}
              secureTextEntry={!showPassword}
              showToggleIcon={true}
              style={styles.inputContainer}
              labelColor={passwordError ? "#D22B2B" : undefined}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.rowContainer}>
            <View style={[styles.halfInput, { marginRight: rS(20) }]}>
              <AnimatedTextInput
                label="First Name"
                value={firstName}
                onChangeText={handleFirstNameChange}
                placeholderTextColor={themeColors.textSecondary}
                labelColor={allFieldsError ? "#D22B2B" : undefined}
              />
            </View>

            <View style={styles.halfInput}>
              <AnimatedTextInput
                label="Last Name"
                value={surname}
                onChangeText={handleSurnameChange}
                placeholderTextColor={themeColors.textSecondary}
                labelColor={allFieldsError ? "#D22B2B" : undefined}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(290)} style={styles.dateContainer}>
            <DateSelector
              label="Date of Birth"
              onDateChange={handleDateChange}
              minDate={false}
              startBlank={true}
            />
          </Animated.View>

          <View style={styles.spacing} />

          <Animated.View entering={FadeInDown.duration(400).delay(360)}>
            <VerificationButton onPress={handleSignUp} title="Register" />
          </Animated.View>

          {/* Error Messages */}
          {hasError && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              {allFieldsError ? <Text style={styles.errorText}>{allFieldsError}</Text> : null}
            </Animated.View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.existingText}>Already have an account?</Text>
          <Text style={styles.loginText} onPress={handleSignIn}>
            Login
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ContinueWithEmail;
