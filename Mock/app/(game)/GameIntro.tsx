import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  useColorScheme,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import Toast from "react-native-root-toast";
import GameTutorialOverlay, {
  GAME_TUTORIAL_SEEN_KEY,
} from "../../components/GameTutorialOverlay";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";

const CARD_RADIUS = 20;
const INPUT_RADIUS = 12;
const BUTTON_RADIUS = 22;

const CARD_GAP = rS(16);

export default function GameIntro() {
  const { code } = useLocalSearchParams() as { code?: string };
  const [gameCode, setGameCode] = useState(code || "");
  const { userToken } = useAuth();
  const [joinGameDisabled, setJoinGameDisabled] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem(GAME_TUTORIAL_SEEN_KEY).then((seen) => {
      setShowTutorial(seen !== "true");
    });
  }, []);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const createGame = () => {
    router.navigate("GameCourses");
  };

  const joinGame = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}/games/join/`,
        { game_code: gameCode },
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      if (response.status === 200) {
        const id = response.data.id;
        router.navigate({
          pathname: "GameWaiting",
          params: { code: gameCode, id: id },
        });
      } else {
        Toast.show("Invalid game code. Please check and try again.", {
          duration: Toast.durations.LONG,
          position: Toast.positions.TOP,
          shadow: true,
          animation: true,
          hideOnPress: true,
          opacity: 0.8,
          backgroundColor: themeColors.tint,
          textColor: "white",
          containerStyle: { marginTop: 20 },
        });
      }
    } catch (error: any) {
      let errorMessage = "Unable to join game. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Game not found. Please check the code.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid game code. Please check and try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to join this game.";
      }
      Toast.show(errorMessage, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        opacity: 0.8,
        backgroundColor: themeColors.tint,
        textColor: "white",
        containerStyle: { marginTop: 20 },
      });
    }
  };

  useEffect(() => {
    setJoinGameDisabled(gameCode.length !== 6);
  }, [gameCode]);

  useEffect(() => {
    if (code != null && code !== "") {
      setGameCode(code);
    }
  }, [code]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(tabs)/home");
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  const handleJoinPress = () => {
    if (joinGameDisabled) {
      Toast.show("Enter 6-character code", {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
        shadow: true,
        animation: true,
        hideOnPress: true,
        opacity: 0.8,
        backgroundColor: themeColors.tint,
        textColor: "white",
        containerStyle: { marginTop: 20 },
      });
      return;
    }
    joinGame();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: rMS(16),
      paddingTop: Math.max(0, insets.top - rV(28)),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(20)),
    },
    hero: {
      alignItems: "center",
      marginBottom: rV(12),
    },
    heroImage: {
      width: rS(180),
      height: rS(160),
      resizeMode: "contain",
      marginBottom: rV(8),
    },
    heroTitle: {
      color: themeColors.text,
      fontSize: SIZES.xxxLarge,
      fontWeight: "bold",
    },
    cardsRow: {
      flexDirection: "row",
      gap: CARD_GAP,
      alignItems: "stretch",
    },
    card: {
      flex: 1,
      backgroundColor: themeColors.tint,
      borderRadius: CARD_RADIUS,
      padding: rMS(18),
      alignItems: "center",
      justifyContent: "space-between",
      ...shadow.medium,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(10),
    },
    cardHeader: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: rV(10),
      textAlign: "center",
    },
    cardContent: {
      alignItems: "center",
      width: "100%",
    },
    inputHint: {
      color: "rgba(255,255,255,0.85)",
      fontSize: SIZES.small,
      marginBottom: rV(6),
      textAlign: "center",
    },
    input: {
      width: "100%",
      backgroundColor: "#fff",
      borderRadius: INPUT_RADIUS,
      paddingVertical: rV(10),
      paddingHorizontal: rMS(12),
      fontSize: SIZES.medium,
      color: "#000",
      marginBottom: rV(10),
    },
    descText: {
      color: "rgba(255,255,255,0.9)",
      fontSize: SIZES.medium,
      textAlign: "center",
      lineHeight: 22,
    },
    cardButton: {
      backgroundColor: themeColors.tintSecond ?? themeColors.tint,
      borderRadius: BUTTON_RADIUS,
      paddingVertical: rV(10),
      paddingHorizontal: rMS(20),
      width: "100%",
      marginTop: rV(12),
      alignItems: "center",
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    cardButtonDisabled: {
      opacity: 0.6,
    },
    cardButtonText: {
      color: "#fff",
      fontSize: SIZES.medium,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
      <GameTutorialOverlay
        visible={showTutorial}
        onDismiss={() => setShowTutorial(false)}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: rV(24),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            source={require("../../assets/images/game1.png")}
            style={styles.heroImage}
          />
          <Text style={styles.heroTitle}>Game Time!</Text>
        </View>

        <View style={styles.cardsRow}>
          {/* Join card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={26} color={themeColors.tint} />
              </View>
              <Text style={styles.cardHeader}>Join a game</Text>
              <Text style={styles.inputHint}>Type the 6-character code below</Text>
              <TextInput
                style={styles.input}
                value={gameCode}
                onChangeText={setGameCode}
                placeholder="e.g. Cx893P"
                placeholderTextColor={themeColors.placeholder}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.cardButton,
                joinGameDisabled && styles.cardButtonDisabled,
              ]}
              onPress={handleJoinPress}
              activeOpacity={0.8}
            >
              <Text style={styles.cardButtonText}>Join</Text>
            </TouchableOpacity>
          </View>

          {/* Create card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="game-controller" size={26} color={themeColors.tint} />
              </View>
              <Text style={styles.cardHeader}>Create a game</Text>
              <Text style={styles.descText}>Pick a course and topic(s) to create a new game</Text>
            </View>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={createGame}
              activeOpacity={0.8}
            >
              <Text style={styles.cardButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
