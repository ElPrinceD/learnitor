import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config.js";
import axios from "axios";

const AccountSettings = () => {
  // State variables for input fields
  const { userInfo, userToken } = useAuth();
  const defaultFirstName = userInfo?.user.first_name;
  const defaultLastName = userInfo?.user.last_name;
  const id = userInfo?.user.id
  const defaultemail = userInfo?.user.email;
  const defaultdob = userInfo?.user.dob;
  const defaultStreet1 = userInfo?.user.address.street_1;
  const defaultStreet2 = userInfo?.user.address.street_2;
  const defaultRegion = userInfo?.user.address.region
  const defaultCity = userInfo?.user.address.city;
  const defaultCountry = userInfo?.user.address.country;
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [dob, setDOB] = useState(defaultdob);
  const [email, setEmail] = useState(defaultemail);
  const [street1, setStreet1] = useState(defaultStreet1);
  const [street2, setStreet2] = useState(defaultStreet2);
  const [city, setCity] = useState(defaultCity);
  const [region, setRegion] = useState(defaultRegion);
  const [country, setCountry] = useState(defaultCountry);
  const [instituteName, setInstituteName] = useState("");

  const handleUpdateInfo = async () => {
    
    const config = {
      headers: {
        Authorization: `Token ${userToken?.token}`,
      },
    };  
    try {
      // Send update request to the user update endpoint
      await axios.put(`${ApiUrl}:8000/api/update/user/${userInfo?.user.id}/`, {
        first_name: firstName,
        last_name: lastName,
        email: email,
        dob: dob,
      }, config);

      // Send update request to the address update endpoint
      await axios.put(`${ApiUrl}:8000/api/update/user/address/`, {
        street_1: street1,
        street_2: street2,
        city: city,
        region: region,
        country: country,
      }, config);

      // Handle success scenario
      console.log("Update successful");
    } catch (error) {
      // Handle error scenario
      console.error("Error updating information:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Personal Info</Text>
        {/* Input fields */}
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={dob}
          onChangeText={setDOB}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.subTitle}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street 1"
          value={street1}
          onChangeText={setStreet1}
        />
        <TextInput
          style={styles.input}
          placeholder="Street 2"
          value={street2}
          onChangeText={setStreet2}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="Region"
          value={region}
          onChangeText={setRegion}
        />
        <TextInput
          style={styles.input}
          placeholder="Country"
          value={country}
          onChangeText={setCountry}
        />
        <Text style={styles.subTitle}>Institution Info</Text>
        <TextInput
          style={styles.input}
          placeholder="School Name"
          value={instituteName}
          onChangeText={setInstituteName}
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdateInfo}>
          <Text style={styles.buttonText}>Update Personal Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#838282",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderTopWidth: 0, // Hide top border
    borderRightWidth: 0, // Hide right border
    borderLeftWidth: 0,
    borderBottomWidth: 1,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#262626",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AccountSettings;
