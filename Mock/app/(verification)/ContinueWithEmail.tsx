import React, { useState } from "react";
import axios from "axios";

import {
  View,
  TextInput,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { RootParamList } from "../../components/types";
import { useThemeColor } from "../../components/Themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import ApiUrl from "../../config";
import { LinearGradient } from "expo-linear-gradient";

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
          navigation.navigate("LogIn", {
            email: response.data.user.email,
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
    console.log("touched");
    setShow(true);
  };

  const themeColor = useThemeColor(
    {
      dark: "#9a580d",
      light: "#9a580d",
    },
    "background"
  );

  const buttonTextColor = useThemeColor(
    { light: "#b9b9b9", dark: "#fff" },
    "text"
  );
  const buttonBackgroundColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
    
  );

  const dividerTextColor = useThemeColor(
    { light: "#292929", dark: "#fff" },
    "text"
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
    
    <View style={styles.inputWrapper}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                
                color: buttonTextColor,
              },
            ]}
            placeholder="Arch"
            placeholderTextColor={buttonTextColor}
            value={firstName}
            onChangeText={setFirstName}
            
            
          />
        </View>
    <View style={styles.inputWrapper}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                
                color: buttonTextColor,
              },
            ]}
            placeholder="Levy"
            placeholderTextColor={buttonTextColor}
            value={surname}
            onChangeText={setSurname}
            
            
          />
        </View>

    <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                
                color: buttonTextColor,
              },
            ]}
            placeholder="ArchLevy@learnitor.com"
            placeholderTextColor={buttonTextColor}
            value={email}
            onChangeText={setEmail}
            
            
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: buttonBackgroundColor,
                color: buttonTextColor,
              },
            ]}
            placeholder="*************"
            placeholderTextColor={buttonTextColor}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => setPassword(text)}
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
        />
      )}
      <View style={styles.inputWrapper}>
          <Text style={styles.label}>Date Of Birth</Text>
      <TouchableOpacity onPress={showDatePicker}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              {
                width: "100%",
                color: colorScheme === "dark" ? "#fff" : "#000",
                borderColor: colorScheme === "dark" ? "#fff" : "#bdbbb9",
              },
            ]}
            placeholder="Date of Birth"
            value={dateOfBirth ? dateOfBirth.toDateString() : ""}
            placeholderTextColor={colorScheme === "dark" ? "#fff" : "#666"}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      </View>
      {allFieldsError && (
        <Text style={styles.centeredErrorMessage}>{allFieldsError}</Text>
      )}
      <TouchableOpacity
        
        onPress={handleLogin}
        
      >
        <LinearGradient
            colors={['#c17319', '#9a580d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, styles.loginButton]}
          >
         
          <Text style={[styles.buttonText, { color: "white" }]}>Register</Text>
        
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.bottomContainer}>
        <Text style={[styles.existingText, { color: dividerTextColor }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text
            style={[
              styles.loginText,
              { color: "#9a580d", textDecorationLine: "none" },
            ]}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
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
  
  inputWrapper: {
    position: "relative",
    marginBottom: 16,
    width: "100%",
  },
  label: {
    position: "absolute",
    top: -8,
    left: 17,
    borderRadius: 70,
    backgroundColor: 'white', // Make the label background transparent
    paddingHorizontal: 8,
    zIndex: 1,
    fontSize: 16,
    color: '#515050',
    fontWeight: 'light',
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdbbb9",
    borderRadius: 12.5,
    padding: 16,
    marginBottom: 25,
    color: "#000",
    height: 65,
    position: 'relative',
    
    zIndex: 0,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
    backgroundColor: "#9a580d",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  bottomContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  existingText: {
    fontSize: 16,
    fontWeight: "light",
  },
  signupButton: {
    marginLeft: 8,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
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
  loginButton: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 1,
    width: 350,
  },
  image: {
    width: 400, // Make the image bigger
    height: 350,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
  },
});

export default ContinueWithEmail;
