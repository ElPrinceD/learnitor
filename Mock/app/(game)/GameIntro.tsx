import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import Toast from "react-native-root-toast";
import GameButton from "../../components/GameButton";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";

export default function GameIntro() {
  const [gameCode, setGameCode] = useState("");
  const { userToken } = useAuth();
  const [joinGameDisabled, setJoinGameDisabled] = useState<boolean>(true);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const createGame = () => {
    router.navigate("GameCourses");
  };

  const joinGame = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}:8000/games/join/`,
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
        // Handle unsuccessful response
        console.error("Failed to join the game:", response.data);
        // Optionally, display an error message to the user
      }
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error("Error joining the game:", error);
      // Optionally, display an error message to the user
    }
  };

  useEffect(() => {
    setJoinGameDisabled(gameCode.length !== 6);
  }, [gameCode]);

  const handleJoinGameDisabledPress = () => {
    if (joinGameDisabled) {
      Toast.show("Enter 6-character code", {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        opacity: 0.8,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },

    topContainer: {
      flex: 1,
      paddingHorizontal: rS(10),
      justifyContent: "center",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    topImage: {
      width: rS(240),
      resizeMode: "contain",
    },

    topContainerTitle: {
      color: themeColors.text,
      fontSize: SIZES.xxLarge,
      fontWeight: "bold",
    },
    topContainerSubtitle: {
      fontSize: SIZES.large,
      color: themeColors.textSecondary,
    },

    bottomContainer: {
      flex: 1,
      marginTop: rV(-40),
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: themeColors.background,
      padding: rMS(18),
    },
    title: {
      color: themeColors.text,
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rV(18),
      textAlign: "center",
    },
    codeCard: {
      backgroundColor: themeColors.card,
      borderRadius: 10,
      padding: rMS(28),
      justifyContent: "center",
      marginTop: rV(-80),
      marginBottom: rV(18),
      ...shadow.small,
      flex: 0.6,
    },
    cardTitle: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      marginBottom: rV(8),
      color: themeColors.text,
    },
    cardSubtitle: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      marginBottom: rV(18),
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      borderWidth: 2,
      margin: rMS(10),
      borderColor: themeColors.border,
      padding: rMS(6),
      flex: 1,
      borderTopLeftRadius: rV(18),
      borderBottomRightRadius: rV(18),
      color: themeColors.text,
    },
    joinButton: {
      backgroundColor: joinGameDisabled
        ? themeColors.buttonDisabled
        : themeColors.buttonBackground,
      borderTopLeftRadius: rV(18),
      borderBottomRightRadius: rV(18),
      opacity: joinGameDisabled ? 0.5 : 1,
    },

    createButton: {
      backgroundColor: themeColors.buttonBackground,
      borderTopLeftRadius: rV(18),
      borderBottomRightRadius: rV(18),
    },
    noCodeContainer: {
      alignItems: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topContainerTitle}>Let's Play</Text>
            <Text style={styles.topContainerSubtitle}>and WIN!</Text>
          </View>
          <Image
            source={require("../../assets/images/game1.png")}
            style={styles.topImage}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.codeCard}>
          <Text style={styles.cardTitle}>Enter your code</Text>
          <Text style={styles.cardSubtitle}>To play with your friends</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={gameCode}
              onChangeText={setGameCode}
              placeholder="Eg: Cx893P"
              placeholderTextColor={themeColors.textSecondary}
            />
            <GameButton
              title="Join Game"
              onPress={
                joinGameDisabled ? handleJoinGameDisabledPress : joinGame
              }
              style={styles.joinButton}
            />
          </View>
        </View>
        <View style={styles.noCodeContainer}>
          {/* <Text>No Code?</Text> */}
          <Text style={styles.title}>Start your own game!</Text>
          <GameButton
            title="Create Game"
            onPress={createGame}
            style={styles.createButton}
          />
        </View>
      </View>
    </View>
  );
}
