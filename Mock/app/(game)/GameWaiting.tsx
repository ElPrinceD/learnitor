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
import axios from "axios";
import ApiUrl from "../../config";
import { Question, Player, GameDetailsResponse } from "../../components/types";
import { SIZES, rMS, rS, rV } from "../../constants";
import Pusher from 'pusher-js/react-native';

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
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get<GameDetailsResponse>(
          `${ApiUrl}/games/${id || gameId}/`,
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
            score: "0",
            profileName: `${player.first_name} ${player.last_name}`,
            profile_picture:
              player.id === userInfo?.user.id
                ? userInfo.user.profile_picture
                : `${ApiUrl}${player.profile_picture}`,
          }));
          setPlayers(newPlayers);
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      }
    };

    if (gameCode && userToken) {
      fetchGameDetails();

      // Initialize Pusher
      const pusher = new Pusher('YOUR_PUSHER_APP_KEY', {
        cluster: 'YOUR_PUSHER_APP_CLUSTER',
        encrypted: true,
      });

      const channel = pusher.subscribe(`game_${gameCode}`);
      
      channel.bind('game.update', (data: any) => {
        console.log('Received game update:', data);
        if (data.players) {
          const newPlayers = data.players.map((player: any) => ({
            id: player.id,
            profileName: `${player.first_name} ${player.last_name}`,
            profile_picture:
              player.id === userInfo?.user.id
                ? userInfo.user.profile_picture
                : `${ApiUrl}${player.profile_picture}`,
          }));

          setPlayers(newPlayers);
        }

        if (data.type === "game.start") {
          console.log("User has received start game ", userInfo?.user.first_name);
          goToGame();
        }
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [gameCode, userToken, gameId, id]);

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
        `${ApiUrl}/games/${id || gameId}/start_game/`,
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
        isCreator: isCreator,
        gameId: gameId || id,
        joinerGameId: id || gameId,
        gameCode: gameCode,
      },
    });
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
