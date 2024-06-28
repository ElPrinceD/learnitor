import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rS } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import Animated, {
  ReduceMotion,
  StretchInY,
  StretchOutY,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const ContinueWithEmail = () => {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [user, setUser] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [allFieldsError, setAllFieldsError] = useState("");
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleSignUp = () => {
    setPasswordError("");
    setEmailError("");
    setAllFieldsError("");
    if (!firstName || !surname || !email || !password || !dob) {
      setAllFieldsError("Please fill in all fields");
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setEmailError("");
      setAllFieldsError("");
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      setPasswordError("");
      setAllFieldsError("");
    } else {
      axios
        .post(`${ApiUrl}/api/register/`, {
          first_name: firstName,
          last_name: surname,
          email: email,
          password: password,
          dob: dateOfBirth.toISOString().substring(0, 10),
        })
        .then((response) => {
          setUser(response.data.user);
          // I was trying to send this page straight to the homepage but I couldnt so please do it
          //I am return the user, so you can accept the user information in the homepage and use it
          router.navigate({
            pathname: "LogIn",
            params: { email: response.data.user.email },
          });
        })
        .catch((error) => {
          // Handle error
          console.error("Registration failed:", error);
        });
    }
  };

  const handleLogin = () => {
    router.navigate("LogIn");
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const [show, setShow] = useState(false);
  const [dateOfBirth, setdateOfBirth] = useState(new Date(2000, 0, 1));

  const onChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dateOfBirth;
    setShow(false);
    setdateOfBirth(currentDate);
    setDob(currentDate);
  };

  const showDatePicker = () => {
    setShow(true);
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(16),
      backgroundColor: themeColors.background,
    },
    inputWrapper: {
      marginBottom: rMS(16),
      width: rS(320),
    },
    label: {
      top: -8,
      left: 17,
      borderRadius: 70,
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      zIndex: 1,
      fontSize: 16,
      color: "#515050",
      fontWeight: "light",
    },
    inputContainer: {
      width: rS(300),
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 10,
      padding: rMS(16),
      marginBottom: rMS(16),
      color: themeColors.text,
    },
    toggleIcon: {
      position: "absolute",
      right: rMS(10),
      top: rMS(17),
    },
    bottomContainer: {
      position: "absolute",
      bottom: rMS(5),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
    signupButton: {
      marginLeft: rMS(8),
    },
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textDecorationLine: "underline",
      color: themeColors.buttonBackground,
    },
    errorMessage: {
      fontSize: SIZES.medium,
      color: "#D22B2B",
    },
    centeredErrorMessage: {
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginBottom: rMS(8),
      textAlign: "center",
    },
    agreementText: {
      fontSize: SIZES.small,
      opacity: 0.6,
      marginTop: rMS(15),
      textAlign: "center",
      color: themeColors.textSecondary,
    },
    link: {
      textDecorationLine: "underline",
    },
  });

  return (
    <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
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
          <AnimatedTextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={themeColors.textSecondary}
            style={styles.inputContainer}
          />
          <AnimatedTextInput
            label="Last Name"
            value={surname}
            onChangeText={setSurname}
            placeholderTextColor={themeColors.textSecondary}
            style={styles.inputContainer}
          />

          <AnimatedTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={themeColors.textSecondary}
            style={styles.inputContainer}
          />

          <AnimatedTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={themeColors.textSecondary}
            secureTextEntry={!showPassword}
            showToggleIcon={true}
            style={styles.inputContainer}
          />

          {emailError && <Text style={styles.errorMessage}>{emailError}</Text>}
          {passwordError && (
            <Text style={styles.errorMessage}>{passwordError}</Text>
          )}
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={dateOfBirth}
              mode="date"
              is24Hour={true}
              onChange={onChange}
              textColor={themeColors.icon}
              accentColor={themeColors.icon}
            />
          )}
          <View style={styles.inputWrapper}>
            {/* <Text style={styles.label}>Date Of Birth</Text> */}
            <TouchableOpacity onPress={showDatePicker}>
              <TextInput
                style={styles.input}
                value={dateOfBirth ? dateOfBirth.toDateString() : ""}
                placeholderTextColor={themeColors.textSecondary}
                editable={false}
              />
            </TouchableOpacity>
          </View>
          {allFieldsError && (
            <Text style={styles.centeredErrorMessage}>{allFieldsError}</Text>
          )}
          <VerificationButton onPress={handleSignUp} title="Register" />
          <Text style={styles.agreementText}>
            By tapping Register, I agree to Learnitor's{" "}
            <Text
              style={styles.link}
              onPress={() => console.log("Terms pressed")}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              style={styles.link}
              onPress={() => console.log("Privacy Policy pressed")}
            >
              Privacy Policy
            </Text>
            .
          </Text>
          <View style={styles.bottomContainer}>
            <Text style={styles.existingText}>Existing user?</Text>
            <TouchableOpacity style={styles.signupButton} onPress={handleLogin}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ContinueWithEmail;
