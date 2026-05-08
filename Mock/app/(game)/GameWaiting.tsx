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
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { ArrowLeft, Copy, Share2 } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import Toast from "react-native-root-toast";
import { useAuth } from "../../components/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import GameButton from "../../components/GameButton";
import Colors from "../../constants/Colors";
import ApiUrl from "../../config";
import { Question, Player, GameDetailsResponse } from "../../components/types";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getGameDetails, startGame } from "../../services/GamesApiCalls";
import WsUrl from "../../configWs";
import ErrorMessage from "../../components/ErrorMessage";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const shadow = useShadows();
  const ws = useRef<WebSocket | null>(null);

  // Animated scales
  const backScale = useSharedValue(1);
  const copyScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  const copyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));
  const shareAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

  const onPressIn = (sv: Animated.SharedValue<number>) => {
    sv.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: Animated.SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

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
    if (code != null && code !== "") {
      setGameCode(code);
    }
  }, [code]);

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
      pathname: "/(game)/Game",
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
      bottom: rV(60),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#8B5CF618",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(rV(80), insets.top + rV(50)),
      zIndex: 10,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(80), insets.top + rV(50)),
      paddingBottom: Math.max(rV(120), insets.bottom + rV(100)),
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(16),
      marginTop: rV(8),
    },
    backButton: {
      width: rMS(44),
      height: rMS(44),
      borderRadius: rMS(22),
      backgroundColor: themeColors.cardGlass,
      alignItems: "center",
      justifyContent: "center",
      ...shadow.small,
    },
    // Hero
    heroSection: {
      marginBottom: rV(28),
      paddingHorizontal: rS(8),
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
      fontSize: rMS(32),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -1,
      lineHeight: rMS(36),
    },
    // Code card — glassmorphic
    codeCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      marginBottom: rV(12),
      ...shadow.medium,
    },
    codeLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
      marginBottom: rV(10),
    },
    codeText: {
      fontSize: rMS(36),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: 6,
      marginBottom: rV(16),
    },
    codeActions: {
      flexDirection: "row",
      gap: rS(12),
    },
    codeActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.tint + "12",
      paddingVertical: rV(8),
      paddingHorizontal: rMS(16),
      borderRadius: rMS(20),
      gap: rS(6),
    },
    codeActionText: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.tint,
    },
    // Waiting text
    waitingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rS(8),
      marginBottom: rV(20),
    },
    waitingText: {
      color: themeColors.textSecondary,
      fontSize: rMS(13),
      fontWeight: "700",
    },
    // Player card — pill shape
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
    playerImage: {
      width: rMS(44),
      height: rMS(44),
      borderRadius: rMS(22),
      marginRight: rS(14),
      borderWidth: 2,
      borderColor: themeColors.tint + "30",
    },
    playerName: {
      color: themeColors.text,
      fontSize: rMS(15),
      fontWeight: "800",
    },
    playerBadge: {
      marginLeft: "auto",
      backgroundColor: themeColors.tint + "15",
      paddingVertical: rV(4),
      paddingHorizontal: rMS(10),
      borderRadius: rMS(12),
    },
    playerBadgeText: {
      fontSize: rMS(10),
      fontWeight: "700",
      color: themeColors.tint,
    },
    // Start button container
    startButtonContainer: {
      position: "absolute",
      bottom: Math.max(rS(24), insets.bottom + rS(12)),
      left: rS(16),
      right: rS(16),
      alignSelf: "center",
    },
    startButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(28),
      paddingVertical: rV(16),
      alignItems: "center",
      ...shadow.medium,
    },
    startButtonText: {
      color: "#fff",
      fontSize: rMS(16),
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    multiplayerMessage: {
      color: themeColors.textSecondary,
      fontSize: rMS(13),
      textAlign: "center",
      padding: rMS(16),
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      marginTop: rV(12),
      fontWeight: "700",
    },
  });

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(200 + index * 80)}>
      <View style={styles.playerCard}>
        <Image
          source={
            item.profile_picture
              ? { uri: item.profile_picture }
              : require("../../assets/images/profile-placeholder.png")
          }
          style={styles.playerImage}
        />
        <Text style={styles.playerName}>{item.profileName}</Text>
        {item.id === creatorId && (
          <View style={styles.playerBadge}>
            <Text style={styles.playerBadgeText}>HOST</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={styles.loadingText}>Setting up arena...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Frosted glass top bar */}
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.topBar}
      />

      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Back Button */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(50)}
              style={styles.backRow}
            >
              <AnimatedTouchable
                style={[styles.backButton, backAnimStyle]}
                onPress={() => router.replace("/(game)/GameIntro")}
                onPressIn={() => onPressIn(backScale)}
                onPressOut={() => onPressOut(backScale)}
                activeOpacity={1}
              >
                <ArrowLeft size={22} color={themeColors.text} />
              </AnimatedTouchable>
            </Animated.View>

            {/* Hero */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              style={styles.heroSection}
            >
              <Text style={styles.heroLabel}>Lobby</Text>
              <Text style={styles.heroTitle}>
                {isCreator ? userInfo?.user.first_name : creator}'s Arena
              </Text>
            </Animated.View>

            {/* Code Card */}
            <Animated.View entering={FadeInDown.duration(500).delay(150)}>
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Game Code</Text>
                <Text style={styles.codeText}>{gameCode}</Text>
                <View style={styles.codeActions}>
                  <AnimatedTouchable
                    style={[styles.codeActionBtn, copyAnimStyle]}
                    onPress={copyToClipboard}
                    onPressIn={() => onPressIn(copyScale)}
                    onPressOut={() => onPressOut(copyScale)}
                    activeOpacity={1}
                  >
                    <Copy size={18} color={themeColors.tint} />
                    <Text style={styles.codeActionText}>Copy</Text>
                  </AnimatedTouchable>
                  <AnimatedTouchable
                    style={[styles.codeActionBtn, shareAnimStyle]}
                    onPress={shareGameCode}
                    onPressIn={() => onPressIn(shareScale)}
                    onPressOut={() => onPressOut(shareScale)}
                    activeOpacity={1}
                  >
                    <Share2
                      size={18}
                      color={themeColors.tint}
                    />
                    <Text style={styles.codeActionText}>Share</Text>
                  </AnimatedTouchable>
                </View>
              </View>
            </Animated.View>

            {/* Waiting indicator */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={styles.waitingRow}
            >
              <ActivityIndicator size="small" color={themeColors.tint} />
              <Text style={styles.waitingText}>Waiting for players...</Text>
            </Animated.View>
          </>
        }
      />

      {/* Start button or message */}
      {(isCreator || creatorId === userInfo?.user.id) && (
        <View style={styles.startButtonContainer}>
          {players.length < 2 ? (
            <Animated.View entering={FadeInUp.duration(500).delay(300)}>
              <Text style={styles.multiplayerMessage}>
                Invite at least one more player to start the game
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(500).delay(300)}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartGame}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
}
