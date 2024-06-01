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

export default function ResultsScreen() {
  const { userInfo, userToken } = useAuth();
  const { score: scoreParam, gameId } = useLocalSearchParams<{
    score: string;
    gameId: string;
  }>();

  const score = typeof scoreParam === "string" ? scoreParam : "0";

  const [creator, setCreator] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<number | undefined>();
  const [gameCode, setGameCode] = useState<string>();
  const [players, setPlayers] = useState<Player[]>([]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get<GameDetailsResponse>(
          `${ApiUrl}:8000/games/${gameId}/`,
          {
            headers: { Authorization: `Token ${userToken?.token}` },
          }
        );

        const { data } = response;
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
      padding: 16,
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
      fontSize: 40,
      fontWeight: "bold",
      marginTop: 140,
      alignSelf: "flex-start",
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
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 30,
    },
    button: {
      flex: 1,
      backgroundColor: themeColors.buttonBackground,
      borderRadius: 5,
      marginHorizontal: 8,
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
      <Text style={styles.profileName}>{item.profileName}: </Text>
      <Text style={styles.profileName}>{score}</Text>
    </View>
  );

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
          // onPress={handleStartGame}
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
