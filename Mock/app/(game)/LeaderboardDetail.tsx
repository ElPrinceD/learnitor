import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import {
  getCustomH2HMatches,
  getCustomH2HStandings,
  getKnockoutBracket,
  getLeaderboardDetails,
} from "../../services/LeaderboardApiCalls";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants/index.js";
import ErrorMessage from "../../components/ErrorMessage";

import LeaderboardTopBar from "../../components/leaderboard/LeaderboardTopBar";
import LeaderboardHero from "../../components/leaderboard/LeaderboardHero";
import RankingsList from "../../components/leaderboard/RankingsList";
import H2HBattlesPanel from "../../components/leaderboard/H2HBattlesPanel";
import LeaderboardTabs, {
  LeaderboardTab,
} from "../../components/leaderboard/LeaderboardTabs";
import KnockoutBracket from "../../components/leaderboard/KnockoutBracket";

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

  const isKnockout = type === "knockout";

  // ── Outer tabs (only meaningful for non-knockout squads) ────────────────
  // Knockout squads (`custom_1v1`) skip these entirely — their page body is
  // the H2H Battles panel (Matches | Standings), not the global Rankings /
  // Knockout split.
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("rankings");

  // Tracks whether the Knockout sub-tab has ever been visited in this
  // session. Once true, the bracket stays mounted in the tree (just hidden
  // via `display: 'none'` when the user is on Rankings) so its
  // `entering={FadeInDown}` round animations only fire once — on the first
  // mount, right when the data first becomes available. Subsequent tab
  // toggles re-show the existing instance with no animation re-trigger.
  const [bracketEverVisited, setBracketEverVisited] = useState(false);

  useEffect(() => {
    if (activeTab === "knockout" && !bracketEverVisited) {
      setBracketEverVisited(true);
    }
  }, [activeTab, bracketEverVisited]);

  // ── Queries ─────────────────────────────────────────────────────────────
  // We fetch leaderboard details for BOTH squad types. Non-knockout squads
  // consume `rankings`; knockout squads ignore `rankings` and only read
  // `squadInfo` (needed to surface the creator-only settings gear and to
  // power SquadSettings.tsx, which calls the same query).
  const {
    data: leaderboardData,
    isLoading: rankingsLoading,
    error: rankingsError,
  } = useQuery({
    queryKey: ["leaderboardDetails", id, timeframe],
    queryFn: () => getLeaderboardDetails(id, userToken?.token, timeframe),
    enabled: !!userToken?.token,
  });

  // Global knockout bracket — same endpoint the pre-refactor code imported.
  // Only fetched for non-knockout squads (and only while the user is on the
  // Knockout sub-tab) since `custom_1v1` squads render their own H2H panel.
  const { data: knockoutBracketData, error: knockoutBracketError } = useQuery({
    queryKey: ["knockoutBracket"],
    queryFn: () => getKnockoutBracket(userToken?.token),
    enabled:
      !!userToken?.token && !isKnockout && activeTab === "knockout",
  });

  const { data: h2hMatchesData, error: h2hMatchesError } = useQuery({
    queryKey: ["customH2HMatches", id],
    queryFn: () => getCustomH2HMatches(id, userToken?.token),
    enabled: !!userToken?.token && isKnockout,
  });

  const { data: h2hStandingsData, error: h2hStandingsError } = useQuery({
    queryKey: ["customH2HStandings", id],
    queryFn: () => getCustomH2HStandings(id, userToken?.token),
    enabled: !!userToken?.token && isKnockout,
  });

  // ── Derived data ────────────────────────────────────────────────────────
  const rankings = useMemo(
    () => leaderboardData?.rankings ?? [],
    [leaderboardData?.rankings]
  );
  const squadInfo = leaderboardData?.squadInfo;

  // SW column is only meaningful on custom-squad responses where the backend
  // includes `weeklyExamScore`. Global / country / school leaderboards omit
  // the field entirely.
  const showWeeklyExamColumn = useMemo(
    () => rankings.some((r) => r.weeklyExamScore !== undefined),
    [rankings]
  );

  const matches = useMemo(() => h2hMatchesData ?? [], [h2hMatchesData]);
  const standings = useMemo(() => h2hStandingsData ?? [], [h2hStandingsData]);
  const knockoutRounds = useMemo(
    () => knockoutBracketData?.rounds ?? [],
    [knockoutBracketData?.rounds]
  );

  // ── Error state ─────────────────────────────────────────────────────────
  // Was a `const error = queryError ? "..." : ""` so `setError("")` (the
  // dismiss handler) failed silently. Now wired through useState properly.
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isKnockout) {
      if (h2hMatchesError || h2hStandingsError) {
        setError("Failed to load battles");
      }
    } else if (activeTab === "knockout") {
      if (knockoutBracketError) {
        setError("Failed to load knockout bracket");
      }
    } else if (rankingsError) {
      setError("Failed to load rankings");
    }
  }, [
    isKnockout,
    activeTab,
    h2hMatchesError,
    h2hStandingsError,
    knockoutBracketError,
    rankingsError,
  ]);

  const dismissError = useCallback(() => setError(""), []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const onBack = useCallback(() => router.back(), []);

  const onSettings = useCallback(() => {
    router.push({
      pathname: "/(game)/SquadSettings",
      params: { id, name },
    });
  }, [id, name]);

  const isMe = useCallback(
    (username: string) =>
      username === userInfo?.user.first_name || username === "You",
    [userInfo?.user.first_name]
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
        // Fixed (non-scrolling) header for non-knockout squads. Holds the
        // hero title + Rankings/Knockout tab pill so they DON'T remount on
        // sub-tab switches (which was causing the title to jitter and the
        // pill animation to be skipped on every toggle).
        fixedHeader: {
          paddingHorizontal: rS(16),
          paddingTop: Math.max(rV(80), insets.top + rV(50)),
        },
        // Wraps the swap-able body (RankingsList | KnockoutBracket scroll)
        // for the non-knockout flow. flex:1 so the FlashList / ScrollView
        // beneath the fixedHeader fills the remaining viewport.
        nonKnockoutBody: {
          flex: 1,
        },
        // Knockout sub-tab body (now mounted BELOW the fixedHeader, so it
        // no longer needs the topbar-clearing paddingTop).
        bracketScrollContent: {
          paddingHorizontal: rS(16),
          paddingBottom: rV(60),
        },
        errorWrap: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingHorizontal: rS(16),
          paddingTop: rV(110),
        },
        knockoutScroll: {
          flex: 1,
        },
        // Used to hide the kept-mounted Knockout ScrollView when the user
        // is on the Rankings sub-tab. `display: 'none'` preserves the
        // component instance (and therefore Reanimated's already-finished
        // entering animations) instead of unmounting it.
        hidden: {
          display: "none",
        },
      }),
    [themeColors, insets.top]
  );

  // ── Loading (non-knockout) ──────────────────────────────────────────────
  if (!isKnockout && rankingsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={styles.loadingText}>Loading Rankings...</Text>
      </View>
    );
  }

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

      {isKnockout ? (
        // Knockout squads (`custom_1v1`): the entire page body is the H2H
        // Battles panel. No outer Rankings/Knockout tabs — those only apply
        // to non-knockout squads.
        <ScrollView
          style={styles.knockoutScroll}
          contentContainerStyle={styles.h2hScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LeaderboardHero timeframe={timeframe} name={name} />
          <H2HBattlesPanel matches={matches} standings={standings} />
        </ScrollView>
      ) : (
        // Non-knockout squads: the hero + Rankings/Knockout tab pill live
        // OUTSIDE the sub-tab conditional so they stay mounted across
        // switches. Previously they were re-mounted in each branch's parent
        // (FlashList header for Rankings, ScrollView for Knockout), which
        // caused the title to jitter and skipped the pill's slide animation
        // (the sharedValue re-initialized at the destination on every
        // remount instead of animating to it).
        <View style={styles.nonKnockoutBody}>
          <View style={styles.fixedHeader}>
            <LeaderboardHero timeframe={timeframe} name={name} />
            <LeaderboardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          {/* Rankings sub-tab. Conditionally rendered (re-mounts on tab
              switch) — RankingRow has no entering animations, so a fresh
              mount is silent and react-query keeps the data cached. */}
          {activeTab === "rankings" && (
            <RankingsList
              rankings={rankings}
              isMe={isMe}
              showWeeklyExamColumn={showWeeklyExamColumn}
            />
          )}

          {/* Knockout sub-tab. LAZY-MOUNTED on first visit, then kept
              mounted (just hidden via `display: 'none'` when the user
              swaps back to Rankings). This is what makes the bracket's
              per-round FadeInDown fire exactly once — on the first
              render with data — instead of on every tab toggle. */}
          {bracketEverVisited && (
            <ScrollView
              style={[
                styles.knockoutScroll,
                activeTab !== "knockout" && styles.hidden,
              ]}
              contentContainerStyle={styles.bracketScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <KnockoutBracket
                rounds={knockoutRounds}
                squadInfo={squadInfo}
                isMe={isMe}
              />
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.errorWrap} pointerEvents="box-none">
        <ErrorMessage
          message={error}
          visible={!!error}
          onDismiss={dismissError}
        />
      </View>
    </View>
  );
}
