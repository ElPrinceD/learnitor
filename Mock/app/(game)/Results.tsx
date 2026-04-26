import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme,
  BackHandler,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Player, GameDetailsResponse } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../../services/GamesApiCalls";
import { useAdManager } from "../../components/ads/AdManager";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  // Animated scales
  const homeScale = useSharedValue(1);
  const newGameScale = useSharedValue(1);
  const homeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: homeScale.value }],
  }));
  const newGameAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: newGameScale.value }],
  }));
  const onPressIn = (sv: Animated.SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: Animated.SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

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
      if (userScore >= 90) return "Crushed it! 🔥";
      if (userScore >= 70) return "Nice work! 🎉";
      return "You won! 🏆";
    }
    if (userScore >= 90) return "Crushed it! 🔥";
    if (userScore >= 70) return "Nice work! 👏";
    if (userScore >= 50) return "Close one! 💪";
    return "Room to improve! 📚";
  }, [userIsWinner, userScore]);

  // Podium: top 3 as [2nd, 1st, 3rd] for display, rest as list.
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
    router.dismissTo("GameIntro");
  };

  const handleBackToHome = () => {
    router.replace("/(tabs)/home");
  };

  const getPodiumHeight = (place: number) => {
    if (place === 1) return rV(100);
    if (place === 2) return rV(72);
    return rV(56);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(80),
      left: -rS(60),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      right: -rS(80),
      width: rS(280),
      height: rS(280),
      borderRadius: rS(140),
      backgroundColor: "#F5920018",
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(60), insets.top + rV(24)),
      paddingBottom: Math.max(rV(120), insets.bottom + rV(100)),
    },
    // Hero
    heroSection: {
      alignItems: "center",
      marginBottom: rV(24),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(8),
    },
    heroTitle: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    tieTitle: {
      fontSize: rMS(24),
      fontWeight: "900",
      color: "#FFD700",
      textAlign: "center",
      marginTop: rV(4),
    },
    // Score message banner
    messageBanner: {
      backgroundColor: themeColors.tint + "12",
      paddingVertical: rV(12),
      paddingHorizontal: rMS(24),
      borderRadius: rMS(24),
      alignSelf: "center",
      marginBottom: rV(28),
    },
    messageBannerText: {
      fontSize: rMS(16),
      fontWeight: "900",
      color: themeColors.tint,
    },
    // Podium
    podiumContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      marginBottom: rV(32),
      paddingHorizontal: rS(8),
    },
    podiumSlot: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: rMS(4),
    },
    podiumAvatarContainer: {
      position: "relative",
      marginBottom: rV(8),
    },
    podiumAvatar: {
      width: rMS(52),
      height: rMS(52),
      borderRadius: rMS(26),
      borderWidth: 3,
      borderColor: themeColors.tint + "40",
    },
    podiumAvatarFirst: {
      width: rMS(64),
      height: rMS(64),
      borderRadius: rMS(32),
      borderWidth: 3,
      borderColor: "#FFD700",
    },
    podiumCrown: {
      position: "absolute",
      top: -rV(16),
      alignSelf: "center",
    },
    podiumName: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(4),
    },
    podiumScore: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.textSecondary,
    },
    podiumBar: {
      width: "100%",
      borderTopLeftRadius: rMS(16),
      borderTopRightRadius: rMS(16),
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      marginTop: rV(8),
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: rV(8),
    },
    podiumPlace: {
      fontSize: rMS(14),
      fontWeight: "900",
      color: themeColors.textSecondary,
    },
    // Other players list
    othersSection: {
      marginBottom: rV(24),
    },
    othersSectionLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
      marginBottom: rV(12),
      paddingHorizontal: rS(8),
    },
    playerCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
      padding: rMS(14),
      borderRadius: rMS(28),
      marginBottom: rV(10),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    playerCardWinner: {
      borderColor: "#FFD700" + "60",
      backgroundColor: "#FFD700" + "08",
    },
    playerImage: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(20),
      marginRight: rS(14),
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      color: themeColors.text,
      fontSize: rMS(14),
      fontWeight: "800",
    },
    playerScore: {
      color: themeColors.tint,
      fontSize: rMS(13),
      fontWeight: "900",
    },
    winnerBadge: {
      marginLeft: rS(8),
    },
    // Buttons
    buttonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      paddingTop: rV(12),
      paddingBottom: Math.max(rV(20), insets.bottom + rV(10)),
      paddingHorizontal: rMS(16),
      gap: rS(12),
      backgroundColor: themeColors.background,
    },
    homeButton: {
      flex: 1,
      backgroundColor: themeColors.tint + "12",
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      borderWidth: 1.5,
      borderColor: themeColors.tint + "30",
    },
    homeButtonText: {
      color: themeColors.tint,
      fontSize: rMS(13),
      fontWeight: "800",
    },
    newGameButton: {
      flex: 1,
      backgroundColor: themeColors.tint,
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      ...shadow.small,
    },
    newGameButtonText: {
      color: "#fff",
      fontSize: rMS(13),
      fontWeight: "800",
    },
    errorMessage: {
      alignSelf: "center",
      fontSize: SIZES.medium,
      color: "#D22B2B",
      marginVertical: rV(16),
      textAlign: "center",
      paddingHorizontal: rMS(20),
    },
  });

  const renderPodiumSlot = (
    item: any,
    place: 1 | 2 | 3,
    placeLabel: string
  ) => (
    <Animated.View
      key={item.id}
      entering={FadeInUp.duration(500).delay(place === 1 ? 200 : place === 2 ? 100 : 300).springify()}
      style={styles.podiumSlot}
    >
      <View style={styles.podiumAvatarContainer}>
        {item.isWinner && (
          <View style={styles.podiumCrown}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </View>
        )}
        <Image
          source={
            item.profile_picture
              ? { uri: item.profile_picture }
              : require("../../assets/images/profile-placeholder.png")
          }
          style={place === 1 ? styles.podiumAvatarFirst : styles.podiumAvatar}
        />
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {item.profileName}
      </Text>
      <Text style={[styles.podiumScore, item.isWinner && { color: "#FFD700" }]}>
        {item.score}%
      </Text>
      <View style={[styles.podiumBar, { height: getPodiumHeight(place) }]}>
        <Text style={styles.podiumPlace}>{placeLabel}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {error ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.heroSection}
          >
            <Text style={styles.heroLabel}>Game Complete</Text>
            <Text style={styles.heroTitle}>{creator}'s Arena</Text>
            {winnerCount > 1 && (
              <Text style={styles.tieTitle}>
                Tie! {winnerCount} Winners
              </Text>
            )}
          </Animated.View>

          {/* Message Banner */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)}>
            <View style={styles.messageBanner}>
              <Text style={styles.messageBannerText}>{scoreBasedMessage}</Text>
            </View>
          </Animated.View>

          {/* Podium */}
          {podiumPlayers.top3 && podiumPlayers.top3.length > 0 && (
            <View style={styles.podiumContainer}>
              {podiumPlayers.top3.length >= 2 &&
                renderPodiumSlot(podiumPlayers.top3[0], 2, "2nd")}
              {podiumPlayers.top3.length >= 1 &&
                renderPodiumSlot(
                  podiumPlayers.top3[podiumPlayers.top3.length === 1 ? 0 : 1],
                  1,
                  "1st"
                )}
              {podiumPlayers.top3.length >= 3 &&
                renderPodiumSlot(podiumPlayers.top3[2], 3, "3rd")}
            </View>
          )}

          {/* Other Players */}
          {podiumPlayers.rest && podiumPlayers.rest.length > 0 && (
            <View style={styles.othersSection}>
              <Text style={styles.othersSectionLabel}>Other Players</Text>
              {podiumPlayers.rest.map((item, idx) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(400).delay(400 + idx * 80)}
                >
                  <View
                    style={[
                      styles.playerCard,
                      item.isWinner && styles.playerCardWinner,
                    ]}
                  >
                    <Image
                      source={
                        item.profile_picture
                          ? { uri: item.profile_picture }
                          : require("../../assets/images/profile-placeholder.png")
                      }
                      style={styles.playerImage}
                    />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{item.profileName}</Text>
                    </View>
                    <Text style={styles.playerScore}>{item.score}%</Text>
                    {item.isWinner && (
                      <View style={styles.winnerBadge}>
                        <Ionicons name="trophy" size={18} color="#FFD700" />
                      </View>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <AnimatedTouchable
          style={[styles.homeButton, homeAnimStyle]}
          onPress={handleBackToHome}
          onPressIn={() => onPressIn(homeScale)}
          onPressOut={() => onPressOut(homeScale)}
          activeOpacity={1}
        >
          <Ionicons name="home" size={20} color={themeColors.tint} />
          <Text style={styles.homeButtonText}>Home</Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[styles.newGameButton, newGameAnimStyle]}
          onPress={handleCreateNewGame}
          onPressIn={() => onPressIn(newGameScale)}
          onPressOut={() => onPressOut(newGameScale)}
          activeOpacity={1}
        >
          <Ionicons name="game-controller" size={20} color="#fff" />
          <Text style={styles.newGameButtonText}>New Game</Text>
        </AnimatedTouchable>
      </View>
    </View>
  );
}
