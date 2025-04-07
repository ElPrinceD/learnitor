import React, { useEffect, useState, useRef, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-root-toast";
import { useAuth } from "../../components/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import GameButton from "../../components/GameButton";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import ApiUrl from "../../config";
import { Question, Player, GameDetailsResponse } from "../../components/types";
import { SIZES, rMS, rS, rV } from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../../GamesApiCalls";
import WsUrl from "../../configWs";

export default function GameWaitingScreen() {
  const { userInfo, userToken } = useAuth();
  const { isCreator, code, id, gameId } = useLocalSearchParams() as {
    isCreator?: string;
    code?: string;
    id?: string;
    gameId?: string;
  };

  if (!userInfo) return null;

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>(code || "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const ws = useRef<WebSocket | null>(null);

  const { data: gameDetails, error: gameDetailsError } = useQuery<
    GameDetailsResponse,
    Error
  >({
    queryKey: ["gameDetails", id || gameId, userToken?.token],
    queryFn: () => getGameDetails(id || gameId, userToken?.token),
    enabled: !!userToken,
  });

  useEffect(() => {
    if (gameDetails) {
      setGameQuestions(gameDetails.questions);
      setCreator(gameDetails.creator.first_name);
      setCreatorId(gameDetails.creator.id);
      setGameCode(gameDetails.code);
      if (gameDetails.players) {
        const newPlayers = gameDetails.players.map((player) => ({
          id: player.id,
          score: "0",
          profileName: `${player.first_name} ${player.last_name}`,
          profile_picture:
            player.id === userInfo?.user.id
              ? userInfo.user.profile_picture
              : `${ApiUrl}${player.profile_picture}`,
        }));
        setPlayers(newPlayers);
      }
      setLoading(false);
    }
  }, [gameDetails, userInfo]);

  const goToGame = useCallback(() => {
    router.push({
      pathname: "Game",
      params: {
        questions: JSON.stringify(gameQuestions),
        isCreator,
        gameId: gameId || id,
        joinerGameId: id || gameId,
        gameCode,
      },
    });
  }, [gameQuestions, isCreator, gameId, id, gameCode]);

  const connectWebSocket = useCallback(() => {
    if (!gameCode || ws.current) return;

    // Optional: Add token if using token-based auth
    ws.current = new WebSocket(
      `${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken?.token}`
    );
    //ws.current = new WebSocket(`${WsUrl}/ws/games/${gameCode}/ws/`);

    ws.current.onopen = () => {
      console.log("WebSocket connection opened");
      ws.current.send(JSON.stringify({ type: "join_game" }));
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setTimeout(connectWebSocket, 5000);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "game.finished") {
          console.log("Game finished. Closing connection...");
          if (ws.current) {
            ws.current.close();
          }
          // Optionally navigate to a summary or results screen instead of the game screen.
        } else if (
          data.type === "game.update" ||
          data.type === "game.players"
        ) {
          const payload = data.data || data;
          if (payload.players) {
            const newPlayers = payload.players.map((player) => ({
              id: player.id,
              profileName: `${player.first_name} ${player.last_name}`,
              profile_picture:
                player.id === userInfo?.user.id
                  ? userInfo.user.profile_picture
                  : `${ApiUrl}${player.profile_picture}`,
            }));
            setPlayers(newPlayers);
          }
          // Only call goToGame if the game has been started and not ended.
          if (payload.started && !payload.ended) {
            console.log("Game started via update");
            goToGame();
          }
        } else if (data.type === "game.start") {
          console.log("Received game.start message");
          goToGame();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
      ws.current = null;
    };
  }, [gameCode, userInfo, goToGame]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        // ws.current.close();
      }
    };
  }, [connectWebSocket]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gameCode);
    Toast.show("Game code copied", { duration: Toast.durations.LONG });
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
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "start_game" }));
    } else {
      console.error("WebSocket is not open");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(10),
    },
    topContainerTitle: {
      color: themeColors.text,
      fontSize: SIZES.xxxLarge,
      fontWeight: "bold",
      marginTop: rV(100),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: rV(18),
    },
    gameCode: {
      color: themeColors.text,
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginRight: rS(10),
    },
    iconButton: {
      marginHorizontal: rS(5),
    },
    waitingText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.large,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: rV(18),
    },
    playersList: {
      paddingBottom: rV(60),
    },
    playerContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: rMS(10),
      backgroundColor: "transparent",
      marginVertical: rV(5),
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: rS(15),
    },
    profileName: {
      color: themeColors.text,
      fontSize: SIZES.medium,
    },
    startButtonContainer: {
      position: "absolute",
      bottom: rS(18),
      width: rS(200),
      alignSelf: "center",
      padding: rMS(10),
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
  });

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerContainer}>
      <Image
        source={{ uri: item.profile_picture }}
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
      {gameDetailsError && (
        <Text
          style={{ color: "red", textAlign: "center", marginBottom: rV(10) }}
        >
          {gameDetailsError.message}
        </Text>
      )}
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.tint} />
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.playersList}
        />
      )}
      {(isCreator || creatorId === userInfo?.user.id) && (
        <GameButton
          title="Start Game"
          onPress={handleStartGame}
          style={styles.startButtonContainer}
        />
      )}
    </View>
  );
}
