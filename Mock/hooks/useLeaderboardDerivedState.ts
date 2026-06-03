import { useMemo, useCallback } from "react";
import { getCountryName } from "../utils/countryMapping";
import { ensureAverageInStandings } from "../utils/h2hStandings";
import { SquadInfo } from "../services/LeaderboardApiCalls";

export function useLeaderboardDerivedState({
  id,
  name,
  leaderboardData,
  allRankings,
  paginationOffset,
  userInfo,
  h2hMatchesData,
  h2hStandingsData,
  knockoutBracketData,
}: {
  id: string | string[] | undefined;
  name: string | undefined;
  leaderboardData: any;
  allRankings: any[];
  paginationOffset: number;
  userInfo: any;
  h2hMatchesData: any;
  h2hStandingsData: any;
  knockoutBracketData: any;
}) {
  const resolvedLeaderboardId = Array.isArray(id) ? id[0] : id;
  const isGlobalLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    ["world", "country", "school"].includes(
      resolvedLeaderboardId.toLowerCase()
    );
  const isSchoolLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    resolvedLeaderboardId.toLowerCase() === "school";
  const isCountryLeaderboard =
    typeof resolvedLeaderboardId === "string" &&
    resolvedLeaderboardId.toLowerCase() === "country";

  const heroTitle = isSchoolLeaderboard ? "School Ranking" : name;

  const rankings = useMemo(() => {
    const baseRankings =
      paginationOffset === 0 && leaderboardData?.rankings
        ? leaderboardData.rankings
        : allRankings;

    return baseRankings.map((item: any) => {
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
  }, [
    allRankings,
    leaderboardData,
    paginationOffset,
    userInfo?.user.id,
    userInfo?.user.username,
  ]);

  const squadInfo = useMemo<SquadInfo | undefined>(() => {
    const base = leaderboardData?.squadInfo;
    const topLevel = {
      knockoutStartWeek: leaderboardData?.knockoutStartWeek,
      knockoutStarted: leaderboardData?.knockoutStarted,
      totalKnockoutRounds: leaderboardData?.totalKnockoutRounds,
    };
    if (base) {
      return {
        ...base,
        knockoutStartWeek: base.knockoutStartWeek ?? topLevel.knockoutStartWeek,
        knockoutStarted: base.knockoutStarted ?? topLevel.knockoutStarted,
        totalKnockoutRounds:
          base.totalKnockoutRounds ?? topLevel.totalKnockoutRounds,
      };
    }
    if (topLevel.knockoutStartWeek != null) {
      return topLevel as SquadInfo;
    }
    return undefined;
  }, [
    leaderboardData?.squadInfo,
    leaderboardData?.knockoutStartWeek,
    leaderboardData?.knockoutStarted,
    leaderboardData?.totalKnockoutRounds,
  ]);

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

  const showWeeklyExamColumn = useMemo(
    () =>
      isGlobalLeaderboard ||
      rankings.some((r: any) => r.weeklyExamScore !== undefined),
    [isGlobalLeaderboard, rankings]
  );

  const matches = useMemo(() => {
    const list = h2hMatchesData ?? [];
    return list.map((m: any) => {
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
    const list = ensureAverageInStandings(h2hStandingsData ?? [], matches);
    return list.map((s: any) => {
      if (s.isAverage) {
        return s;
      }
      if (s.name === "You" || s.name === userInfo?.user.username) {
        return {
          ...s,
          name: userInfo?.user.username || s.name,
          isUser: true,
        };
      }
      return s;
    });
  }, [h2hStandingsData, matches, userInfo?.user.username]);

  const knockoutRounds = useMemo(() => {
    const rounds = knockoutBracketData?.rounds ?? [];
    return rounds.map((r: any) => ({
      ...r,
      matches: r.matches.map((m: any) => {
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

  const isMe = useCallback(
    (userId: number, username: string) =>
      userId === userInfo?.user.id ||
      username === userInfo?.user.username ||
      username === "You",
    [userInfo?.user.id, userInfo?.user.username]
  );

  const isMeByName = useCallback(
    (username: string) =>
      username === userInfo?.user.username || username === "You",
    [userInfo?.user.username]
  );

  return {
    resolvedLeaderboardId,
    isGlobalLeaderboard,
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
  };
}
