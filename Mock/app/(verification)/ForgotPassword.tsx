import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useThemeColor } from "@/components/Themed";
import { useNavigation } from "expo-router";
import { RootParamList } from "../../components/types";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetCodeError, setResetCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<RootParamList>();

  const handleSendCode = () => {
    setLoading(true);

    axios
      .post("http://192.168.83.198:8000/api/forgetpassword", { email })
      .then((response) => {
        setLoading(false);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        setError("Email not found");
        clearErrorsAfterTimeout();
      });
  };

  const themeColor = useThemeColor(
    {
      dark: "#0063cd",
      light: "#0063cd",
    },
    "background"
  );

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  const clearErrorsAfterTimeout = () => {
    setTimeout(() => {
      setError("");
      setResetCodeError("");
    }, 5000); // Clear errors after 5 seconds
  };

  const CheckVerificationCode = () => {
    setLoading(true);

    axios
      .post("http://192.168.83.198:8000/api/verify-code", {
        email,
        verification_code: resetCode,
      })
      .then((response) => {
        setLoading(false);
        setResettingPassword(true);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        setResetCodeError("Invalid reset code");
        clearErrorsAfterTimeout();
      });
  };

  const ConfirmNewPassword = () => {
    setLoading(true);

    axios
      .post("http://192.168.83.198:8000/api/reset-password", {
        new_password: newPassword,
        verification_code: resetCode,
      })
      .then((response) => {
        setLoading(false);
        navigation.navigate("LogIn");
        setResettingPassword(true);
        setSent(true);
        setError("");
        clearErrorsAfterTimeout();
      })
      .catch((error) => {
        setLoading(false);
        setResetCodeError("Invalid Password");
        clearErrorsAfterTimeout();
      });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* <Image
        source={require("../../assets/images/Login-rafiki.png")} // Replace with your image path
        style={styles.image}
      /> */}
      <Text
        style={[
          styles.title,
          { fontSize: 24, marginBottom: -12, color: themeColor },
        ]}
      >
        Forgot your password?
      </Text>
      <Text
        style={[
          styles.title,
          { fontSize: 20, marginTop: 10, color: themeColor },
        ]}
      >
        Don't Worry!
      </Text>
      <Text style={[styles.description, { color: textColor }]}>
        Enter your email and we'll send you a code to reset your password.
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
            {
              backgroundColor: themeColor,
            },
          ]}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, { color: "white" }]}>
              Send code
            </Text>
          )}
        </TouchableOpacity>
      )}
      {sent ? (
        <TextInput
          style={[styles.input, { borderColor: themeColor, color: textColor }]}
          placeholder="Reset code"
          value={resetCode}
          onChangeText={(text) => setResetCode(text)}
          placeholderTextColor={textColor}
        />
      ) : null}
      {resetCodeError ? (
        <Text style={[styles.errorMessage, { color: "red" }]}>
          {resetCodeError}
        </Text>
      ) : null}
      {sent ? (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: themeColor,
            },
          ]}
          onPress={CheckVerificationCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, { color: "white" }]}>
              Reset Password
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
      {resettingPassword ? (
        <Text style={[styles.sentMessage, { color: textColor }]}>
          Enter new password
        </Text>
      ) : null}
      {resettingPassword && sent ? (
        <TextInput
          style={[styles.input, { borderColor: textColor, color: textColor }]}
          placeholder="New password"
          value={newPassword}
          onChangeText={(text) => setNewPassword(text)}
          secureTextEntry
          placeholderTextColor={textColor}
        />
      ) : null}
      {resettingPassword ? (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: themeColor,
            },
          ]}
          onPress={ConfirmNewPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, { color: "white" }]}>
              Set New Password
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
      <Text style={[styles.support, { color: textColor }]}>
        If you have trouble resetting your password, contact us at{" "}
        <Text
          onPress={() => Linking.openURL("mailto:support@learnitor.org")}
          style={[styles.supportLink, { color: themeColor }]}
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
  description: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 1,
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
    borderRadius: 10,
    padding: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  image: {
    width: 400,
    height: 350,
    resizeMode: "contain",
    marginBottom: 16,
  },
});

export default ForgotPassword;
