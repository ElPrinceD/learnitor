import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Copy, RefreshCw } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants/index.js";
import Toast from "react-native-root-toast";
import {
  getLeaderboardDetails,
  updateSquadDetails,
  regenerateInviteCode,
  removeSquadMember,
  deleteSquad,
  SquadMember,
} from "../../services/LeaderboardApiCalls";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SquadSettings() {
  const { id, name: initialName } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  const { userToken } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const [squadName, setSquadName] = useState(initialName || "");
  const [isCodePublic, setIsCodePublic] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);

  // Back button scale
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  // One-time animation flag
  const hasAnimated = useRef(false);
  useEffect(() => { hasAnimated.current = true; }, []);
  const enterAnim = (delay: number) =>
    hasAnimated.current ? undefined : FadeInDown.duration(300).delay(delay);

  // Fetch squad details for members list, invite code, etc.
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["leaderboardDetails", id, "season"],
    queryFn: () => getLeaderboardDetails(id, userToken?.token, "season"),
    enabled: !!userToken?.token && !!id,
  });

  useEffect(() => {
    if (detailData?.squadInfo) {
      setInviteCode(detailData.squadInfo.invite_code || null);
      setIsCodePublic(detailData.squadInfo.isCodePublic || false);
      setMembers(detailData.squadInfo.members || []);
    }
  }, [detailData]);

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

  // Mutations
  const updateDetailsMutation = useMutation({
    mutationFn: (data: { name?: string; isCodePublic?: boolean }) =>
      updateSquadDetails(id, userToken?.token, data),
    onSuccess: (data) => {
      showToast("Squad updated!");
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails", id] });
    },
    onError: () => showToast("Failed to update. Try again."),
  });

  const regenCodeMutation = useMutation({
    mutationFn: () => regenerateInviteCode(id, userToken?.token),
    onSuccess: (data) => {
      setInviteCode(data.invite_code);
      showToast("New invite code generated!");
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails", id] });
    },
    onError: () => showToast("Failed to regenerate code."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeSquadMember(id, userId, userToken?.token),
    onSuccess: (_, userId) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      showToast("Member removed.");
      queryClient.invalidateQueries({ queryKey: ["leaderboardDetails", id] });
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
    },
    onError: () => showToast("Failed to remove member."),
  });

  const deleteSquadMutation = useMutation({
    mutationFn: () => deleteSquad(id, userToken?.token),
    onSuccess: () => {
      showToast("Squad deleted.");
      queryClient.invalidateQueries({ queryKey: ["customLeaderboards"] });
      // Navigate back two screens (to play hub)
      router.back();
      setTimeout(() => router.back(), 100);
    },
    onError: () => showToast("Failed to delete squad."),
  });

  const handleSaveName = () => {
    if (!squadName.trim()) {
      showToast("Name cannot be empty.");
      return;
    }
    updateDetailsMutation.mutate({ name: squadName.trim() });
  };

  const handleToggleCodeVisibility = (value: boolean) => {
    setIsCodePublic(value);
    updateDetailsMutation.mutate({ isCodePublic: value });
  };

  const handleRegenCode = () => {
    Alert.alert(
      "Regenerate Code",
      "This will invalidate the current invite code. Anyone with the old code won't be able to join. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Regenerate", style: "destructive", onPress: () => regenCodeMutation.mutate() },
      ]
    );
  };

  const handleRemoveMember = (member: SquadMember) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.username} from the squad?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeMemberMutation.mutate(member.id) },
      ]
    );
  };

  const handleDeleteSquad = () => {
    Alert.alert(
      "Delete Squad",
      "This action is permanent and cannot be undone. All members will be removed. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSquadMutation.mutate() },
      ]
    );
  };

  const copyCode = () => {
    if (!inviteCode) return;
    try {
      const Clipboard = require("expo-clipboard");
      Clipboard.setStringAsync(inviteCode);
      showToast("Code copied!");
    } catch {
      showToast(inviteCode);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    blob1: {
      position: "absolute",
      top: -rV(100),
      right: -rS(50),
      width: rS(250),
      height: rS(250),
      borderRadius: rS(125),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(100),
      left: -rS(100),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#10B98118",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(rV(80), insets.top + rV(50)),
      zIndex: 10,
      flexDirection: "row",
      alignItems: "flex-end",
      paddingBottom: rV(8),
      paddingHorizontal: rS(16),
    },
    scrollContent: {
      paddingHorizontal: rS(16),
      paddingTop: Math.max(rV(80), insets.top + rV(50)),
      paddingBottom: Math.max(rV(40), insets.bottom + rV(40)),
    },
    backButton: {
      width: rMS(38),
      height: rMS(38),
      borderRadius: rMS(19),
      backgroundColor: themeColors.cardGlass,
      alignItems: "center",
      justifyContent: "center",
      ...shadow.light,
    },
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
    },
    // Section cards
    sectionCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(28),
      padding: rMS(20),
      marginBottom: rV(14),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    sectionLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: themeColors.textSecondary,
      marginBottom: rV(12),
    },
    nameInput: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      paddingVertical: rV(12),
      paddingHorizontal: rMS(14),
      fontSize: rMS(15),
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
      fontWeight: "700",
    },
    saveButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(16),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(18),
      alignItems: "center",
      justifyContent: "center",
      marginTop: rV(10),
      alignSelf: "flex-end",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: rMS(13),
      fontWeight: "800",
    },
    // Invite code
    codeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    codeDisplay: {
      backgroundColor: themeColors.background,
      borderRadius: rMS(16),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(16),
      flexDirection: "row",
      alignItems: "center",
      gap: rS(8),
      borderWidth: 1,
      borderColor: themeColors.border,
      flex: 1,
      marginRight: rS(10),
    },
    codeText: {
      fontSize: rMS(18),
      fontWeight: "900",
      color: themeColors.tint,
      letterSpacing: 3,
    },
    codeActions: {
      flexDirection: "row",
      gap: rS(8),
    },
    codeActionBtn: {
      width: rMS(38),
      height: rMS(38),
      borderRadius: rMS(19),
      backgroundColor: themeColors.tint + "12",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.tint + "25",
    },
    // Visibility toggle
    visibilityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: rV(14),
    },
    visibilityLabel: {
      flex: 1,
    },
    visibilityTitle: {
      fontSize: rMS(13),
      fontWeight: "800",
      color: themeColors.text,
    },
    visibilitySubtext: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    // Members
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: rV(10),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + "25",
    },
    memberLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: rS(12),
      flex: 1,
    },
    memberAvatar: {
      width: rMS(36),
      height: rMS(36),
      borderRadius: rMS(18),
      backgroundColor: themeColors.tint + "15",
    },
    memberName: {
      fontSize: rMS(14),
      fontWeight: "700",
      color: themeColors.text,
    },
    removeBtn: {
      paddingHorizontal: rMS(12),
      paddingVertical: rV(6),
      borderRadius: rMS(12),
      backgroundColor: "#F4433610",
    },
    removeBtnText: {
      fontSize: rMS(11),
      fontWeight: "800",
      color: "#F44336",
    },
    // Danger zone
    dangerCard: {
      backgroundColor: "#F4433608",
      borderRadius: rMS(28),
      padding: rMS(20),
      marginBottom: rV(14),
      borderWidth: 1.5,
      borderColor: "#F4433625",
    },
    dangerTitle: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2,
      color: "#F44336",
      marginBottom: rV(12),
    },
    deleteButton: {
      backgroundColor: "#F44336",
      borderRadius: rMS(16),
      paddingVertical: rV(14),
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "900",
      letterSpacing: 0.5,
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={styles.loadingText}>Loading Settings...</Text>
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

      {/* Top bar */}
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.topBar}
      >
        <AnimatedTouchable
          style={[styles.backButton, backAnimStyle]}
          onPress={() => router.back()}
          onPressIn={() => {
            backScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            backScale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          activeOpacity={1}
        >
          <ArrowLeft size={22} color={themeColors.text} />
        </AnimatedTouchable>
      </BlurView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={enterAnim(50)} style={styles.heroSection}>
          <Text style={styles.heroLabel}>Squad Settings</Text>
          <Text style={styles.heroTitle}>{initialName || "Settings"}</Text>
        </Animated.View>

        {/* Squad Name */}
        <Animated.View entering={enterAnim(100)}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Squad Name</Text>
            <TextInput
              style={styles.nameInput}
              value={squadName}
              onChangeText={setSquadName}
              placeholder="Squad name"
              placeholderTextColor={themeColors.textSecondary}
              maxLength={40}
            />
            <TouchableOpacity
              style={[styles.saveButton, updateDetailsMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSaveName}
              disabled={updateDetailsMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {updateDetailsMutation.isPending ? "Saving..." : "Save Name"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Invite Code */}
        <Animated.View entering={enterAnim(150)}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Invite Code</Text>
            <View style={styles.codeRow}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{inviteCode || "—"}</Text>
              </View>
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.codeActionBtn}
                  onPress={copyCode}
                  activeOpacity={0.7}
                >
                  <Copy size={18} color={themeColors.tint} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.codeActionBtn}
                  onPress={handleRegenCode}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={18} color={themeColors.tint} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Code visibility toggle */}
            <View style={styles.visibilityRow}>
              <View style={styles.visibilityLabel}>
                <Text style={styles.visibilityTitle}>Code Visible to All Members</Text>
                <Text style={styles.visibilitySubtext}>
                  {isCodePublic
                    ? "All members can see and share the invite code"
                    : "Only you (the creator) can see the invite code"}
                </Text>
              </View>
              <Switch
                value={isCodePublic}
                onValueChange={handleToggleCodeVisibility}
                trackColor={{ false: themeColors.border, true: themeColors.tint + "60" }}
                thumbColor={isCodePublic ? themeColors.tint : themeColors.textSecondary}
              />
            </View>
          </View>
        </Animated.View>

        {/* Members */}
        <Animated.View entering={enterAnim(200)}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>
              Members ({members.length})
            </Text>
            {members.length === 0 ? (
              <Text style={{ color: themeColors.textSecondary, fontSize: rMS(13), fontWeight: "600" }}>
                No members to display.
              </Text>
            ) : (
              members.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    idx === members.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.memberLeft}>
                    <Image
                      source={
                        member.avatarUrl
                          ? { uri: member.avatarUrl }
                          : require("../../assets/images/profile-placeholder.png")
                      }
                      style={styles.memberAvatar}
                    />
                    <Text style={styles.memberName}>{member.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMember(member)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={enterAnim(250)}>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={[styles.deleteButton, deleteSquadMutation.isPending && { opacity: 0.6 }]}
              onPress={handleDeleteSquad}
              disabled={deleteSquadMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>
                {deleteSquadMutation.isPending ? "Deleting..." : "Delete Squad"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
