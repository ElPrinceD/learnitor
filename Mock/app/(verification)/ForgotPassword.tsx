import React, { useState } from 'react';
import { View, Text, TextInput, Button, Linking, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useThemeColor } from '@/components/Themed';
import { useNavigation } from "expo-router";
import { RootParamList } from "../../components/types";
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigation = useNavigation<RootParamList>();
  const [resetCodeError, setResetCodeError] = useState(''); // New state variable

  const handleSendCode = () => {
    
    axios.post('http://192.168.137.115:8000/api/forgetpassword',
        {email})
        .then(response => {
          // Handle successful response from backend
          setSent(true);
          setError('');
          
        })
        .catch(error => {
          // Handle error
          setError('Email not found');
        });

      
    } 
  

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

  const CheckVerificationCode = () => {
    
    axios.post('http://192.168.137.115:8000/api/verify-code',
        {email, verification_code : resetCode})
        .then(response => {
          // Handle successful response from backend
          setResettingPassword(true);
          setSent(true)
          setError('');
          
        })
        .catch(error => {
          // Handle error
          setResetCodeError('Invalid reset code');
        });
   
      
      
     
      
   
  };

  const ConfirmNewPassword = () => {
    
    axios.post('http://192.168.137.115:8000/api/reset-password',
        {new_password: newPassword, verification_code : resetCode})
        .then(response => {
          navigation.navigate("LogIn");
          setResettingPassword(true);
          setSent(true)
          setError('');
          
        })
        .catch(error => {
          // Handle error
          setResetCodeError('Invalid Password');
        });
   
      
      
     
      
   
  };

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const buttonTextColor = useThemeColor({}, 'text');
  const buttonBackgroundColor = useThemeColor({}, 'background');
  const buttonBorderColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Image
        source={require("../../assets/images/3293465.jpg")} // Replace with your image path
        style={styles.image}
      />
      {/* <Text style={[styles.title, { color: textColor, alignSelf: 'flex-start', marginLeft: 16, }]}>Learnitor</Text> */}
      <Text style={[styles.title, { fontSize: 24, marginBottom: 16, color: themeColor }]}>Forgot your password?</Text>
      <TextInput
        style={[styles.input, { borderColor: textColor, color: textColor }]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        placeholderTextColor={textColor}
      />
      {error ? (
        <Text style={[styles.errorMessage, { color: 'red' }]}>{error}</Text>
      ) : null}
      {sent ? (
        <Text style={[styles.sentMessage, { color: textColor }]}>Check your email for a password reset code</Text>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            styles.sendCodeButton,
            { 
              backgroundColor: buttonBackgroundColor, 
              borderColor: buttonBorderColor 
            },
          ]}
          onPress={handleSendCode}
        >
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Send code</Text>
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
      {resetCodeError ? ( // Display the reset code error message
        <Text style={[styles.errorMessage, { color: 'red' }]}>{resetCodeError}</Text>
      ) : null}
      {sent ? (
        <Button
          title="Reset Password"
          onPress={CheckVerificationCode}
          color={themeColor}
        />
      ) : null}
      {resettingPassword ? (
        <Text style={[styles.sentMessage, { color: textColor }]}>Resetting password...</Text>
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
        <Button
          title="Confirm Password"
          onPress={ConfirmNewPassword}
          color={themeColor}
        />
      ) : null}
      <Text style={[styles.support, { color: themeColorText }]}>
        If you have trouble resetting your password, contact us at{' '}
        <Text
          onPress={() => Linking.openURL('mailto:support@learnitor.org')}
          style={[styles.supportLink, { color: themeColor }]}>
          support@learnitor.org
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,  },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      padding: 16,
      width: '100%',
      marginBottom: 16,
      borderTopWidth: 0, // Hide top border
      borderRightWidth: 0, // Hide right border
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
      textAlign: 'center',
    },
    supportLink: {
      fontSize: 16,
      textDecorationLine: 'underline',
    },
    button: {
      borderRadius: 10,
      padding: 16,
      paddingHorizontal: 32,
      marginBottom: 16,
    },
    loginButton: {
      backgroundColor: '#fff',
      borderColor: '#fff',
    },
    sendCodeButton: {
      // backgroundColor: buttonBackgroundColor, // Removed
      // borderColor: buttonBorderColor, // Removed
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
    }, 
    image: {
      width: 400, // Make the image bigger
      height: 350,
      resizeMode: "contain", // Maintain aspect ratio
      marginBottom: 16, // Bring the image down a little
    },
    
  });
  
  export default ForgotPassword;