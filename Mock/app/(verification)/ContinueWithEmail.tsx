import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, useColorScheme, Keyboard } from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker"; // Import Picker for Android
import { ActionSheetIOS } from "react-native"; // Import ActionSheetIOS for iOS
import axios from "axios";
import ApiUrl from "../../config";
import { SIZES, rMS, rS } from "../../constants";
import Colors from "../../constants/Colors";
import VerificationButton from "../../components/VerificationButton";
import { StatusBar } from "expo-status-bar";

import AnimatedTextInput from "../../components/AnimatedTextInput";

const ContinueWithEmail = () => {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [institution, setInstitution] = useState("");
  const [program_of_study, setProgramOfStudy] = useState("");
  const [institutionList, setInstitutionList] = useState<any[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [user, setUser] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [allFieldsError, setAllFieldsError] = useState("");
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    // Fetch the lists from the backend
    axios.get(`${ApiUrl}/institution/`)
      .then(response => {
        
        setInstitutionList(response.data);
      })
      .catch(error => {
        console.error("Error fetching institutions:", error);
      });

    axios.get(`${ApiUrl}/program/`)
      .then(response => {
       
        setProgramList(response.data);
      })
      .catch(error => {
        console.error("Error fetching programs:", error);
      });
  }, []);

  const onChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dateOfBirth;
    setShow(false);
    setDateOfBirth(currentDate);
    setDob(currentDate);
  };

  const showDatePicker = () => {
    setShow(true);
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const handleInstitutionSelect = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...institutionList.map(inst => inst.name), "Cancel"], 
          cancelButtonIndex: institutionList.length, 
        },
        (buttonIndex) => {
          if (buttonIndex !== institutionList.length) {
            const selectedInstitution = institutionList[buttonIndex];
            setInstitution(selectedInstitution.id); // Set id
          }
        }
      );
    } else {
      setShowInstitutionPicker(true); 
    }
  };

  const handleProgramSelect = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...programList.map(program => program.name), "Cancel"],
          cancelButtonIndex: programList.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== programList.length) {
            const selectedProgram = programList[buttonIndex];
            setProgramOfStudy(selectedProgram.id); // Set id
          }
        }
      );
    } else {
      setShowProgramPicker(true);
    }
  };

  const handleSignUp = () => {
    setPasswordError("");
    setEmailError("");
    setAllFieldsError("");
    if (!firstName || !surname || !email || !password || !dob || !institution || !program_of_study) {
      setAllFieldsError("Please fill in all fields");
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
    } else {
      axios
        .post(`${ApiUrl}/api/register/`, {
          first_name: firstName,
          last_name: surname,
          email: email,
          password: password,
          dob: dob?.toISOString().substring(0, 10),
          institution: institution,
          program_of_study: program_of_study,
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

  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [show, setShow] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: rMS(16),
      backgroundColor: Colors.light.background,
    },
    inputContainer: {
      width: rS(300),
    },
    picker: {
      height: 50,
      width: rS(300),
      backgroundColor: Colors.light.tint,
    },
    errorMessage: {
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginBottom: rMS(8),
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.container}>
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
          <AnimatedTextInput
            label="Date of Birth"
            value={dateOfBirth ? dateOfBirth.toDateString() : ""}
            placeholderTextColor={themeColors.textSecondary}
            editable={false}
            style={styles.inputContainer}
          />
        </TouchableOpacity>

        {/* Institution field */}
        <TouchableOpacity onPress={handleInstitutionSelect}>
          <AnimatedTextInput
            label="Institution"
            value={institutionList.find(inst => inst.id === institution)?.name || ""}
            editable={false}
            placeholderTextColor={Colors.light.textSecondary}
            style={styles.inputContainer}
          />
        </TouchableOpacity>

        {/* Program of study field */}
        <TouchableOpacity onPress={handleProgramSelect}>
          <AnimatedTextInput
            label="Program of Study"
            value={programList.find(program => program.id === program_of_study)?.name || ""}
            editable={false}
            placeholderTextColor={Colors.light.textSecondary}
            style={styles.inputContainer}
          />
        </TouchableOpacity>

        {/* Show Picker for Android */}
        {showInstitutionPicker && (
          <Picker
            selectedValue={institution}
            onValueChange={(itemValue) => setInstitution(itemValue)}
            style={styles.picker}
          >
            {institutionList.map((inst, index) => (
              <Picker.Item key={index} label={inst.name} value={inst.id} />
            ))}
          </Picker>
        )}

        {showProgramPicker && (
          <Picker
            selectedValue={program_of_study}
            onValueChange={(itemValue) => setProgramOfStudy(itemValue)}
            style={styles.picker}
          >
            {programList.map((program, index) => (
              <Picker.Item key={index} label={program.name} value={program.id} />
            ))}
          </Picker>
        )}

        <VerificationButton onPress={handleSignUp} title="Register" />
      </View>
    </View>
  );
};

export default ContinueWithEmail;
