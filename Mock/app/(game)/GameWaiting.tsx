import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Share,
  Dimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../components/AuthContext";
import { useLocalSearchParams } from "expo-router";
import GameButton from "../../components/GameButton";
import { Ionicons } from "@expo/vector-icons";

export default function GameWaitingScreen() {
  const { userInfo } = useAuth(); // Assuming useAuth provides user information
  const { isCreator } = useLocalSearchParams();
  const [gameCode, setGameCode] = useState("");
  const [players, setPlayers] = useState<
    { id: number; profilePicture: string; profileName: string }[]
  >([]);

  useEffect(() => {
    generateGameCode();
    fetchDummyPlayers();
  }, []);

  const generateGameCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
  };

  const fetchDummyPlayers = () => {
    // Dummy data for players
    const dummyPlayers = [
      {
        id: 1,
        profilePicture: "https://via.placeholder.com/50",
        profileName: "Player 1",
      },
      {
        id: 2,
        profilePicture: "https://via.placeholder.com/50",
        profileName: "Player 2",
      },
      {
        id: 3,
        profilePicture: "https://via.placeholder.com/50",
        profileName: "Player 3",
      },
    ];
    setPlayers(dummyPlayers);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gameCode);
    alert("Game code copied to clipboard!");
  };

  const shareGameCode = async () => {
    try {
      await Share.share({
        message: `Join my game with this code: ${gameCode}`,
      });
    } catch (error) {
      console.error("Error sharing game code:", error);
    }
  };

  const handleStartGame = () => {
    // Logic to start the game
    console.log("Game started");
  };

  const renderPlayer = ({ item }) => (
    <View style={styles.playerContainer}>
      <Image
        source={{ uri: item.profilePicture }}
        style={styles.profileImage}
      />
      <Text style={styles.profileName}>{item.profileName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameCode}>{gameCode}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={shareGameCode} style={styles.iconButton}>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.waitingText}>Waiting For others</Text>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.playersList}
      />
      {isCreator && (
        <View style={styles.startButtonContainer}>
          <GameButton title="Start Game" onPress={handleStartGame} />
        </View>
      )}
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  gameCode: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10,
  },
  iconButton: {
    padding: 10,
    backgroundColor: "transparent",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  iconText: {
    color: "#ffffff",
    fontSize: 16,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  playersList: {
    paddingBottom: 80, // Add padding to ensure the last player is not obscured by the start button
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
  },
  startButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: screenWidth / 2 - 75, // Center the button
    width: 150,
  },
});
