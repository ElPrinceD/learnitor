import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import ScreenLoadingSpinner from "../../components/ScreenLoadingSpinner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants/index.js";
import ErrorMessage from "../../components/ErrorMessage";
import { safeRequestIdleCallback, safeCancelIdleCallback } from "../../utils/idleCallback";

import LeaderboardTopBar from "../../components/leaderboard/LeaderboardTopBar";
import LeaderboardHero from "../../components/leaderboard/LeaderboardHero";
import RankingsList from "../../components/leaderboard/RankingsList";
import H2HBattlesPanel from "../../components/leaderboard/H2HBattlesPanel";
import LeaderboardTabs, {
  LeaderboardTab,
} from "../../components/leaderboard/LeaderboardTabs";
import KnockoutBracketList from "../../components/leaderboard/KnockoutBracketList";
import LeaderboardSetupGate from "../../components/leaderboard/LeaderboardSetupGate";
import LeaderboardProfileSetupSheet, {
  LeaderboardProfileSetupSheetRef,
} from "../../components/leaderboard/LeaderboardProfileSetupSheet";
import { attemptCountryBackfillFromSchool } from "../../hooks/useInstitutionProfileSave";
import {
  getLeaderboardSetupBlock,
  normalizeBoardId,
} from "../../utils/leaderboardProfile";

import { useLeaderboardQueries } from "../../hooks/useLeaderboardQueries";
import { useLeaderboardDerivedState } from "../../hooks/useLeaderboardDerivedState";

