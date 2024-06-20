import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  useColorScheme,
} from "react-native";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { Player, GameDetailsResponse } from "../../components/types";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import GameButton from "../../components/GameButton";
import { SIZES, rMS, rS, rV } from "../../constants";

export default function ResultsScreen() {
  const { userInfo, userToken } = useAuth();
  const {
    score: scoreParam,
    gameId,
    scores: scoresParam,
  } = useLocalSearchParams<{
    score: string;
    gameId: string;
    scores: string;
  }>();

  const score = typeof scoreParam === "string" ? scoreParam : "0";
  const scores = JSON.parse(
    typeof scoresParam === "string" ? scoresParam : "{}"
  );

  console.log(scores);

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>();
  const [players, setPlayers] = useState<Player[]>([]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  if (!userInfo) {
    return null;
  }

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get<GameDetailsResponse>(
          `${ApiUrl}/games/${gameId}/`,
          {
            headers: { Authorization: `Token ${userToken?.token}` },
          }
        );

        const { data } = response;
        setCreator(data.creator.first_name);
        setCreatorId(data.creator.id);
        setGameCode(data.code);

        console.log(data.players);
        if (data.players) {
          const newPlayers = data.players.map((player) => ({
            id: player.id,
            score: scores[player.id] || "0.0",
            profileName: `${player.first_name} ${player.last_name}`,
            profile_picture: player.profile_picture,
          }));
          setPlayers(newPlayers);
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      }
    };

    fetchGameDetails();
  }, [gameId, userToken]);

  const handleCreateNewGame = () => {
    router.navigate("GameIntro");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(10),
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      marginTop: 40,
      color: themeColors.text,
      textDecorationLine: "underline",
    },
    topContainerTitle: {
      color: themeColors.text,
      fontSize: SIZES.xxxLarge,
      fontWeight: "bold",
      marginTop: rV(100),
      alignItems: "flex-start",
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
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: rV(28),
      gap: rS(5),
    },
    button: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
  });

  const renderPlayer = ({ item }: { item: Player }) => {
    return (
      <View style={styles.playerContainer}>
        <Image
          source={{ uri: item.profile_picture }}
          style={styles.profileImage}
          onError={() =>
            console.log(item.profile_picture, "Error loading picture")
          }
        />
        <Text style={styles.profileName}>{item.profileName}: </Text>
        <Text style={styles.profileName}>{item.score}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.topContainerTitle}>{creator}'s Arena</Text>
      <Text style={styles.title}>Scores</Text>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.playersList}
      />
      <View style={styles.buttonContainer}>
        <GameButton
          title="Replay"
          //onPress={handleReplayGame}
          style={styles.button}
        />
        <GameButton
          title="Create a New Game"
          onPress={handleCreateNewGame}
          style={styles.button}
        />
      </View>
    </View>
  );
}
