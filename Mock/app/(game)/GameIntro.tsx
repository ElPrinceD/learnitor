import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, Gamepad2, User } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import ApiUrl from "../../config";
import { useAuth } from "../../components/AuthContext";
import Toast from "react-native-root-toast";
import GameTutorialOverlay, {
  GAME_TUTORIAL_SEEN_KEY,
} from "../../components/GameTutorialOverlay";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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

  // Animated press scales
  const joinScale = useSharedValue(1);
  const createScale = useSharedValue(1);
  const soloScale = useSharedValue(1);

  const joinAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: joinScale.value }],
  }));
  const createAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createScale.value }],
  }));
  const soloAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: soloScale.value }],
  }));

  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const createGame = () => {
    router.navigate({ pathname: "GameCourses", params: { isSinglePlayer: "false" } });
  };

  const createSinglePlayerGame = () => {
    router.navigate({ pathname: "GameCourses", params: { isSinglePlayer: "true" } });
  };

  const joinGame = async (codeToJoin?: string) => {
    const codeVal = codeToJoin || gameCode;
    if (!codeVal) return;
    try {
      const response = await axios.post(
        `${ApiUrl}/games/join/`,
        { game_code: codeVal },
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
          params: { code: codeVal, id: id },
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
      if (userToken?.token) {
        joinGame(code);
      }
    }
  }, [code, userToken?.token]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(tabs)/(play)/play");
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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
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
      bottom: rV(80),
      right: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#6366F118",
    },
    blob3: {
      position: "absolute",
      top: rV(350),
      left: -rS(40),
      width: rS(180),
      height: rS(180),
      borderRadius: rS(90),
      backgroundColor: "#10B98115",
    },
    // Frosted top bar
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(rV(70), insets.top + rV(44)),
      zIndex: 10,
    },
    topBarContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      paddingHorizontal: rS(16),
      paddingBottom: rV(10),
    },
    keyboardAvoid: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: rMS(16),
      paddingTop: Math.max(rV(80), insets.top + rV(52)),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(20)),
    },
    // Hero
    hero: {
      alignItems: "center",
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
      color: themeColors.text,
      fontSize: rMS(36),
      fontWeight: "900",
      textAlign: 'center',
      letterSpacing: -1,
    },
    heroSubtext: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      marginTop: rV(8),
      textAlign: "center",
      lineHeight: rMS(20),
    },
    // Rankings pill button
    rankingsBtn: {
      flexDirection: 'row',
      backgroundColor: themeColors.cardGlass,
      paddingVertical: rV(8),
      paddingHorizontal: rMS(14),
      borderRadius: rMS(24),
      alignItems: 'center',
      ...shadow.small,
    },
    rankingsBtnText: {
      color: themeColors.tint,
      fontWeight: '800',
      marginLeft: rS(6),
      fontSize: rMS(12),
    },
    // Join card — glassmorphic, extreme roundness
    joinCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      marginBottom: rV(16),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    joinCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(14),
    },
    joinIconCircle: {
      width: rMS(44),
      height: rMS(44),
      borderRadius: rMS(22),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(14),
    },
    joinTitle: {
      fontSize: rMS(17),
      fontWeight: "900",
      color: themeColors.text,
    },
    joinSubtext: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
    },
    input: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: rMS(20),
      paddingVertical: rV(12),
      paddingHorizontal: rMS(16),
      fontSize: SIZES.medium,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    joinButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(20),
      paddingVertical: rV(12),
      paddingHorizontal: rMS(20),
      alignItems: "center",
      justifyContent: "center",
      ...shadow.small,
    },
    joinButtonDisabled: {
      opacity: 0.5,
    },
    joinButtonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "800",
    },
    // Action cards row
    cardsRow: {
      flexDirection: "row",
      gap: rS(12),
      alignItems: "stretch",
    },
    // Action card — glassmorphic pill
    actionCard: {
      flex: 1,
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(20),
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    actionCardContent: {
      alignItems: "center",
      width: "100%",
    },
    actionIconCircle: {
      width: rMS(52),
      height: rMS(52),
      borderRadius: rMS(26),
      backgroundColor: themeColors.tint + "12",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
    },
    actionCardTitle: {
      fontSize: rMS(15),
      fontWeight: "900",
      color: themeColors.text,
      textAlign: "center",
      marginBottom: rV(6),
    },
    actionCardDesc: {
      color: themeColors.textSecondary,
      fontSize: rMS(11),
      textAlign: "center",
      lineHeight: rMS(16),
    },
    actionCardButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(20),
      width: "100%",
      marginTop: rV(16),
      alignItems: "center",
      ...shadow.small,
    },
    actionCardButtonText: {
      color: "#fff",
      fontSize: rMS(13),
      fontWeight: "800",
    },
  }), [themeColors, insets, shadow]);

  return (
    <View style={styles.container}>
      {/* Glassmorphic background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Frosted glass top bar */}
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.topBar}
      >
        <View style={styles.topBarContent} />
      </BlurView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
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
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(250).delay(50)}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>Game Mode</Text>
            <Text style={styles.heroTitle}>Game Time!</Text>
            <Text style={styles.heroSubtext}>
              Challenge friends or sharpen your skills solo.
            </Text>
          </Animated.View>

          {/* Join Game Card */}
          <Animated.View entering={FadeInDown.duration(250).delay(100)}>
            <View style={styles.joinCard}>
              <View style={styles.joinCardHeader}>
                <View style={styles.joinIconCircle}>
                  <Users size={24} color={themeColors.tint} />
                </View>
                <View>
                  <Text style={styles.joinTitle}>Join a Game</Text>
                  <Text style={styles.joinSubtext}>Enter 6-character code</Text>
                </View>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={gameCode}
                  onChangeText={setGameCode}
                  placeholder="e.g. Cx893P"
                  placeholderTextColor={themeColors.placeholder}
                />
                <AnimatedTouchable
                  style={[
                    styles.joinButton,
                    joinGameDisabled && styles.joinButtonDisabled,
                    joinAnimStyle,
                  ]}
                  onPress={handleJoinPress}
                  onPressIn={() => onPressIn(joinScale)}
                  onPressOut={() => onPressOut(joinScale)}
                  activeOpacity={1}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </AnimatedTouchable>
              </View>
            </View>
          </Animated.View>

          {/* Create & Solo Cards */}
          <Animated.View
            entering={FadeInUp.duration(250).delay(150)}
            style={styles.cardsRow}
          >
            {/* Create Game */}
            <AnimatedTouchable
              style={[styles.actionCard, createAnimStyle]}
              onPress={createGame}
              onPressIn={() => onPressIn(createScale)}
              onPressOut={() => onPressOut(createScale)}
              activeOpacity={1}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconCircle}>
                  <Gamepad2 size={26} color={themeColors.tint} />
                </View>
                <Text style={styles.actionCardTitle}>Create Game</Text>
                <Text style={styles.actionCardDesc}>
                  Pick a course and topic(s) to challenge others
                </Text>
              </View>
              <View style={styles.actionCardButton}>
                <Text style={styles.actionCardButtonText}>Create</Text>
              </View>
            </AnimatedTouchable>

            {/* Solo Practice */}
            <AnimatedTouchable
              style={[styles.actionCard, soloAnimStyle]}
              onPress={createSinglePlayerGame}
              onPressIn={() => onPressIn(soloScale)}
              onPressOut={() => onPressOut(soloScale)}
              activeOpacity={1}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconCircle}>
                  <User size={26} color={themeColors.tint} />
                </View>
                <Text style={styles.actionCardTitle}>Solo Practice</Text>
                <Text style={styles.actionCardDesc}>
                  Play high-speed single player rounds
                </Text>
              </View>
              <View style={styles.actionCardButton}>
                <Text style={styles.actionCardButtonText}>Play Solo</Text>
              </View>
            </AnimatedTouchable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
