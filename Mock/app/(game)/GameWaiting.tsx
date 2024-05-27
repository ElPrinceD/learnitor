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
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-root-toast";
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
        profilePicture:
          "https://www.thetimes.co.uk/imageserver/image/%2Fmethode%2Ftimes%2Fprod%2Fweb%2Fbin%2F7bb37908-ad1f-433e-a45f-5fb29f3995fe.jpg?crop=4512%2C2538%2C487%2C225&resize=1200",
        profileName: "Nkunku",
      },
      {
        id: 2,
        profilePicture:
          "https://i2-prod.football.london/incoming/article28357181.ece/ALTERNATES/s1200c/0_conor-gallagher-chelsea.jpg",
        profileName: "Gallagher",
      },
      {
        id: 3,
        profilePicture:
          "https://i2-prod.football.london/incoming/article28069737.ece/ALTERNATES/s615/0_GettyImages-1779855118.jpg",
        profileName: "T. Silva",
      },
    ];
    setPlayers(dummyPlayers);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gameCode);
    Toast.show("Game code copied", {
      duration: Toast.durations.LONG,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
      //   backgroundColor: "#fdecd2",
      opacity: 0.8,
    });
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
      <Text style={styles.topContainerTitle}>
        {userInfo?.user.first_name}'s Arena
      </Text>
      <View style={styles.header}>
        <Text style={styles.gameCode}>{gameCode}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={shareGameCode} style={styles.iconButton}>
          <Ionicons
            name={
              Platform.OS === "ios" ? "share-outline" : "share-social-sharp"
            }
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.waitingText}>Waiting for others...</Text>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.playersList}
      />
      {isCreator && (
        <View>
          <GameButton
            title="Start Game"
            onPress={handleStartGame}
            style={styles.startButtonContainer}
          />
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
  topContainerTitle: {
    fontSize: 40,
    fontWeight: "bold",
    marginTop: 140,
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
    marginHorizontal: 0,
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
    backgroundColor: "transparent",
    borderRadius: 10,
    marginVertical: 5,
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
    width: 250,
    alignSelf: "center",
    backgroundColor: "#e1943b",
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 10,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
