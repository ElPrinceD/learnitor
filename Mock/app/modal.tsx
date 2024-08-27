import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import Notification from "../components/notification";
import { Text, View } from "@/components/Themed";
import React from "react";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.notificationsContainer}>
        <Notification
          
          message="This is a notification message!"
          onPress={() => console.log('Notification dismissed!')}
        />
        <Notification
          
          message="This is a notification!"
          onPress={() => console.log('Notification dismissed!')}
        />
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start", // Align items at the top
    paddingTop: Platform.OS === 'ios' ? 10 : 0, // Adjust paddingTop for iOS to avoid status bar overlap
  },
  notificationsContainer: {
    width: '100%', // Ensure notifications take full width
    paddingHorizontal: 16, // Add horizontal padding
    marginTop: Platform.OS === 'ios' ? 0 : 0, // Adjust marginTop for iOS to avoid status bar overlap
  },
});
