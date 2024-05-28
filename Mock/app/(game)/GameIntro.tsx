import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import GameButton from "../../components/GameButton";

export default function GameIntro() {
  const [gameCode, setGameCode] = useState("");
  const { userInfo, userToken } = useAuth();

  const joinGame = async () => {
    try {
      const response = await axios.post(`${ApiUrl}:8000/games/${gameCode}/join/`,{}, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      // Check if the response is successful
      if (response.status === 200) {
        // Redirect the user to the waiting screen
        router.navigate({
          pathname: "GameWaiting",
          params: { gameCode: gameCode },
        });
      } else {
        // Handle unsuccessful response
        console.error("Failed to join the game:", response.data);
        // Optionally, display an error message to the user
      }
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error("Error joining the game:", error);
      // Optionally, display an error message to the user
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.topRow}>
          <View style={styles.topContainerText}>
            <Text style={styles.topContainerTitle}>Let's Play</Text>
            <Text style={styles.topContainerSubtitle}>and WIN!</Text>
          </View>
          <Image
            source={require("../../assets/images/game1.png")}
            style={styles.topImage}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.codeCard}>
          <Text style={styles.cardTitle}>Enter your code</Text>
          <Text style={styles.cardSubtitle}>To play with your friends</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={gameCode}
              onChangeText={setGameCode}
              placeholder="Eg: Cx893P"
            />
            <GameButton
              title="Join Game"
              onPress={joinGame}
              disabled={gameCode.length !== 6}
              style={
                gameCode.length === 6
                  ? styles.joinButton
                  : styles.joinButtonDisabled
              }
            />
          </View>
        </View>
        <View style={styles.noCodeContainer}>
          <Text>No Code?</Text>
          <Text style={styles.title}>Start your own game!</Text>
          <GameButton
            title="Create Game"
            onPress={() => router.navigate("GameCourses")}
            style={styles.createButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  topContainer: {
    flex: 2,
    backgroundColor: "#fdecd2",
    justifyContent: "center",
    paddingTop: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  topImage: {
    width: 300, // Make the image bigger
    height: 300,
    resizeMode: "contain", // Maintain aspect ratio
    marginBottom: 16, // Bring the image down a little
    marginLeft: -40,
    marginRight: 80,
  },
  topContainerText: {
    alignItems: "flex-start",
    paddingLeft: 100,
  },
  topContainerTitle: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 0,
  },
  topContainerSubtitle: {
    fontSize: 24,
    color: "#777",
    marginBottom: 90,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  bottomContainer: {
    flex: 2,
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#ffffff",
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  codeCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 30,
    paddingTop: 50,
    marginTop: -100,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "100%",
    height: 240,
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdbbb9",
    borderRadius: 5,
    padding: 6,
    color: "#000",
    height: 40,
    flex: 1,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: "#e1943b",
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  joinButtonDisabled: {
    marginTop: 10,
    backgroundColor: "#ccc", // Custom disabled color
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: "#e1943b",
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noCodeContainer: {
    alignItems: "center",
  },
});