export default function LeaderboardDetail() {
  const { id, name, timeframe, type } = useLocalSearchParams<{
    id: string;
    name: string;
    timeframe: string;
    type?: string;
  }>();
  const { userToken, userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const isH2H = type === "h2h";

  const setupBlock = useMemo(
    () => getLeaderboardSetupBlock(id, userInfo?.user),
    [id, userInfo?.user]
  );
  const canFetchLeaderboard = !!userToken?.token && !setupBlock;

  const setupSheetRef = useRef<LeaderboardProfileSetupSheetRef>(null);

  const openSetupSheet = useCallback(() => {
    setupSheetRef.current?.present();
  }, []);

  // ── Outer tabs ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("rankings");
  const [hasVisitedKnockout, setHasVisitedKnockout] = useState(false);
  const [isTransitionReady, setIsTransitionReady] = useState(false);

  useEffect(() => {
    const handle = safeRequestIdleCallback(() => {
      setIsTransitionReady(true);
    }, { timeout: 150 });
    return () => safeCancelIdleCallback(handle);
  }, []);

  useEffect(() => {
    if (activeTab === "knockout") {
      setHasVisitedKnockout(true);
    }
  }, [activeTab]);

  // ── Hooks ───────────────────────────────────────────────────────────────
  const {
    paginationOffset,
    allRankings,
    serverHasMore,
    handleLoadMore,
    leaderboardData,
    rankingsLoading,
    rankingsError,
    refetchLeaderboard,
    isLeaderboardFetching,
    knockoutBracketData,
    knockoutBracketError,
    h2hMatchesData,
    h2hMatchesError,
    h2hStandingsData,
    h2hStandingsError,
    onRefresh,
    isRefreshing,
  } = useLeaderboardQueries({
    id,
    timeframe,
    userToken: userToken?.token,
    canFetchLeaderboard,
    isH2H,
  });
  const {
    heroTitle,
    leaderboardSubtitle,
    showWeeklyExamColumn,
    rankings,
    squadInfo,
    matches,
    standings,
    knockoutRounds,
    isMe,
    isMeByName,
  } = useLeaderboardDerivedState({
    id,
    name,
    leaderboardData,
    allRankings,
    paginationOffset,
    userInfo,
    h2hMatchesData,
    h2hStandingsData,
    knockoutBracketData,
  });

  // ── Setup completion logic ──────────────────────────────────────────────
  const handleSetupSuccess = useCallback(() => {
    requestAnimationFrame(() => {
      void refetchLeaderboard();
    });
  }, [refetchLeaderboard]);

  useEffect(() => {
    const boardId = normalizeBoardId(id);
    if (boardId !== "country" || setupBlock !== "country") {
      return;
    }

    let cancelled = false;
    void (async () => {
      const ok = await attemptCountryBackfillFromSchool();
      if (!cancelled && ok) {
        handleSetupSuccess();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, setupBlock, handleSetupSuccess]);

  // ── Error state ─────────────────────────────────────────────────────────
  const [error, setError] = useState<string>("");
  const dismissedErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (setupBlock) {
      setError("");
      return;
    }
    let nextError = "";
    if (isH2H) {
      if (h2hMatchesError || h2hStandingsError) {
        nextError = "Failed to load battles";
      }
    } else if (activeTab === "knockout") {
      if (knockoutBracketError) {
        nextError = "Failed to load knockout bracket";
      }
    } else if (rankingsError) {
      nextError = "Failed to load rankings";
    }

    if (nextError && nextError === dismissedErrorRef.current) {
      return;
    }
    if (nextError !== error) {
      dismissedErrorRef.current = null;
      setError(nextError);
    }
  }, [
    setupBlock,
    isH2H,
    activeTab,
    h2hMatchesError,
    h2hStandingsError,
    knockoutBracketError,
    rankingsError,
    error,
  ]);

  const dismissError = useCallback(() => {
    dismissedErrorRef.current = error;
    setError("");
  }, [error]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const onBack = useCallback(() => router.back(), []);

  const onSettings = useCallback(() => {
    router.push({
      pathname: "/(game)/SquadSettings",
      params: { id, name },
    });
  }, [id, name]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={themeColors.tint}
      colors={[themeColors.tint, themeColors.text]}
      progressBackgroundColor={themeColors.background}
    />
  );

  // ── Styles ──────────────────────────────────────────────────────────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        h2hScrollContent: {
          paddingHorizontal: rS(16),
          paddingTop: rV(96),
          paddingBottom: rV(60),
        },
        fixedHeader: {
          paddingHorizontal: rS(16),
          paddingTop: Math.max(rV(80), insets.top + rV(50)),
        },
        stickyColumnHeaders: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: rMS(10),
          paddingBottom: rV(8),
        },
        columnLabel: {
          fontSize: rMS(10),
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 2,
          color: themeColors.textSecondary,
        },
        columnLabelStudent: { flex: 1, textAlign: "left" },
        columnLabelSW: { width: rS(48), textAlign: "center" },
        columnLabelPoints: { width: rS(72), textAlign: "right" },
        nonKnockoutBody: {
          flex: 1,
        },
        knockoutScroll: {
          flex: 1,
        },
        errorWrap: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        },
      }),
    [themeColors, insets.top]
  );

  const showSettings = !!squadInfo?.isCreator;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <LeaderboardTopBar
        onBack={onBack}
        onSettings={onSettings}
        showSettings={showSettings}
      />

      {isH2H ? (
        <ScrollView
          style={styles.knockoutScroll}
          contentContainerStyle={styles.h2hScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <LeaderboardHero
            timeframe={timeframe}
            name={heroTitle}
            subtitle={leaderboardSubtitle}
          />
          <H2HBattlesPanel squadId={id} matches={matches} standings={standings} />
        </ScrollView>
      ) : (
        <View style={styles.nonKnockoutBody}>
          <View style={styles.fixedHeader}>
            <LeaderboardHero
              timeframe={timeframe}
              name={heroTitle}
              subtitle={leaderboardSubtitle}
            />
            {!setupBlock ? (
              <LeaderboardTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            ) : null}
            {!setupBlock && activeTab === "rankings" && (
              <View style={styles.stickyColumnHeaders}>
                <Text style={[styles.columnLabel, styles.columnLabelStudent]}>
                  Rank / Student
                </Text>
                {showWeeklyExamColumn && (
                  <Text style={[styles.columnLabel, styles.columnLabelSW]}>SW</Text>
                )}
                <Text style={[styles.columnLabel, styles.columnLabelPoints]}>
                  Points
                </Text>
              </View>
            )}
          </View>

          {setupBlock ? (
            <LeaderboardSetupGate
              variant={setupBlock}
              onPrimaryPress={openSetupSheet}
              onBack={onBack}
            />
          ) : (
            <View style={{ flex: 1 }}>
              {!isTransitionReady || (rankingsLoading && !leaderboardData) ? (
                activeTab === "rankings" ? (
                  <ScreenLoadingSpinner />
                ) : null
              ) : (
                <View style={{ flex: 1, display: activeTab === "rankings" ? "flex" : "none" }}>
                  <RankingsList
                    rankings={isTransitionReady ? rankings : []}
                    isMe={isMe}
                    showWeeklyExamColumn={showWeeklyExamColumn}
                    hideColumnHeaders
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    hasMore={serverHasMore}
                    onLoadMore={handleLoadMore}
                    isLoadingMore={
                      isLeaderboardFetching && paginationOffset > 0
                    }
                  />
                </View>
              )}

              {hasVisitedKnockout && (
                <View style={{ flex: 1, display: activeTab === "knockout" ? "flex" : "none" }}>
                  <KnockoutBracketList
                    rounds={isTransitionReady ? knockoutRounds : []}
                    squadInfo={squadInfo}
                    isMe={isMeByName}
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {!setupBlock ? (
        <View style={styles.errorWrap} pointerEvents="box-none">
          <ErrorMessage
            message={error}
            visible={!!error}
            onDismiss={dismissError}
          />
        </View>
      ) : null}

      {setupBlock ? (
        <LeaderboardProfileSetupSheet
          ref={setupSheetRef}
          variant={setupBlock}
          onSuccess={handleSetupSuccess}
        />
      ) : null}
    </View>
  );
}
