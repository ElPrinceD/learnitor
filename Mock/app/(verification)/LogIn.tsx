import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, TextInput, Image } from "react-native";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/components/Themed";
import { router } from "expo-router";
import axios from 'axios';
import { RootParamList } from "../../components/types";


const LogIn = () => {

  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUpWithApple = () => {
    
  };

  const handleSignUpWithGoogle = () => {
    
  };

  const handleSignUpWithTwitter = () => {
    // Handle sign up with Twitter
  };

  const handleLogin = () => {
   
      axios.post('http://172.20.10.2:8000/api/login/', {
        email: email,
        password: password,
  })
  .then(response => {
    // Handle successful response from backend
    console.log(response.data);
    router.navigate("(tabs)");
  })
  .catch(error => {
    // Handle error
    console.error(error);
    setError("Email and/or password is incorrect")
  });
      
    
  };

  const handleForgotPassword = () => {
    router.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    router.navigate("SignUp");
  };

  const buttonTextColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "text"
  );

  const themeColor = useThemeColor(
    {
      dark: "#0063cd", light: "#0063cd"
    }, "background"
  )
  const themeColorText = useThemeColor(
    {
      dark: "#919396", light: "#919396"
    }, "background"
  )
  
  const buttonBackgroundColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
  );
  const buttonBorderColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "tint"
  );
  const dividerTextColor = useThemeColor(
    { light: "#000", dark: "#fff" },
    "text"
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, "background") },
      ]}
    >
      
      <Image
        source={require("../../assets/images/Login-rafiki.png")} // Replace with your image path
        style={styles.image}
      />
      
    
      
      <View style={styles.inputContainer}>
       
      
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
              color: buttonTextColor,
              borderTopWidth: 0, // Hide top border
              borderRightWidth: 0, // Hide right border
              borderLeftWidth: 0,
              borderBottomWidth: 1,
              
            },
          ]}
          placeholder="Email"
          placeholderTextColor={buttonTextColor}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
              color: buttonTextColor,
              borderTopWidth: 0, // Hide top border
              borderRightWidth: 0, // Hide right border
              borderLeftWidth: 0,
              borderBottomWidth: 1,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={buttonTextColor}
          secureTextEntry={true}
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          styles.loginButton,
          {
            backgroundColor: themeColor,

            borderColor: buttonBorderColor,
          },
        ]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText, { color: "white" }]}>
          Log in
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={[styles.forgotPasswordText, { color: themeColor, textDecorationLine: "none" }]}>
          Forgot password?
        </Text>
      </TouchableOpacity>
      <View style={styles.dividerRow}>
        <Text style={[styles.dividerText, { color: dividerTextColor }]}>
          ---------------------OR----------------------
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.appleButton,
            {
              backgroundColor: buttonBackgroundColor,
              borderColor: buttonBorderColor,
            },
          ]}
          onPress={handleSignUpWithApple}
        >
          <Ionicons name="logo-apple" size={25} color={buttonTextColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithGoogle}
        >
          <Ionicons name="logo-google" size={25} color={buttonTextColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.twitterButton,
            { borderColor: buttonBorderColor },
          ]}
          onPress={handleSignUpWithTwitter}
        >
          <Ionicons name="logo-twitter" size={25} color={buttonTextColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomContainer}>
        <Text
          style={[styles.existingText, { color: themeColorText }]}
        >
          No account yet?
        </Text>
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text
            style={[styles.loginText, { color: themeColor , textDecorationLine: "none"}]}
          >
            Register
          </Text>
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
  buttonRow: {
    flexDirection: "row",
    marginBottom: 16,
    paddingTop: 16, 
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    marginRight: 9,
  },
  emailSign: {
    fontSize: 30, // Customize font size of email sign
    color: 'grey', // Customize color of email sign
    marginHorizontal: 5, // Add margin around the email sign
  
  },
  appleButton: {
    borderWidth: 1,
    width: 120,
  },
  googleButton: {
    borderWidth: 1,
    width: 120,
  },
 
  twitterButton: {
    borderWidth: 1,
    width: 120,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    
  },
  input: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    color: "#000",
    
  },
  dividerText: {
    fontSize: 16,
    fontWeight: "bold",
    opacity: 0.4,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loginButton: {
    
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    
    width: 300,
  },
  image: {
    width: 400, // Make the image bigger
    height: 350,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 8,
  },
 
  bottomContainer: {
    position: "absolute",
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  existingText: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontSize: 16,
    color: "red",
    marginBottom: 16,
  },
});

export default LogIn;
