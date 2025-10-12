import React, { useMemo, useEffect, useState, useRef } from "react"; // Add useEffect and useState
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  useColorScheme,
  BackHandler, // Add BackHandler
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Player, GameDetailsResponse } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../../services/GamesApiCalls";
import { useAdManager } from "../../components/ads/AdManager";
import { Ionicons } from "@expo/vector-icons";

export default function ResultsScreen() {
  const { userInfo, userToken } = useAuth();
  const { gameId, scores: scoresParam } = useLocalSearchParams<{
    gameId: string;
    scores: string;
  }>();
  const { showGameCompletionAd } = useAdManager();
  const [adShown, setAdShown] = useState(false);
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string>("");

  // Animation refs for buttons
  const homeButtonScale = useRef(new Animated.Value(1)).current;
  const newGameButtonScale = useRef(new Animated.Value(1)).current;

  // Show ad when component mounts (game completion) - only once
  useEffect(() => {
    if (!adShown) {
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

  const { data: gameDetails, error: gameDetailsError } = useQuery<
    GameDetailsResponse,
    Error
  >({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  // Handle errors and set user-friendly messages
  useEffect(() => {
    if (gameDetailsError) {
      if (gameDetailsError.message.includes("404")) {
        setError("Game results not found. Please try again.");
      } else if (gameDetailsError.message.includes("403")) {
        setError("You don't have permission to view these results.");
      } else if (gameDetailsError.message.includes("network")) {
        setError("Connection failed. Please check your internet connection.");
      } else {
        setError("Unable to load results. Please try again later.");
      }
    } else {
      setError(""); // Clear error when successful
    }
  }, [gameDetailsError]);

  const creator = gameDetails?.creator.first_name;
  const creatorId = gameDetails?.creator.id;
  const gameCode = gameDetails?.code;

  const players = useMemo(() => {
    if (!gameDetails?.players) return [];
    const playersList = gameDetails.players.map((player) => ({
      id: player.id,
      score: scores[player.id] || "0.0",
      profileName: `${player.first_name} ${player.last_name}`,
      profile_picture:
        player.id === userInfo?.user.id
          ? userInfo.user.profile_picture
          : `${player.profile_picture}`,
      isWinner: false,
    }));

    // Sort by score to find winners
    playersList.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    // Mark all players with the highest score as winners
    if (playersList.length > 0) {
      const highestScore = parseFloat(playersList[0].score);
      playersList.forEach((player) => {
        if (parseFloat(player.score) === highestScore) {
          player.isWinner = true;
        }
      });
    }

    return playersList;
  }, [gameDetails, scores, userInfo]);

  // Count winners to show tie message
  const winnerCount = useMemo(() => {
    return players.filter((player) => player.isWinner).length;
  }, [players]);

  const handleCreateNewGame = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(newGameButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(newGameButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to GameIntro to create a new game
    router.dismissTo("GameIntro");
  };

  const handleBackToHome = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(homeButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(homeButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
    tieTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      marginTop: 40,
      color: "#FFD700",
      textDecorationLine: "underline",
      textShadowColor: "#FFD700",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
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
      position: "relative",
    },
    winnerContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: rMS(12),
      backgroundColor: "#FFD700" + "25",
      marginVertical: rV(5),
      borderRadius: rMS(12),
      borderWidth: 2,
      borderColor: "#FFD700",
      position: "relative",
      shadowColor: "#FFD700",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
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
      paddingTop: rV(5),
      paddingBottom: Math.max(rV(20), insets.bottom + rV(10)), // Use safe area bottom + padding
      paddingHorizontal: rMS(20),
      gap: rS(16),
    },
    button: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      paddingVertical: rV(16),
      paddingHorizontal: rMS(20),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight: rV(60),
    },
    homeButton: {
      backgroundColor: themeColors.tint + "20",
      borderColor: themeColors.tint,
    },
    newGameButton: {
      backgroundColor: themeColors.text + "20",
      borderColor: themeColors.text,
    },
    buttonText: {
      fontSize: rMS(16),
      fontWeight: "bold",
      color: themeColors.text,
      marginLeft: rS(8),
    },
    homeButtonText: {
      color: themeColors.tint,
    },
    newGameButtonText: {
      color: themeColors.text,
    },
    buttonIcon: {
      marginRight: rS(4),
    },
    errorMessage: {
      alignSelf: "center",
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginVertical: rV(16),
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
    crownIcon: {
      position: "absolute",
      top: -rV(8),
      right: rS(8),
      zIndex: 1,
      shadowColor: "#FFD700",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.5,
      shadowRadius: 2,
      elevation: 3,
    },
    winnerText: {
      color: "#FFD700",
      fontWeight: "bold",
    },
  });

  const renderPlayer = ({ item }: { item: any }) => {
    const isWinner = item.isWinner;
    const containerStyle = isWinner
      ? styles.winnerContainer
      : styles.playerContainer;
    const scoreStyle = isWinner
      ? [styles.profileName, styles.winnerText]
      : styles.profileName;

    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: item.profile_picture }}
          style={styles.profileImage}
          onError={() =>
            console.log(item.profile_picture, "Error loading picture")
          }
        />
        <Text style={styles.profileName}>{item.profileName}: </Text>
        <Text style={scoreStyle}>{item.score}</Text>
        {isWinner && (
          <Ionicons
            name="trophy"
            size={26}
            color="#FFD700"
            style={styles.crownIcon}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorMessage}>{error}</Text>
      ) : (
        <>
          <Text style={styles.topContainerTitle}>{creator}'s Arena</Text>
          <Text style={winnerCount > 1 ? styles.tieTitle : styles.title}>
            {winnerCount > 1 ? `Tie! ${winnerCount} Winners` : "Scores"}
          </Text>
        </>
      )}
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.playersList}
      />
      <View style={styles.buttonContainer}>
        <Animated.View
          style={{ transform: [{ scale: homeButtonScale }], flex: 1 }}
        >
          <TouchableOpacity
            onPress={handleBackToHome}
            style={[styles.button, styles.homeButton]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="home"
              size={24}
              color={themeColors.tint}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, styles.homeButtonText]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{ transform: [{ scale: newGameButtonScale }], flex: 1 }}
        >
          <TouchableOpacity
            onPress={handleCreateNewGame}
            style={[styles.button, styles.newGameButton]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="game-controller"
              size={24}
              color={themeColors.text}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, styles.newGameButtonText]}>
              New Game
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
