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
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { getGameDetails, startGame } from "../../services/GamesApiCalls";
import WsUrl from "../../configWs";
import ErrorMessage from "../../components/ErrorMessage";

export default function GameWaitingScreen() {
  const { userInfo, userToken } = useAuth();
  const { isCreator, code, id, gameId } = useLocalSearchParams() as {
    isCreator?: string;
    code?: string;
    id?: string;
    gameId?: string;
  };
  const insets = useSafeAreaInsets();

  if (!userInfo) return null;

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>(code || "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [wsError, setWsError] = useState<string>("");
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsConnectionAttempts, setWsConnectionAttempts] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const ws = useRef<WebSocket | null>(null);

  const {
    data: gameDetails,
    error: gameDetailsError,
    refetch: refetchGameDetails,
  } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", id || gameId, userToken?.token],
    queryFn: () => getGameDetails(id || gameId, userToken?.token),
    enabled: !!userToken,
  });

  // Handle errors and set user-friendly messages
  useEffect(() => {
    if (gameDetailsError) {
      if (gameDetailsError.message.includes("404")) {
        setError("Game not found. Please check the game code and try again.");
      } else if (gameDetailsError.message.includes("403")) {
        setError("You don't have permission to access this game.");
      } else if (gameDetailsError.message.includes("network")) {
        setError("Connection failed. Please check your internet connection.");
      } else {
        setError("Unable to load game. Please try again later.");
      }
    } else {
      setError(""); // Clear error when successful
    }
  }, [gameDetailsError]);

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
          profileName: player.first_name,
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

  // Handle back navigation - go to GameIntro
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(game)/GameIntro"); // Go directly to GameIntro
        return true; // Prevent default back action
      }
    );
    return () => backHandler.remove();
  }, []);

  const goToGame = useCallback(() => {
    router.navigate({
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

    setWsConnectionAttempts((prev) => prev + 1);
    setWsError("");

    // Optional: Add token if using token-based auth
    ws.current = new WebSocket(
      `${WsUrl}/ws/games/${gameCode}/ws/?token=${userToken?.token}`
    );
    //ws.current = new WebSocket(`${WsUrl}/ws/games/${gameCode}/ws/`);

    ws.current.onopen = () => {
      setWsConnected(true);
      setWsError("");
      setWsConnectionAttempts(0);
      ws.current?.send(JSON.stringify({ type: "join_game" }));
    };

    ws.current.onerror = (error) => {
      setWsConnected(false);
      const errorMsg = `WebSocket connection failed (attempt ${
        wsConnectionAttempts + 1
      }). Error: ${error?.type || "Unknown error"}`;
      setWsError(errorMsg);

      // Don't show WebSocket connection errors to users - they're not actionable

      // Retry connection after delay
      setTimeout(() => {
        if (wsConnectionAttempts < 5) {
          // Limit retry attempts
          connectWebSocket();
        } else {
          setWsError(
            "WebSocket connection failed after 5 attempts. Please check your internet connection."
          );
        }
      }, 5000);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "game.finished") {
          if (ws.current) {
            ws.current.close();
          }
        } else if (
          data.type === "game.update" ||
          data.type === "game.players" ||
          data.type === "player.joined" ||
          data.type === "player.left"
        ) {
          const payload = data.data || data;

          if (payload.players) {
            const newPlayers = payload.players.map((player) => ({
              id: player.id,
              score: "0",
              profileName: player.first_name,
              profile_picture:
                player.id === userInfo?.user.id
                  ? userInfo.user.profile_picture
                  : `${ApiUrl}${player.profile_picture}`,
            }));
            setPlayers(newPlayers);
          }

          if (payload.started && !payload.ended) {
            goToGame();
          }
        } else if (data.type === "game.start") {
          goToGame();
        } else if (data.type === "game.state") {
          // Handle game state updates
          const payload = data.data || data;
          if (payload.players) {
            const newPlayers = payload.players.map((player) => ({
              id: player.id,
              score: "0",
              profileName: player.first_name,
              profile_picture:
                player.id === userInfo?.user.id
                  ? userInfo.user.profile_picture
                  : `${ApiUrl}${player.profile_picture}`,
            }));
            setPlayers(newPlayers);
          }

          if (payload.started && !payload.ended) {
            goToGame();
          }
        }
      } catch (error) {
        const errorMsg = `Failed to parse WebSocket message: ${
          error instanceof Error ? error.message : "Unknown parsing error"
        }`;
        setWsError(errorMsg);

        // Don't show WebSocket parsing errors to users - they're not actionable
      }
    };

    ws.current.onclose = (event) => {
      setWsConnected(false);
      ws.current = null;

      if (event.code !== 1000) {
        // Not a normal closure
        const errorMsg = `WebSocket connection closed unexpectedly. Code: ${
          event.code
        }, Reason: ${event.reason || "No reason provided"}`;
        setWsError(errorMsg);
      }
    };
  }, [gameCode, userInfo, goToGame]);

  useEffect(() => {
    connectWebSocket();

    // Periodic refresh of game details to ensure creator sees all players
    const refreshInterval = setInterval(() => {
      if (gameCode && userToken?.token) {
        refetchGameDetails();
      }
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(refreshInterval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket, gameCode, userToken, refetchGameDetails]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gameCode);
    Toast.show("Game code copied", { duration: Toast.durations.LONG });
  };

  const shareGameCode = async () => {
    try {
      await Share.share({
        message: `POV: You're about to lose😏 https://elevay.online/GameIntro?code=${gameCode}`,
        url: `https://elevay.online/GameIntro?code=${gameCode}`,
      });
    } catch (error) {
      setErrorMessage("Failed to share game code. Please try again.");
    }
  };

  const startGameMutation = useMutation<any, any, any>({
    mutationFn: async ({ gameId, token }) => {
      const response = await startGame(gameId, token);
      return response;
    },
    onSuccess: () => {
      goToGame();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Error starting game");
    },
  });

  const handleStartGame = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ type: "start_game" }));
        setWsError(""); // Clear any previous errors
      } catch (error) {
        const errorMsg = `Failed to send start_game message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setWsError(errorMsg);

        // Show user-friendly error for game start failure
        setErrorMessage("Unable to start the game. Please try again.");
      }
    } else {
      const errorMsg = `WebSocket is not connected (state: ${
        ws.current?.readyState || "null"
      }). Cannot start game via WebSocket.`;
      setWsError(errorMsg);

      // Show user-friendly error for connection issues
      setErrorMessage("Connection issue. Trying alternative method...");

      // Fallback: try to start game via API
      if (userToken?.token) {
        startGameMutation.mutate({
          gameId: gameId || id,
          token: userToken.token,
        });
      }
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
      bottom: Math.max(rS(18), insets.bottom + rS(10)), // Use safe area bottom + padding
      width: rS(200),
      alignSelf: "center",
      padding: rMS(10),
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    multiplayerMessage: {
      color: themeColors.textSecondary,
      fontSize: SIZES.medium,
      textAlign: "center",
      padding: rMS(15),
      backgroundColor: themeColors.card,
      borderRadius: rMS(10),
      borderWidth: 1,
      borderColor: themeColors.border,
    },
  });

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerContainer}>
      <Image
        source={
          item.profile_picture
            ? { uri: item.profile_picture }
            : require("../../../Mock/assets/images/profile-placeholder.png")
        }
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
        <>
          {players.length < 2 ? (
            <View style={styles.startButtonContainer}>
              <Text style={styles.multiplayerMessage}>
                Invite at least one more player to start the game
              </Text>
            </View>
          ) : (
            <GameButton
              title="Start Game"
              onPress={handleStartGame}
              style={styles.startButtonContainer}
            />
          )}
        </>
      )}
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
}
