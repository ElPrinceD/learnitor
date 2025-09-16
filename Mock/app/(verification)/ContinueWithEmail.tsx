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

const ContinueWithEmail = () => {
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

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  // const handleInstitutionSelect = () => {
  //   if (Platform.OS === "ios") {
  //     ActionSheetIOS.showActionSheetWithOptions(
  //       {
  //         options: [...institutionList.map((inst) => inst.name), "Cancel"],
  //         cancelButtonIndex: institutionList.length,
  //       },
  //       (buttonIndex) => {
  //         if (buttonIndex !== institutionList.length) {
  //           const selectedInstitution = institutionList[buttonIndex];
  //           setInstitution(selectedInstitution.id); // Set id
  //         }
  //       }
  //     );
  //   } else {
  //     setShowInstitutionPicker(true);
  //   }
  // };

  // const handleProgramSelect = () => {
  //   if (Platform.OS === "ios") {
  //     ActionSheetIOS.showActionSheetWithOptions(
  //       {
  //         options: [...programList.map((program) => program.name), "Cancel"],
  //         cancelButtonIndex: programList.length,
  //       },
  //       (buttonIndex) => {
  //         if (buttonIndex !== programList.length) {
  //           const selectedProgram = programList[buttonIndex];
  //           setProgramOfStudy(selectedProgram.id); // Set id
  //         }
  //       }
  //     );
  //   } else {
  //     setShowProgramPicker(true);
  //   }
  // };

  const handleSignUp = () => {
    setPasswordError("");
    setEmailError("");
    setAllFieldsError("");
    if (!firstName || !surname || !email || !password || !dob) {
      setAllFieldsError("Please fill in all fields");
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
    } else {
      console.log(institution);
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
            pathname: "LogIn",
            params: { email: response.data.user.email },
          });
        })
        .catch((error) => {
          console.error("Registration failed:", error);
        });
    }
  };

  const handleSignIn = () => {
    router.dismissTo("LogIn");
  };

  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);

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
    headerText: {
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
      color: themeColors.text,
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    halfInput: {
      flex: 1,
    },

    inputContainer: {
      width: rS(270),
    },
    dateContainer: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: rMS(8),
      paddingHorizontal: rS(16),
      paddingVertical: rV(8),
      backgroundColor: themeColors.background,
      width: rS(270),
      alignSelf: "center",
    },
    spacing: {
      height: rV(24),
    },
    picker: {
      height: 50,
      width: rS(300),
      backgroundColor: themeColors.background,
    },
    errorMessage: {
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginBottom: rMS(8),
      textAlign: "center",
    },
    bottomContainer: {
      bottom: rV(10),
      justifyContent: "flex-end",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
    },
    loginText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.buttonBackground,
      marginLeft: rMS(8),
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <View style={styles.container}>
          <Typewriter
            text="Create an account"
            delay={100}
            style={[styles.headerText, { marginBottom: rS(70) }]}
            onComplete={() => setShowSecondText(true)}
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
          <View style={styles.rowContainer}>
            <View style={[styles.halfInput, { marginRight: rS(20) }]}>
              <AnimatedTextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>

            <View style={styles.halfInput}>
              <AnimatedTextInput
                label="Last Name"
                value={surname}
                onChangeText={setSurname}
                placeholderTextColor={themeColors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.dateContainer}>
            <DateSelector
              label="Date of Birth"
              initialDate={dob}
              onDateChange={handleDateChange}
              minDate={false}
            />
          </View>

          <View style={styles.spacing} />
          <VerificationButton onPress={handleSignUp} title="Register" />
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
