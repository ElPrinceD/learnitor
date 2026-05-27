import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useQuery } from "@tanstack/react-query";

import {
  getCustomH2HMatches,
  getCustomH2HStandings,
  getKnockoutBracket,
  getLeaderboardDetails,
  SquadInfo,
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

const COUNTRY_MAP: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  ZA: "South Africa",
  KE: "Kenya",
  IN: "India",
};

const getCountryName = (code?: string) => {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRY_MAP[upper] || code;
};

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
  // For non-knockout squads: fetches per-squad bracket.
  // For global leaderboards (world/country/school): fetches the global bracket.
  // Only fetched when the user is on the Knockout sub-tab since `custom_1v1`
  // squads render their own H2H panel.
  const { data: knockoutBracketData, error: knockoutBracketError } = useQuery({
    queryKey: ["knockoutBracket", id],
    queryFn: () => getKnockoutBracket(userToken?.token, id),
    // Prefetch eagerly so data is ready when the user switches tabs.
    enabled: !!userToken?.token && !isKnockout,
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
  const rankings = useMemo(() => {
    const list = leaderboardData?.rankings ?? [];
    return list.map((item) => {
      const isCurrentUser =
        item.id === userInfo?.user.id ||
        item.username === userInfo?.user.username ||
        item.username === "You";

      if (isCurrentUser) {
        return {
          ...item,
          username: userInfo?.user.username || item.username,
        };
      }
      return item;
    });
  }, [leaderboardData?.rankings, userInfo?.user.id, userInfo?.user.username]);

  // For custom squads, knockout timing lives inside `squadInfo`. For global
  // leaderboards (world/country/school), the backend returns it at the
  // response root. Merge both sources so KnockoutBracket always receives
  // the info it needs to display "KNOCKOUT STARTS IN SW X".
  const squadInfo = useMemo<SquadInfo | undefined>(() => {
    const base = leaderboardData?.squadInfo;
    const topLevel = {
      knockoutStartWeek: leaderboardData?.knockoutStartWeek,
      knockoutStarted: leaderboardData?.knockoutStarted,
      totalKnockoutRounds: leaderboardData?.totalKnockoutRounds,
    };
    // If squadInfo exists (custom squad), prefer its values but let
    // top-level act as fallback. If it doesn't exist (global leaderboard),
    // construct a minimal SquadInfo from the top-level fields.
    if (base) {
      return {
        ...base,
        knockoutStartWeek: base.knockoutStartWeek ?? topLevel.knockoutStartWeek,
        knockoutStarted: base.knockoutStarted ?? topLevel.knockoutStarted,
        totalKnockoutRounds: base.totalKnockoutRounds ?? topLevel.totalKnockoutRounds,
      };
    }
    // Only construct if the backend actually sent at least one field.
    if (topLevel.knockoutStartWeek != null) {
      return topLevel;
    }
    return undefined;
  }, [
    leaderboardData?.squadInfo,
    leaderboardData?.knockoutStartWeek,
    leaderboardData?.knockoutStarted,
    leaderboardData?.totalKnockoutRounds,
  ]);
  const resolvedLeaderboardId = Array.isArray(id) ? id[0] : id;
  const isGlobalLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    ["world", "country", "school"].includes(
      resolvedLeaderboardId.toLowerCase()
    );

  const isSchoolLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    resolvedLeaderboardId.toLowerCase() === "school";

  const heroTitle = isSchoolLeaderboard ? "School Ranking" : name;

  const isCountryLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    resolvedLeaderboardId.toLowerCase() === "country";

  const leaderboardSubtitle = useMemo(() => {
    if (isSchoolLeaderboard) {
      return (
        leaderboardData?.schoolName ??
        leaderboardData?.schoolInstitution?.name ??
        leaderboardData?.userStatus?.schoolName
      );
    }
    if (isCountryLeaderboard) {
      const countryVal =
        leaderboardData?.countryName ??
        leaderboardData?.country ??
        userInfo?.user?.address?.country;
      return getCountryName(countryVal);
    }
    return undefined;
  }, [
    isSchoolLeaderboard,
    isCountryLeaderboard,
    leaderboardData?.schoolName,
    leaderboardData?.schoolInstitution?.name,
    leaderboardData?.userStatus?.schoolName,
    leaderboardData?.countryName,
    leaderboardData?.country,
    userInfo?.user?.address?.country,
  ]);

  // SW column: custom squads when the API sends `weeklyExamScore`, and
  // always for world / country / school (same table shape as squads; values
  // show once the backend includes the field on those endpoints too).
  const showWeeklyExamColumn = useMemo(
    () =>
      isGlobalLeaderboard ||
      rankings.some((r) => r.weeklyExamScore !== undefined),
    [isGlobalLeaderboard, rankings]
  );

  const matches = useMemo(() => {
    const list = h2hMatchesData ?? [];
    return list.map((m) => {
      let p1 = m.player1;
      let p2 = m.player2;
      if (p1 === "You" || p1 === userInfo?.user.username) {
        p1 = userInfo?.user.username || p1;
      }
      if (p2 === "You" || p2 === userInfo?.user.username) {
        p2 = userInfo?.user.username || p2;
      }
      return { ...m, player1: p1, player2: p2 };
    });
  }, [h2hMatchesData, userInfo?.user.username]);

  const standings = useMemo(() => {
    const list = h2hStandingsData ?? [];
    return list.map((s) => {
      if (s.name === "You" || s.name === userInfo?.user.username) {
        return { ...s, name: userInfo?.user.username || s.name };
      }
      return s;
    });
  }, [h2hStandingsData, userInfo?.user.username]);

  const knockoutRounds = useMemo(() => {
    const rounds = knockoutBracketData?.rounds ?? [];
    return rounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => {
        let p1 = m.player1;
        let p2 = m.player2;
        if (p1 === "You" || p1 === userInfo?.user.username) {
          p1 = userInfo?.user.username || p1;
        }
        if (p2 === "You" || p2 === userInfo?.user.username) {
          p2 = userInfo?.user.username || p2;
        }
        return { ...m, player1: p1, player2: p2 };
      }),
    }));
  }, [knockoutBracketData?.rounds, userInfo?.user.username]);

  // ── Error state ─────────────────────────────────────────────────────────
  // Tracks which error string the user has already dismissed so the
  // useEffect doesn't immediately re-set the same message.
  const [error, setError] = useState<string>("");
  const dismissedErrorRef = useRef<string | null>(null);

  useEffect(() => {
    let nextError = "";
    if (isKnockout) {
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

    // If the derived error is identical to what the user just dismissed,
    // keep the banner hidden. If it's a NEW error, reset the ref and show it.
    if (nextError && nextError === dismissedErrorRef.current) {
      return;
    }
    if (nextError !== error) {
      dismissedErrorRef.current = null;
      setError(nextError);
    }
  }, [
    isKnockout,
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

  const isMe = useCallback(
    (id: number, username: string) =>
      id === userInfo?.user.id ||
      username === userInfo?.user.username ||
      username === "You",
    [userInfo?.user.id, userInfo?.user.username]
  );
  // Knockout bracket matches only carry player name strings (no IDs),
  // so we need a name-only variant for that component.
  const isMeByName = useCallback(
    (username: string) =>
      username === userInfo?.user.username || username === "You",
    [userInfo?.user.username]
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
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
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

  // No full-screen loading gate — page shell renders instantly.

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
          <LeaderboardHero
            timeframe={timeframe}
            name={heroTitle}
            subtitle={leaderboardSubtitle}
          />
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
            <LeaderboardHero
              timeframe={timeframe}
              name={heroTitle}
              subtitle={leaderboardSubtitle}
            />
            <LeaderboardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          {/* Rankings sub-tab. Conditionally rendered (re-mounts on tab
              switch) — RankingRow has no entering animations, so a fresh
              mount is silent and react-query keeps the data cached. */}
          {activeTab === "rankings" && (
            rankingsLoading ? (
              <ScreenLoadingSpinner />
            ) : (
              <RankingsList
                rankings={rankings}
                isMe={isMe}
                showWeeklyExamColumn={showWeeklyExamColumn}
              />
            )
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
                isMe={isMeByName}
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
