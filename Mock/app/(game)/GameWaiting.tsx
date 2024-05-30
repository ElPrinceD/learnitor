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
import axios from 'axios';
import ApiUrl from "../../config"; // Ensure this points to your API configuration
import  SSE  from 'react-native-sse'; // Import the SSE library

// Define the type for a player
type Player = {
  id: number;
  profilePicture: string;
  profileName: string;
};

export default function GameWaitingScreen() {
  const { userInfo, userToken } = useAuth();
  const { isCreator, code, id } = useLocalSearchParams();
  const [gameCode, setGameCode] = useState<string>(code || "");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    console.log(id)
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get(`${ApiUrl}:8000/games/${id}/`,{
          headers: { Authorization: `Token ${userToken?.token}` },
        });
        
        const { data } = response;
        if (data.players) {
          const newPlayers = data.players.map((player: any) => ({
            id: player.id,
            profileName: `${player.first_name} ${player.last_name}`,
            profilePicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg/330px-Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg", // Placeholder URL, update as needed
          }));
          setPlayers(newPlayers);
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      }
    };

    // Call the fetch function when gameCode changes
    if (gameCode) {
      fetchGameDetails();
    }
    const sse = new SSE(`${ApiUrl}:8000/games/${gameCode}/sse/`);

    sse.addEventListener('open', () => {
        console.log('SSE connection opened');
    });

    sse.addEventListener('error', (error) => {
        console.error('SSE connection error:', error);
    });

    sse.addEventListener('message', (event) => {
        
        try {
            const data = JSON.parse(event.data);
            
            if (data.players) {
                const newPlayers = data.players.map((player: any) => ({
                    id: player.id,
                    profileName: `${player.first_name} ${player.last_name}`,
                    profilePicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg/330px-Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg", // Placeholder URL, update as needed
                }));

                setPlayers(newPlayers); // Update player list with both existing and newly joined players
            }
        } catch (error) {
            console.error("Error parsing JSON data:", error);
        }
    });

    // Close SSE connection on component unmount
    return () => {
        sse.close();
    };

}, [gameCode]); // Trigger useEffect whenever gameCode changes



  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gameCode);
    Toast.show("Game code copied", {
      duration: Toast.durations.LONG,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
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
    console.log("Game started");
    // Implement the logic to start the game
  };


  // console.log(players)
  // console.log(gameCode)

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerContainer}>
      <Image source={{ uri: item.profilePicture }} style={styles.profileImage} />
      <Text style={styles.profileName}>{item.profileName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.topContainerTitle}>{userInfo?.user.first_name}'s Arena</Text>
      <View style={styles.header}>
        <Text style={styles.gameCode}>{gameCode}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={shareGameCode} style={styles.iconButton}>
          <Ionicons
            name={Platform.OS === "ios" ? "share-outline" : "share-social-sharp"}
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
