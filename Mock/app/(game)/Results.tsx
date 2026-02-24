import React, { useMemo, useEffect, useState, useRef } from "react"; // Add useEffect and useState
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme,
  BackHandler,
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
const STAGGER_DELAY = 300;

const StaggeredPodiumSlot: React.FC<{
  children: React.ReactNode;
  index: number;
}> = ({ children, index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * STAGGER_DELAY);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
      {children}
    </Animated.View>
  );
};

const StaggeredPlayerRow: React.FC<{
  item: any;
  index: number;
  isWinner: boolean;
  styles: any;
}> = ({ item, index, isWinner, styles: s }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * STAGGER_DELAY);
    return () => clearTimeout(timer);
  }, [index]);

  const containerStyle = isWinner ? s.winnerContainer : s.playerContainer;
  const scoreStyle = isWinner ? [s.profileName, s.winnerText] : s.profileName;

  return (
    <Animated.View
      style={[
        containerStyle,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Image
        source={
          item.profile_picture
            ? { uri: item.profile_picture }
            : require("../../assets/images/profile-placeholder.png")
        }
        style={s.profileImage}
      />
      <Text style={s.profileName}>{item.profileName}: </Text>
      <Text style={scoreStyle}>{item.score}</Text>
      {isWinner && (
        <Ionicons
          name="trophy"
          size={26}
          color="#FFD700"
          style={s.crownIcon}
        />
      )}
    </Animated.View>
  );
};

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
      profileName: player.first_name,
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

  // Current user's score and winner status
  const userPlayer = useMemo(
    () => players.find((p) => p.id === userInfo?.user.id),
    [players, userInfo]
  );
  const userScore = userPlayer ? parseFloat(userPlayer.score) : 0;
  const userIsWinner = !!userPlayer?.isWinner;

  const scoreBasedMessage = useMemo(() => {
    if (userIsWinner) {
      if (userScore >= 90) return "Crushed it!";
      if (userScore >= 70) return "Nice work!";
      return "You won!";
    }
    if (userScore >= 90) return "Crushed it!";
    if (userScore >= 70) return "Nice work!";
    if (userScore >= 50) return "Close one!";
    return "Room to improve!";
  }, [userIsWinner, userScore]);

  // Podium: top 3 as [2nd, 1st, 3rd] for display, rest as list. Always return { top3, rest } for consistent typing.
  const podiumPlayers = useMemo(() => {
    if (players.length < 2) return { top3: players, rest: [] as typeof players };
    const [first, second, third, ...rest] = players;
    const top3 = second
      ? third
        ? [second, first, third]
        : [second, first]
      : [first];
    return { top3, rest };
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
      fontSize: 26,
      fontWeight: "800",
      marginBottom: 20,
      marginTop: 40,
      color: "#FFD700",
      textDecorationLine: "underline",
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 0,
      includeFontPadding: false,
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
      shadowColor: colorScheme === "light" ? "rgba(0,0,0,0.1)" : "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colorScheme === "light" ? 0.15 : 0.3,
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
    podiumContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      marginVertical: rV(24),
      minHeight: rV(140),
    },
    podiumSlot: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: rMS(8),
    },
    podiumAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: rV(8),
    },
    podiumName: {
      fontSize: rMS(14),
      fontWeight: "600",
      color: themeColors.text,
      textAlign: "center",
    },
    podiumScore: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    podiumPlace: {
      fontSize: rMS(10),
      color: themeColors.textSecondary,
      marginBottom: rV(8),
    },
    othersList: {
      paddingHorizontal: rMS(20),
      paddingBottom: rV(24),
    },
    scoreBasedBanner: {
      paddingVertical: rV(12),
      paddingHorizontal: rMS(20),
      marginBottom: rV(16),
      alignSelf: "center",
      backgroundColor: themeColors.tint + "20",
      borderRadius: rMS(12),
    },
    scoreBasedText: {
      fontSize: rMS(16),
      fontWeight: "bold",
      color: themeColors.tint,
    },
  });

  const renderPodiumSlot = (
    item: any,
    _place: 1 | 2 | 3,
    placeLabel: string
  ) => (
    <View key={item.id} style={styles.podiumSlot}>
      <Text style={styles.podiumPlace}>{placeLabel}</Text>
      <Image
        source={
          item.profile_picture
            ? { uri: item.profile_picture }
            : require("../../assets/images/profile-placeholder.png")
        }
        style={styles.podiumAvatar}
      />
      <Text style={styles.podiumName} numberOfLines={1}>
        {item.profileName}
      </Text>
      <Text style={[styles.podiumScore, item.isWinner && styles.winnerText]}>
        {item.score}
      </Text>
      {item.isWinner && (
        <Ionicons name="trophy" size={24} color="#FFD700" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.errorMessage}>{error}</Text>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.playersList}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.topContainerTitle}>{creator}'s Arena</Text>
          <Text style={winnerCount > 1 ? styles.tieTitle : styles.title}>
            {winnerCount > 1 ? `Tie! ${winnerCount} Winners` : "Scores"}
          </Text>
          <View style={styles.scoreBasedBanner}>
            <Text style={styles.scoreBasedText}>{scoreBasedMessage}</Text>
          </View>
          {podiumPlayers.top3 && podiumPlayers.top3.length > 0 && (
            <View style={styles.podiumContainer}>
              {podiumPlayers.top3.length >= 2 && (
                <StaggeredPodiumSlot index={0}>
                  {renderPodiumSlot(podiumPlayers.top3[0], 2, "2nd")}
                </StaggeredPodiumSlot>
              )}
              {podiumPlayers.top3.length >= 1 && (
                <StaggeredPodiumSlot index={1}>
                  {renderPodiumSlot(
                    podiumPlayers.top3[podiumPlayers.top3.length === 1 ? 0 : 1],
                    1,
                    "1st"
                  )}
                </StaggeredPodiumSlot>
              )}
              {podiumPlayers.top3.length >= 3 && (
                <StaggeredPodiumSlot index={2}>
                  {renderPodiumSlot(podiumPlayers.top3[2], 3, "3rd")}
                </StaggeredPodiumSlot>
              )}
            </View>
          )}
          {podiumPlayers.rest && podiumPlayers.rest.length > 0 && (
            <View style={styles.othersList}>
              {podiumPlayers.rest.map((item, idx) => (
                <StaggeredPlayerRow
                  key={item.id}
                  item={item}
                  index={idx + 3}
                  isWinner={item.isWinner}
                  styles={styles}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
