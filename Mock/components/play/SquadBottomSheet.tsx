import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { CheckCircle2, Copy, LogIn } from "lucide-react-native";
import Colors from "../../constants/Colors";
import VerificationButton from "../VerificationButton";
import { SIZES, rMS, rS, rV, useShadows } from "../../constants";
import type { ScoringMode, SheetTab } from "./types";

interface Props {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  sheetTab: SheetTab;
  onSheetTabChange: (tab: SheetTab) => void;
  squadName: string;
  onSquadNameChange: (v: string) => void;
  squadJoinCode: string;
  onSquadJoinCodeChange: (v: string) => void;
  createdSquadCode: string | null;
  onCopyCode: () => void;
  onCreateSquad: (mode: ScoringMode) => void;
  onJoinSquad: () => void;
  onClose: () => void;
  joinPending: boolean;
  createPending?: boolean;
}

const SquadBottomSheet: React.FC<Props> = ({
  sheetRef,
  sheetTab,
  onSheetTabChange,
  squadName,
  onSquadNameChange,
  squadJoinCode,
  onSquadJoinCodeChange,
  createdSquadCode,
  onCopyCode,
  onCreateSquad,
  onJoinSquad,
  onClose,
  joinPending,
  createPending = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();
  const [selectedScoringMode, setSelectedScoringMode] =
    useState<ScoringMode | null>(null);

  const snapPoints = useMemo(() => ["65%", "85%"], []);

  const sheetTabX = useSharedValue(0);
  const sheetTabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheetTabX.value }],
  }));

  useEffect(() => {
    const targetX =
      sheetTab === "create"
        ? 0
        : (Dimensions.get("window").width - rS(40) - rMS(6)) / 2;
    sheetTabX.value = withTiming(targetX, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [sheetTab, sheetTabX]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handlePressCreateTab = useCallback(() => {
    onSheetTabChange("create");
  }, [onSheetTabChange]);
  const handlePressJoinTab = useCallback(() => {
    onSheetTabChange("join");
  }, [onSheetTabChange]);

  useEffect(() => {
    if (sheetTab !== "create" || createdSquadCode) {
      setSelectedScoringMode(null);
    }
  }, [sheetTab, createdSquadCode]);

  useEffect(() => {
    if (!squadName.trim()) {
      setSelectedScoringMode(null);
    }
  }, [squadName]);

  const canCreateSquad =
    squadName.trim().length > 0 && selectedScoringMode != null && !createPending;

  const handlePressCreate = useCallback(() => {
    if (!selectedScoringMode || !canCreateSquad) return;
    onCreateSquad(selectedScoringMode);
  }, [selectedScoringMode, canCreateSquad, onCreateSquad]);

  const modeOptions: {
    mode: ScoringMode;
    label: string;
    desc: string;
  }[] = useMemo(
    () => [
      {
        mode: "all_points",
        label: "📊 All Points",
        desc: "Points from multiplayer, solo games, and weekly exam all count.",
      },
      {
        mode: "exam_only",
        label: "📝 Exam Only",
        desc: "Only weekly exam scores count towards the leaderboard.",
      },
      {
        mode: "custom_1v1",
        label: "⚔️ H2H League",
        desc: "Members are matched weekly. Win=3 pts, Draw=1, Loss=0.",
      },
    ],
    []
  );

  const styles = StyleSheet.create({
    modalTitle: {
      fontSize: rMS(20),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(6),
    },
    modalSubtitle: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
      marginBottom: rV(20),
      lineHeight: rMS(18),
    },
    modeOption: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(16),
      marginBottom: rV(10),
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    modeOptionLabel: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.text,
      marginBottom: rV(4),
    },
    modeOptionDesc: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      lineHeight: rMS(17),
    },
    squadJoinInput: {
      flex: 1,
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      paddingVertical: rV(10),
      paddingHorizontal: rMS(14),
      fontSize: SIZES.small,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    primaryBtnWrap: {
      width: "100%",
      alignItems: "center",
      marginTop: rV(12),
    },
    successWrapper: {
      alignItems: "center",
      paddingVertical: rV(24),
    },
    inviteCodeBox: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      paddingVertical: rV(14),
      paddingHorizontal: rMS(28),
      marginTop: rV(8),
      borderWidth: 1.5,
      borderColor: themeColors.tint + "30",
      ...shadow.medium,
    },
    inviteCodeText: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.tint,
      letterSpacing: 4,
      textAlign: "center",
    },
    copyRow: {
      marginTop: rV(12),
      flexDirection: "row",
      alignItems: "center",
      gap: rS(6),
    },
    copyText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(16),
      padding: rMS(3),
      marginBottom: rV(18),
      borderWidth: 1,
      borderColor: themeColors.border + "30",
      position: "relative",
    },
    tabBarIndicator: {
      position: "absolute",
      top: rMS(3),
      bottom: rMS(3),
      left: rMS(3),
      width: "50%",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(13),
    },
    tabBtn: {
      flex: 1,
      paddingVertical: rV(10),
      borderRadius: rMS(13),
      alignItems: "center",
      zIndex: 1,
    },
    tabBtnText: {
      fontSize: rMS(13),
      fontWeight: "800",
    },
    inputLabel: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginBottom: rV(6),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    inputLabelChoose: {
      fontSize: rMS(11),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginBottom: rV(10),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    joinIntro: {
      alignItems: "center",
      marginBottom: rV(20),
      marginTop: rV(8),
    },
    joinIconBox: {
      width: rMS(56),
      height: rMS(56),
      borderRadius: rMS(28),
      backgroundColor: themeColors.tint + "12",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
    },
    joinCodeInput: {
      width: "100%",
      textAlign: "center",
      fontSize: rMS(20),
      fontWeight: "900",
      letterSpacing: 4,
      paddingVertical: rV(14),
      marginBottom: rV(16),
    },
  });

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: themeColors.background,
        borderRadius: rMS(28),
      }}
      handleIndicatorStyle={{
        backgroundColor: themeColors.textSecondary + "50",
        width: rS(40),
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: rS(20),
          paddingBottom: rV(30),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {createdSquadCode ? (
          <View style={styles.successWrapper}>
            <CheckCircle2 size={56} color="#4CAF50" />
            <Text
              style={[
                styles.modalTitle,
                { marginTop: rV(12), textAlign: "center" },
              ]}
            >
              Squad Created!
            </Text>
            <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>
              Share this invite code with friends so they can join your squad.
            </Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeText}>{createdSquadCode}</Text>
            </View>
            <TouchableOpacity style={styles.copyRow} onPress={onCopyCode}>
              <Copy size={16} color={themeColors.tint} />
              <Text style={styles.copyText}>Copy Code</Text>
            </TouchableOpacity>
            <View style={[styles.primaryBtnWrap, { marginTop: rV(20) }]}>
              <VerificationButton
                onPress={onClose}
                title="Done"
                style={{ width: "100%" }}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.tabBar}>
              <Animated.View
                style={[styles.tabBarIndicator, sheetTabAnimStyle]}
              />
              <TouchableOpacity
                style={styles.tabBtn}
                onPress={handlePressCreateTab}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        sheetTab === "create"
                          ? "#fff"
                          : themeColors.textSecondary,
                    },
                  ]}
                >
                  Create Squad
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabBtn}
                onPress={handlePressJoinTab}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        sheetTab === "join"
                          ? "#fff"
                          : themeColors.textSecondary,
                    },
                  ]}
                >
                  Join Squad
                </Text>
              </TouchableOpacity>
            </View>

            {sheetTab === "create" ? (
              <>
                <Text style={styles.inputLabel}>Squad Name</Text>
                <BottomSheetTextInput
                  style={[
                    styles.squadJoinInput,
                    { width: "100%", marginBottom: rV(14) },
                  ]}
                  value={squadName}
                  onChangeText={onSquadNameChange}
                  placeholder="e.g. CS Study Squad"
                  placeholderTextColor={themeColors.textSecondary}
                  maxLength={40}
                />

                <Text style={styles.inputLabelChoose}>
                  Choose Scoring Mode
                </Text>

                {modeOptions.map((option) => {
                  const isSelected = selectedScoringMode === option.mode;
                  return (
                    <TouchableOpacity
                      key={option.mode}
                      style={[
                        styles.modeOption,
                        isSelected && {
                          borderColor: themeColors.tint,
                          backgroundColor: themeColors.tint + "10",
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedScoringMode(option.mode)}
                    >
                      <Text style={styles.modeOptionLabel}>{option.label}</Text>
                      <Text style={styles.modeOptionDesc}>{option.desc}</Text>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.primaryBtnWrap}>
                  <VerificationButton
                    onPress={handlePressCreate}
                    title={createPending ? "Creating..." : "Create Squad"}
                    disabled={!canCreateSquad}
                    style={{ width: "100%" }}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.joinIntro}>
                  <View style={styles.joinIconBox}>
                    <LogIn size={28} color={themeColors.tint} />
                  </View>
                  <Text
                    style={[styles.modalTitle, { textAlign: "center" }]}
                  >
                    Join a Squad
                  </Text>
                  <Text
                    style={[styles.modalSubtitle, { textAlign: "center" }]}
                  >
                    Enter the invite code shared by your squad creator.
                  </Text>
                </View>

                <BottomSheetTextInput
                  style={[styles.squadJoinInput, styles.joinCodeInput]}
                  value={squadJoinCode}
                  onChangeText={onSquadJoinCodeChange}
                  placeholder="INVITE CODE"
                  placeholderTextColor={themeColors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={10}
                />

                <View style={styles.primaryBtnWrap}>
                  <VerificationButton
                    onPress={onJoinSquad}
                    title={joinPending ? "Joining..." : "Join Squad"}
                    disabled={!squadJoinCode.trim() || joinPending}
                    style={{ width: "100%" }}
                  />
                </View>
              </>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default memo(SquadBottomSheet);
