import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../../../components/AuthContext";
import Toast from "react-native-root-toast";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV, useShadows } from "../../../constants";
import ApiUrl from "../../../config";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RankingSummary {
  world: string | null;
  country: string | null;
  school: string | null;
}

interface CustomLeaderboard {
  id: string;
  name: string;
  memberCount?: number;
}

export default function PlayScreen() {
  const { userToken, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [gameCode, setGameCode] = useState("");
  const [joinGameDisabled, setJoinGameDisabled] = useState(true);
  const [squadJoinCode, setSquadJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [rankings, setRankings] = useState<RankingSummary>({
    world: null,
    country: null,
    school: null,
  });
  const [customLeaderboards, setCustomLeaderboards] = useState<CustomLeaderboard[]>([]);

  // Animated press scales
  const multiplayerScale = useSharedValue(1);
  const soloScale = useSharedValue(1);

  useEffect(() => {
    setJoinGameDisabled(gameCode.length !== 6);
  }, [gameCode]);

  useEffect(() => {
    fetchRankingSummary();
    fetchCustomLeaderboards();
  }, []);

  const fetchRankingSummary = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/api/leaderboards/rankings/summary`, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      setRankings(res.data);
    } catch (e) {
      // Fallback data until backend is ready
      setRankings({ world: "#12,842", country: "#482", school: "#3" });
    }
  };

  const fetchCustomLeaderboards = async () => {
    try {
      const res = await axios.get(`${ApiUrl}/api/leaderboards/custom`, {
        headers: { Authorization: `Token ${userToken?.token}` },
      });
      setCustomLeaderboards(res.data);
    } catch (e) {
      setCustomLeaderboards([]);
    }
  };

  const createSquad = async () => {
    try {
      const res = await axios.post(
        `${ApiUrl}/api/leaderboards/custom/create`,
        {},
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      showToast(`Squad created! Code: ${res.data.invite_code}`);
      fetchCustomLeaderboards();
    } catch (error) {
      showToast("Error creating squad. Try again.");
    }
  };

  const joinSquad = async () => {
    if (squadJoinCode.length < 4) {
      showToast("Enter a valid invite code");
      return;
    }
    try {
      const res = await axios.post(
        `${ApiUrl}/api/leaderboards/custom/join`,
        { inviteCode: squadJoinCode },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      showToast(`Joined ${res.data.name}!`);
      setSquadJoinCode("");
      fetchCustomLeaderboards();
    } catch (error) {
      showToast("Invalid code. Please check and try again.");
    }
  };

  const navigateMultiplayer = () => {
    router.navigate({ pathname: "/(game)/GameCourses", params: { isSinglePlayer: "false" } });
  };

  const navigateSoloPlay = () => {
    router.navigate({ pathname: "/(game)/GameCourses", params: { isSinglePlayer: "true" } });
  };

  const joinGame = async () => {
    try {
      const response = await axios.post(
        `${ApiUrl}/games/join/`,
        { game_code: gameCode },
        { headers: { Authorization: `Token ${userToken?.token}` } }
      );
      if (response.status === 200) {
        const id = response.data.id;
        router.navigate({
          pathname: "/(game)/GameWaiting",
          params: { code: gameCode, id },
        });
      } else {
        showToast("Invalid game code. Please check and try again.");
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
      showToast(errorMessage);
    }
  };

  const handleJoinPress = () => {
    if (joinGameDisabled) {
      showToast("Enter 6-character code");
      return;
    }
    joinGame();
  };

  const showToast = (msg: string) => {
    Toast.show(msg, {
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
  };

  const openLeaderboard = (id: string, name: string) => {
    router.push({
      pathname: "/(game)/LeaderboardDetail",
      params: { id, name, timeframe: "season" },
    });
  };

  const openFullLeaderboard = () => {
    router.push("/(game)/Leaderboard");
  };

  // Animated button styles
  const multiplayerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multiplayerScale.value }],
  }));

  const soloAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: soloScale.value }],
  }));

  const onPressIn = (scaleValue: Animated.SharedValue<number>) => {
    scaleValue.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const onPressOut = (scaleValue: Animated.SharedValue<number>) => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const globalStandingItems = [
    {
      id: "world",
      name: "World Rankings",
      icon: "earth" as const,
      rank: rankings.world,
      color: themeColors.tint,
    },
    {
      id: "country",
      name: "Country Rankings",
      icon: "flag" as const,
      rank: rankings.country,
      color: themeColors.tintSecond ?? themeColors.tint,
    },
    {
      id: "school",
      name: "School Rankings",
      icon: "school" as const,
      rank: rankings.school,
      color: "#8b3b8f",
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(12), insets.top + rV(6)),
      paddingBottom: Math.max(rV(32), insets.bottom + rV(16)),
    },
    // Hero
    heroSection: {
      marginBottom: rV(18),
    },
    heroTitle: {
      fontSize: rMS(28),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.5,
      lineHeight: rMS(32),
    },
    heroSubtitle: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(4),
      lineHeight: rMS(18),
    },
    // Action grid
    actionGrid: {
      flexDirection: "row",
      gap: rS(12),
      marginBottom: rV(20),
    },
    actionButtonMultiplayer: {
      flex: 1,
      backgroundColor: themeColors.tint,
      borderRadius: rMS(14),
      paddingVertical: rV(16),
      paddingHorizontal: rS(12),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    actionButtonSolo: {
      flex: 1,
      backgroundColor: themeColors.card,
      borderRadius: rMS(14),
      paddingVertical: rV(16),
      paddingHorizontal: rS(12),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    actionLabel: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      opacity: 0.8,
      marginBottom: rV(2),
    },
    actionTitle: {
      fontSize: SIZES.medium,
      fontWeight: "800",
    },
    // Join card
    joinCard: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(14),
      padding: rMS(14),
      marginBottom: rV(22),
      ...shadow.small,
    },
    joinRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(10),
    },
    joinInput: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: rMS(8),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(12),
      fontSize: SIZES.small,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    joinButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(8),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(14),
      alignItems: "center",
      justifyContent: "center",
    },
    joinButtonDisabled: {
      opacity: 0.5,
    },
    joinButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: SIZES.small,
    },
    joinLabel: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginBottom: rV(10),
      fontWeight: "600",
    },
    // Sections
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(14),
    },
    sectionTitle: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    sectionSeeAll: {
      fontSize: SIZES.small,
      color: themeColors.tint,
      fontWeight: "700",
    },
    // Standing cards
    standingCard: {
      backgroundColor: themeColors.card,
      padding: rMS(12),
      borderRadius: rMS(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(8),
    },
    standingCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(14),
    },
    standingIconBox: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(12),
      alignItems: "center",
      justifyContent: "center",
    },
    standingName: {
      fontSize: SIZES.medium,
      fontWeight: "800",
      color: themeColors.text,
    },
    standingCardRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(8),
    },
    standingRank: {
      fontSize: rMS(14),
      fontWeight: "bold",
      color: themeColors.tint,
    },
    // Squad section
    squadSection: {
      marginBottom: rV(28),
    },
    squadEmpty: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(14),
      padding: rMS(16),
      alignItems: "center",
    },
    squadEmptyText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      textAlign: "center",
      marginTop: rV(6),
      marginBottom: rV(12),
    },
    squadActionsRow: {
      flexDirection: "row",
      gap: rS(12),
      width: "100%",
    },
    squadActionButton: {
      flex: 1,
      height: rV(70),
      borderRadius: rMS(14),
      paddingHorizontal: rS(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    squadActionButtonPrimary: {
      backgroundColor: themeColors.tint,
    },
    squadActionButtonSecondary: {
      backgroundColor: themeColors.tint + "15",
    },
    squadActionTextContent: {
      flex: 1,
      alignItems: "flex-start",
    },
    squadActionLabel: {
      fontSize: rMS(9),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      opacity: 0.8,
      marginBottom: rV(2),
    },
    squadActionTitle: {
      fontSize: SIZES.medium,
      fontWeight: "800",
    },
    squadJoinInputContainer: {
      width: "100%",
      marginTop: rV(12),
      flexDirection: "row",
      gap: rS(10),
      alignItems: "center",
    },
    squadJoinInput: {
      flex: 1,
      backgroundColor: themeColors.card,
      borderRadius: rMS(10),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(14),
      fontSize: SIZES.small,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.tint + "30",
    },
    squadJoinBtn: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(10),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(16),
      justifyContent: "center",
      alignItems: "center",
    },
    squadJoinBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: SIZES.small,
    },
    squadItem: {
      backgroundColor: themeColors.card,
      padding: rMS(12),
      borderRadius: rMS(12),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(6),
    },
    squadItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
    },
    squadIcon: {
      width: rMS(32),
      height: rMS(32),
      borderRadius: rMS(16),
      backgroundColor: themeColors.tint + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    squadName: {
      fontSize: SIZES.small,
      fontWeight: "700",
      color: themeColors.text,
    },
    squadMembers: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.heroSection}
          >
            <Text style={styles.heroTitle}>Rankings</Text>
            <Text style={styles.heroSubtitle}>
              Track your standing and compete across knowledge communities.
            </Text>
          </Animated.View>

          {/* Action Grid - Multiplayer & Solo */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            style={styles.actionGrid}
          >
            <AnimatedTouchable
              style={[styles.actionButtonMultiplayer, multiplayerAnimStyle]}
              onPress={navigateMultiplayer}
              onPressIn={() => onPressIn(multiplayerScale)}
              onPressOut={() => onPressOut(multiplayerScale)}
              activeOpacity={1}
            >
              <View>
                <Text style={[styles.actionLabel, { color: "#fff" }]}>
                  With Friends
                </Text>
                <Text style={[styles.actionTitle, { color: "#fff" }]}>
                  Multiplayer
                </Text>
              </View>
              <Ionicons name="people" size={22} color="#fff" />
            </AnimatedTouchable>

            <AnimatedTouchable
              style={[styles.actionButtonSolo, soloAnimStyle]}
              onPress={navigateSoloPlay}
              onPressIn={() => onPressIn(soloScale)}
              onPressOut={() => onPressOut(soloScale)}
              activeOpacity={1}
            >
              <View>
                <Text style={[styles.actionLabel, { color: themeColors.tint }]}>
                  Compete Solo
                </Text>
                <Text style={[styles.actionTitle, { color: themeColors.text }]}>
                  Solo Play
                </Text>
              </View>
              <Ionicons name="flash" size={22} color={themeColors.tint} />
            </AnimatedTouchable>
          </Animated.View>

          {/* Join Game Card */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(300)}
            style={styles.joinCard}
          >
            <Text style={styles.joinLabel}>Got a game code?</Text>
            <View style={styles.joinRow}>
              <TextInput
                style={styles.joinInput}
                value={gameCode}
                onChangeText={setGameCode}
                placeholder="Enter 6-char code"
                placeholderTextColor={themeColors.textSecondary}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  joinGameDisabled && styles.joinButtonDisabled,
                ]}
                onPress={handleJoinPress}
                activeOpacity={0.8}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Study Squads (Custom Communities) */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.squadSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Study Squads</Text>
              {customLeaderboards.length > 0 && (
                <TouchableOpacity onPress={openFullLeaderboard}>
                  <Text style={styles.sectionSeeAll}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {customLeaderboards.length === 0 ? (
              <View style={styles.squadEmpty}>
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={themeColors.textSecondary}
                />
                <Text style={styles.squadEmptyText}>
                  Join or create a study squad to compete with friends
                </Text>
                
                <View style={styles.squadActionsRow}>
                  {/* Create Button */}
                  <TouchableOpacity 
                    style={[styles.squadActionButton, styles.squadActionButtonPrimary]}
                    activeOpacity={0.8}
                    onPress={createSquad}
                  >
                    <View style={styles.squadActionTextContent}>
                      <Text style={[styles.squadActionLabel, { color: "#fff" }]}>New Squad</Text>
                      <Text style={[styles.squadActionTitle, { color: "#fff" }]}>Create</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Join Button */}
                  <TouchableOpacity 
                    style={[styles.squadActionButton, styles.squadActionButtonSecondary]}
                    activeOpacity={0.8}
                    onPress={() => setShowJoinInput(!showJoinInput)}
                  >
                    <View style={styles.squadActionTextContent}>
                      <Text style={[styles.squadActionLabel, { color: themeColors.tint }]}>Entry Code</Text>
                      <Text style={[styles.squadActionTitle, { color: themeColors.tint }]}>Join</Text>
                    </View>
                    <Ionicons 
                      name={showJoinInput ? "chevron-up" : "keypad"} 
                      size={20} 
                      color={themeColors.tint} 
                    />
                  </TouchableOpacity>
                </View>

                {showJoinInput && (
                  <Animated.View 
                    entering={FadeInDown.duration(300)}
                    style={styles.squadJoinInputContainer}
                  >
                    <TextInput
                      style={styles.squadJoinInput}
                      value={squadJoinCode}
                      onChangeText={setSquadJoinCode}
                      placeholder="Enter invite code"
                      placeholderTextColor={themeColors.textSecondary}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity 
                      style={[styles.squadJoinBtn, !squadJoinCode && { opacity: 0.5 }]}
                      onPress={joinSquad}
                      disabled={!squadJoinCode}
                    >
                      <Text style={styles.squadJoinBtnText}>Join</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            ) : (
              customLeaderboards.map((lb) => (
                <TouchableOpacity
                  key={lb.id}
                  style={styles.squadItem}
                  onPress={() => openLeaderboard(lb.id, lb.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.squadItemLeft}>
                    <View style={styles.squadIcon}>
                      <Ionicons name="people" size={20} color={themeColors.tint} />
                    </View>
                    <View>
                      <Text style={styles.squadName}>{lb.name}</Text>
                      {lb.memberCount != null && (
                        <Text style={styles.squadMembers}>
                          {lb.memberCount} members
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            )}
          </Animated.View>

          {/* Global Standing */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Global Standing</Text>
            </View>

            {globalStandingItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(400).delay(550 + index * 80)}
              >
                <TouchableOpacity
                  style={styles.standingCard}
                  onPress={() => openLeaderboard(item.id, item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.standingCardLeft}>
                    <View
                      style={[styles.standingIconBox, { backgroundColor: item.color }]}
                    >
                      <Ionicons name={item.icon} size={24} color="#fff" />
                    </View>
                    <Text style={styles.standingName}>{item.name}</Text>
                  </View>
                  <View style={styles.standingCardRight}>
                    {item.rank && (
                      <Text style={styles.standingRank}>{item.rank}</Text>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
