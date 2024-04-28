import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { RootParamList } from "../../components/types";

import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

// import KeyboardAvoidingWrapper from "../../components/KeyboardAvoidingWrapper";

const ContinueWithEmail = () => {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [allFieldsError, setAllFieldsError] = useState("");
  const colorScheme = useColorScheme();
  const navigation = useNavigation<RootParamList>();

  const handleSignUp = () => {
    setPasswordError("");
    setEmailError("");
    setAllFieldsError("");
    if (!firstName || !surname || !email || !password || !dateOfBirth) {
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
      try {
        axios.post(
          "http://192.168.83.198:8000/'api/register/', UserRegistrationAPIView.as_view(), name='user-registration'",
          {
            first_Name: firstName,
            last_name: surname,
            email: email,
            password: password,
            dateOfBirth: "dob",
          }
        );
        // Assuming successful registration will navigate to another screen
        navigation.navigate("Verification", { email });
      } catch (error) {
        // Handle error here (e.g., display error message)
        console.error("Registration failed:", error);
      }
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const [show, setShow] = useState(false);
  const [dateOfBirth, setdateOfBirth] = useState(new Date(2000, 0, 1));
  const [dob, setDob] = useState<Date | null>(null);

  const onChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dateOfBirth;
    setShow(false);
    setdateOfBirth(currentDate);
    setDob(currentDate);
  };
  const showDatePicker = () => {
    setShow(true);
  };

  return (
    // <KeyboardAvoidingWrapper>
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
      ]}
    >
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              width: "48%",
              color: colorScheme === "dark" ? "#fff" : "#000",
              borderColor: colorScheme === "dark" ? "#fff" : "#000",
            },
          ]}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
        />
        <View style={{ width: 16 }} />
        <TextInput
          style={[
            styles.input,
            {
              width: "48%",
              color: colorScheme === "dark" ? "#fff" : "#000",
              borderColor: colorScheme === "dark" ? "#fff" : "#000",
            },
          ]}
          placeholder="Surname"
          value={surname}
          onChangeText={setSurname}
          placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
        />
      </View>
      <TextInput
        style={[
          styles.input,
          {
            width: "100%",
            color: colorScheme === "dark" ? "#fff" : "#000",
            borderColor: colorScheme === "dark" ? "#fff" : "#000",
          },
        ]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
      />
      {emailError && <Text style={styles.errorMessage}>{emailError}</Text>}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            {
              width: "100%",
              color: colorScheme === "dark" ? "#fff" : "#000",
              borderColor: colorScheme === "dark" ? "#fff" : "#000",
            },
          ]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
        />
        <TouchableOpacity
          onPress={toggleShowPassword}
          style={styles.toggleIcon}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color={colorScheme === "dark" ? "#fff" : "gray"}
          />
        </TouchableOpacity>
      </View>
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
        />
      )}
      <TouchableOpacity onPress={showDatePicker}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              {
                width: "100%",
                color: colorScheme === "dark" ? "#fff" : "#000",
                borderColor: colorScheme === "dark" ? "#fff" : "#000",
              },
            ]}
            placeholder="Date of Birth"
            value={dob ? dob.toDateString() : ""}
            placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {allFieldsError && (
        <Text style={styles.centeredErrorMessage}>{allFieldsError}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colorScheme === "dark" ? "#333" : "#808080",
          },
        ]}
        onPress={handleSignUp}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <Text
        style={[
          styles.agreementText,
          { color: colorScheme === "dark" ? "#fff" : "#666" },
        ]}
      >
        By clicking Sign Up, I agree to Learnitor's{" "}
        <Text
          style={[
            styles.link,
            { color: colorScheme === "dark" ? "#fff" : "#007aff" },
          ]}
          onPress={() => console.log("Terms pressed")}
        >
          Terms
        </Text>{" "}
        and{" "}
        <Text
          style={[
            styles.link,
            { color: colorScheme === "dark" ? "#fff" : "#007aff" },
          ]}
          onPress={() => console.log("Privacy Policy pressed")}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
    // </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: "90%",
  },
  toggleIcon: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    borderWidth: 0.5,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  errorMessage: {
    fontSize: 12,
    color: "red",
    marginLeft: 16,
  },
  centeredErrorMessage: {
    fontSize: 12,
    color: "red",
    marginBottom: 8,
    textAlign: "center",
  },
  agreementText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    textAlign: "center",
  },
  link: {
    textDecorationLine: "underline",
  },
});

export default ContinueWithEmail;
