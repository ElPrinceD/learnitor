import React, { useEffect, useState } from "react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { getGameDetails, startGame } from "../../GamesApiCalls";
import { queryClient } from "../../QueryClient";
import { useWebSocket } from "../../GameWebSocket";
import { GameDetailsResponse, Player, Question } from "../../components/types";
import ApiUrl from "../../config";

export default function GameWaitingScreen() {
  const { userInfo, userToken } = useAuth();
  const { isCreator, code, id, gameId } = useLocalSearchParams() as {
    isCreator?: string;
    code?: string;
    id?: string;
    gameId?: string;
  };

  if (!userInfo) {
    return null;
  }

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>(code || "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    data: gameDetails,
    error: gameDetailsError,
    refetch: refetchGameDetails,
  } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", id || gameId, userToken?.token],
    queryFn: () => getGameDetails(id || gameId, userToken?.token),
    enabled: !!userToken,
  });

  const goToGame = () => {
    router.navigate({
      pathname: "Game",
      params: {
        questions: JSON.stringify(gameQuestions),
        isCreator: isCreator,
        gameId: gameId || id,
        joinerGameId: id || gameId,
        gameCode: gameCode,
      },
    });
  };

  useWebSocket(
    gameCode,
    userInfo,
    setPlayers,
    goToGame,
    id || gameId,
    userToken
  );

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
    }
  }, [gameDetails]);

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

  const startGameMutation = useMutation<any, any, any>({
    mutationFn: async ({ gameId, token }) => {
      await startGame(id || gameId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gameDetails", id || gameId],
      });
      goToGame();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Error starting game");
    },
  });

  const handleStartGame = async () => {
    startGameMutation.mutate({ gameId: gameId, token: userToken?.token });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    topContainerTitle: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 100,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 18,
    },
    gameCode: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginRight: 10,
    },
    iconButton: {
      marginHorizontal: 5,
    },
    waitingText: {
      color: themeColors.textSecondary,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 18,
    },
    playersList: {
      paddingBottom: 60,
    },
    playerContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      backgroundColor: "transparent",
      marginVertical: 5,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    profileName: {
      color: themeColors.text,
      fontSize: 16,
    },
    startButtonContainer: {
      position: "absolute",
      bottom: 18,
      width: 200,
      alignSelf: "center",
      padding: 10,
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
      <Text style={styles.waitingText}>
        Waiting for other players to join...
      </Text>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        style={styles.playersList}
      />
      {isCreator && (
        <View style={styles.startButtonContainer}>
          <GameButton title="Start Game" onPress={handleStartGame} />
        </View>
      )}
    </View>
  );
}
