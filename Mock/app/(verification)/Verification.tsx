import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams } from "expo-router";

const Verification = () => {
  const params = useLocalSearchParams();
  const email = params.email;
  console.log("Received email:", email);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000" : "#fff" },
      ]}
    >
      <Ionicons
        name="mail-outline"
        size={40}
        color={isDarkMode ? "#fff" : "#000"}
      />
      <Text
        style={[
          styles.title,
          { color: isDarkMode ? "#fff" : "#000", fontSize: 30 },
        ]}
      >
        You're almost there!
      </Text>
      <View style={styles.centered}>
        <Text
          style={[styles.emailText, { color: isDarkMode ? "#fff" : "#666" }]}
        >
          We've sent an email to:
        </Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <Text style={[styles.text, { color: isDarkMode ? "#fff" : "#666" }]}>
        Just tap on the link in that email to complete your sign up.
      </Text>
      <Text style={[styles.boldText, { color: isDarkMode ? "#fff" : "#666" }]}>
        If you don't see it, you need to check your{" "}
        <Text style={styles.bold}>spam folder</Text>.
      </Text>
      <Text> {"\n"} </Text>
      <Text style={[styles.text, { color: isDarkMode ? "#fff" : "#666" }]}>
        Still can't find the email? No problem.
      </Text>
      <TouchableOpacity
        style={[
          styles.resendButton,
          {
            backgroundColor: isDarkMode ? "#333" : "#000000",
            borderRadius: 20,
            paddingVertical: 16,
            paddingHorizontal: 68,
          },
        ]}
        onPress={() => console.log("Resend verification email")}
      >
        <Text style={styles.resendText}>Resend Verification Email</Text>
      </TouchableOpacity>
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
  },
  email: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#007aff",
    marginBottom: 24,
  },
  boldText: {
    fontSize: 16,
    marginBottom: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  resendButton: {
    width: "80%",
  },
  resendText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Verification;
