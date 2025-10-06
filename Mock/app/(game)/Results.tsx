import React, { useMemo, useEffect, useState } from "react"; // Add useEffect and useState
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  useColorScheme,
  BackHandler, // Add BackHandler
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Player, GameDetailsResponse } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import GameButton from "../../components/GameButton";
import { SIZES, rMS, rS, rV } from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../../services/GamesApiCalls";
import { useAdManager } from "../../components/ads/AdManager";

export default function ResultsScreen() {
  const { userInfo, userToken } = useAuth();
  const { gameId, scores: scoresParam } = useLocalSearchParams<{
    gameId: string;
    scores: string;
  }>();
  const { showGameCompletionAd } = useAdManager();
  const [adShown, setAdShown] = useState(false);

  // Show ad when component mounts (game completion) - only once
  useEffect(() => {
    if (!adShown) {
      console.log("Showing game completion ad");
      showGameCompletionAd();
      setAdShown(true);
    }
  }, [showGameCompletionAd, adShown]);

  // Allow back navigation to GameIntro
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(game)/GameIntro");
        return true; // Returning true prevents the default back action
      }
    );
    return () => backHandler.remove(); // Clean up the event listener
  }, []);

  const scores = useMemo(() => {
    try {
      return JSON.parse(typeof scoresParam === "string" ? scoresParam : "{}");
    } catch (e) {
      console.error("Error parsing scores:", e);
      return {};
    }
  }, [scoresParam]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  if (!userInfo) {
    return null;
  }

  const { data: gameDetails } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  const creator = gameDetails?.creator.first_name;
  const creatorId = gameDetails?.creator.id;
  const gameCode = gameDetails?.code;

  const players = useMemo(() => {
    if (!gameDetails?.players) return [];
    return gameDetails.players.map((player) => ({
      id: player.id,
      score: scores[player.id] || "0.0",
      profileName: `${player.first_name} ${player.last_name}`,
      profile_picture:
        player.id === userInfo?.user.id
          ? userInfo.user.profile_picture
          : `${player.profile_picture}`,
    }));
  }, [gameDetails, scores, userInfo]);

  const handleCreateNewGame = () => {
    // Navigate to GameIntro to create a new game
    router.dismissTo("GameIntro");
  };

  const handleBackToHome = () => {
    // Add a back to home option
    router.replace("/(tabs)/home");
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
          title="Back to Home"
          onPress={handleBackToHome}
          style={styles.button}
        />
        <GameButton
          title="Create New Game"
          onPress={handleCreateNewGame}
          style={styles.button}
        />
      </View>
    </View>
  );
}
