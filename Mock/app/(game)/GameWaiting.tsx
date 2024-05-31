import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Share,
  useColorScheme,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-root-toast";
import { useAuth } from "../../components/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import GameButton from "../../components/GameButton";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import axios from "axios";
import ApiUrl from "../../config";
import RNEventSource from "react-native-event-source";
import { Question } from "../../components/types";

// Define the type for a player
type Player = {
  id: number;
  profilePicture: string;
  profileName: string;
};

// Define the type for the game details response
type GameDetailsResponse = {
  creator: { first_name: string; id: number };
  players: { id: number; first_name: string; last_name: string }[];
  questions: Question[];
  code: string;
};

export default function GameWaitingScreen() {
  const { userInfo, userToken } = useAuth();
  const { isCreator, code, id, gameId } = useLocalSearchParams() as {
    isCreator?: string;
    code?: string;
    id?: string;
    gameId?: string;
  };

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>(code || "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get<GameDetailsResponse>(
          `${ApiUrl}:8000/games/${id || gameId}/`,
          {
            headers: { Authorization: `Token ${userToken?.token}` },
          }
        );

        const { data } = response;
        setGameQuestions(data.questions);
        setCreator(data.creator.first_name);
        setCreatorId(data.creator.id);
        setGameCode(data.code);

        if (data.players) {
          const newPlayers = data.players.map((player) => ({
            id: player.id,
            profileName: `${player.first_name} ${player.last_name}`,
            profilePicture:
              "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg/330px-Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg", // Placeholder URL, update as needed
          }));
          setPlayers(newPlayers);
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      }
    };

    if (code && gameCode && userToken) {
      fetchGameDetails();

      const eventSource = new RNEventSource(
        `${ApiUrl}:8000/games/${gameCode}/sse/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,

            // Connection: "keep-alive",
            // "Content-Type": "application/json",
            // "Cache-Control": "no-cache",
            // "Access-Control-Allow-Origin": "*",
          },
        }
      );

      eventSource.addEventListener("open", () => {
        console.log("SSE connection opened");
      });

      eventSource.addEventListener("message", (event) => {
        console.log("(DATA):", event);
        try {
          const data = event.data;

          if (data.players) {
            const newPlayers = data.players.map((player: any) => ({
              id: player.id,
              profileName: `${player.first_name} ${player.last_name}`,
              profilePicture:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg/330px-Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg", // Placeholder URL, update as needed
            }));

            setPlayers(newPlayers); // Update player list with both existing and newly joined players
          }
          if (data.event === "start_game") {
            goToGame();
            // Close the SSE connection
          }
        } catch (error) {
          console.error("Error parsing JSON data:", error);
        }
      });

      eventSource.addEventListener("error", (event) => {
        console.error("SSE connection error:", event);
      });

      // Close SSE connection on component unmount
      return () => {
        eventSource.close();
      };
    }
  }, [gameCode || code, userToken]);

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

  const handleStartGame = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}:8000/games/${gameId}/start_game/`,
        {},
        {
          headers: { Authorization: `Token ${userToken?.token}` },
        }
      );
      if (response.status === 200) {
        console.log("Game started");
        goToGame();
      }
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const goToGame = () => {
    router.navigate({
      pathname: "Game",
      params: {
        questions: JSON.stringify(gameQuestions),
        gameId: gameId || id,
        isCreator: isCreator,
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    topContainerTitle: {
      color: themeColors.text,
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
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginRight: 10,
    },
    iconButton: {
      padding: 5,
      backgroundColor: "transparent",
      borderRadius: 5,
    },
    waitingText: {
      color: themeColors.textSecondary,
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
      color: themeColors.text,
      fontSize: 16,
    },
    startButtonContainer: {
      position: "absolute",
      bottom: 20,
      width: 250,
      alignSelf: "center",
      backgroundColor: themeColors.buttonBackground,
      padding: 15,
      borderRadius: 5,
      marginHorizontal: 10,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
  });

  const renderPlayer = ({ item }: { item: Player }) => (
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
        {isCreator ? userInfo?.user.first_name : creator}'s Arena
      </Text>
      <View style={styles.header}>
        <Text style={styles.gameCode}>{gameCode}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={30} color={themeColors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={shareGameCode} style={styles.iconButton}>
          <Ionicons
            name={
              Platform.OS === "ios" ? "share-outline" : "share-social-sharp"
            }
            size={30}
            color={themeColors.icon}
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
      {(isCreator || creatorId === userInfo?.user.id) && (
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
