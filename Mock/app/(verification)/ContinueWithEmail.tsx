import React, { useState } from "react";
import axios from "axios";

import {
  View,
  TextInput,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import Index from "../(tabs)/index";
import { RootParamList } from "../../components/types";
import { useThemeColor } from "@/components/Themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import ApiUrl from "../../config"

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
  const navigation = useNavigation<RootParamList>();

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
        .post(`${ApiUrl}:8000/api/register/`, {
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
          navigation.navigate("(tabs)", {
            firstName: response.data.user.first_name,
          });
        })
        .catch((error) => {
          // Handle error
          console.error("Registration failed:", error);
        });
    }
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
    console.log("touched");
    setShow(true);
  };

  const themeColor = useThemeColor(
    {
      dark: "#0063cd",
      light: "#0063cd",
    },
    "background"
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
      ]}
    >
      <Image
        source={require("../../assets/images/Register.png")}
        style={styles.image}
      />
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
            value={dateOfBirth ? dateOfBirth.toDateString() : ""}
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
            backgroundColor: themeColor,
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
    borderTopWidth: 0, // Hide top border
    borderRightWidth: 0, // Hide right border
    borderLeftWidth: 0,
    borderBottomWidth: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  passwordInput: {
    borderRadius: 10,
    padding: 12,
    width: "90%",
    borderTopWidth: 0, // Hide top border
    borderRightWidth: 0, // Hide right border
    borderLeftWidth: 0,
    borderBottomWidth: 1,
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
  image: {
    width: 400, // Make the image bigger
    height: 350,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
  },
});

export default ContinueWithEmail;
