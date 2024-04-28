import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useThemeColor } from "@/components/Themed";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetCodeError, setResetCodeError] = useState(""); // New state variable

  const handleSendCode = () => {
    // Simulate sending a code to the email
    if (email === "yawopokugyamerah@gmail.com") {
      setSent(true);
      setError("");
    } else {
      setError("Email not found");
    }
  };

  const handleResetPassword = () => {
    // Simulate resetting the password
    if (resetCode === "123456") {
      setResettingPassword(true);
      // Simulate resetting the password process
      setTimeout(() => {
        setResettingPassword(false);
        setSent(false);
      }, 2000);
    } else {
      setResetCodeError("Invalid reset code"); // Update the new state variable
    }
  };

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
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
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* <Text style={[styles.title, { color: textColor, alignSelf: 'flex-start', marginLeft: 16, }]}>Learnitor</Text> */}
      <Text
        style={[
          styles.title,
          { fontSize: 24, marginBottom: 16, color: textColor },
        ]}
      >
        Forgot your password?
      </Text>
      <TextInput
        style={[styles.input, { borderColor: textColor, color: textColor }]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        placeholderTextColor={textColor}
      />
      {error ? (
        <Text style={[styles.errorMessage, { color: "red" }]}>{error}</Text>
      ) : null}
      {sent ? (
        <Text style={[styles.sentMessage, { color: textColor }]}>
          Check your email for a password reset code
        </Text>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            styles.sendCodeButton,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
            },
          ]}
          onPress={handleSendCode}
        >
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Send code
          </Text>
        </TouchableOpacity>
      )}
      {sent ? (
        <TextInput
          style={[styles.input, { borderColor: textColor, color: textColor }]}
          placeholder="Reset code"
          value={resetCode}
          onChangeText={(text) => setResetCode(text)}
          placeholderTextColor={textColor}
        />
      ) : null}
      {resetCodeError ? ( // Display the reset code error message
        <Text style={[styles.errorMessage, { color: "red" }]}>
          {resetCodeError}
        </Text>
      ) : null}
      {sent ? (
        <TouchableOpacity
          style={[
            styles.button,
            styles.sendCodeButton,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
            },
          ]}
          onPress={handleResetPassword}
        >
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Reset Password
          </Text>
        </TouchableOpacity>
      ) : null}
      {resettingPassword ? (
        <Text style={[styles.sentMessage, { color: textColor }]}>
          Resetting password...
        </Text>
      ) : null}
      {resettingPassword && !sent ? (
        <TextInput
          style={[styles.input, { borderColor: textColor, color: textColor }]}
          placeholder="New password"
          value={newPassword}
          onChangeText={(text) => setNewPassword(text)}
          secureTextEntry
          placeholderTextColor={textColor}
        />
      ) : null}
      <Text style={[styles.support, { color: textColor }]}>
        If you have trouble resetting your password, contact us at{" "}
        <Text
          onPress={() => Linking.openURL("mailto:support@learnitor.org")}
          style={[styles.supportLink, { color: textColor }]}
        >
          support@learnitor.org
        </Text>
      </Text>
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
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  sentMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  support: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  supportLink: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 0.5,
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  sendCodeButton: {
    // backgroundColor: buttonBackgroundColor, // Removed
    // borderColor: buttonBorderColor, // Removed
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ForgotPassword;
