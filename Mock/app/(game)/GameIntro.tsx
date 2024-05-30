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

export default function GameIntro() {
  const [gameCode, setGameCode] = useState("");
  const { userInfo, userToken } = useAuth();
  const [joinGameDisabled, setJoinGameDisabled] = useState<boolean>(true);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const createGame = () => {
    router.navigate("GameCourses");
  };

  const joinGame = async () => {
    try {
      const response = await axios.post(`${ApiUrl}:8000/games/join/`,{game_code:gameCode}, {
        headers: {
          Authorization: `Token ${userToken?.token}`,
        },
      });
      
      if (response.status === 200) {
        const id = response.data.id
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
      flex: 2,
      justifyContent: "center",
      paddingTop: 20,
      paddingHorizontal: 10,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    topImage: {
      width: 300,
      height: 300,
      resizeMode: "contain", // Maintain aspect ratio
      marginBottom: 16,
      marginLeft: -40,
      marginRight: 80,
    },

    topContainerTitle: {
      color: themeColors.text,
      fontSize: 40,
      fontWeight: "bold",
      marginBottom: 0,
    },
    topContainerSubtitle: {
      fontSize: 24,
      color: themeColors.textSecondary,
      marginBottom: 90,
    },

    bottomContainer: {
      flex: 2,
      marginTop: -40,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: themeColors.background,
      padding: 20,
      width: "100%",
      alignItems: "center",
    },
    title: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    codeCard: {
      backgroundColor: themeColors.card,
      borderRadius: 10,
      padding: 30,
      paddingTop: 50,
      marginTop: -100,
      marginBottom: 20,
      shadowColor: themeColors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 2,
      width: "100%",
      height: 240,
    },
    cardTitle: {
      fontSize: 25,
      fontWeight: "bold",
      marginBottom: 10,
      color: themeColors.text,
    },
    cardSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 20,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      borderWidth: 2,
      margin: 10,
      borderColor: themeColors.border,
      borderRadius: 5,
      padding: 6,
      height: 40,
      flex: 1,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
      color: themeColors.text,
    },
    joinButton: {
      backgroundColor: joinGameDisabled
        ? themeColors.buttonDisabled
        : themeColors.buttonBackground,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
      opacity: joinGameDisabled ? 0.5 : 1,
    },

    createButton: {
      marginTop: 20,
      backgroundColor: themeColors.buttonBackground,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
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
