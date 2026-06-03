import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLeaderboardDetails,
  getKnockoutBracket,
  getCustomH2HMatches,
  getCustomH2HStandings,
  H2H_QUERY_OPTIONS,
  RankingItem,
} from "../services/LeaderboardApiCalls";

const PAGE_SIZE = 15;

export function useLeaderboardQueries({
  id,
  timeframe,
  userToken,
  canFetchLeaderboard,
  isH2H,
}: {
  id: string | string[] | undefined;
  timeframe: string | undefined;
  userToken: string | null | undefined;
  canFetchLeaderboard: boolean;
  isH2H: boolean;
}) {
  // ── Pagination state ────────────────────────────────────────────────────
  const [paginationOffset, setPaginationOffset] = useState(0);
  const [allRankings, setAllRankings] = useState<RankingItem[]>([]);
  const [serverHasMore, setServerHasMore] = useState(false);

  // ── Queries ─────────────────────────────────────────────────────────────
  const resolvedId = (Array.isArray(id) ? id[0] : id) || "";

  const {
    data: leaderboardData,
    isLoading: rankingsLoading,
    error: rankingsError,
    refetch: refetchLeaderboard,
    isFetching: isLeaderboardFetching,
  } = useQuery({
    queryKey: ["leaderboardDetails", resolvedId, timeframe, paginationOffset],
    queryFn: () =>
      getLeaderboardDetails(
        resolvedId,
        userToken,
        timeframe,
        PAGE_SIZE,
        paginationOffset
      ),
    enabled: canFetchLeaderboard,
  });

  // Accumulate rankings across pages.
  useEffect(() => {
    if (!leaderboardData) return;
    const incoming = leaderboardData.rankings ?? [];
    if (paginationOffset === 0) {
      setAllRankings(incoming);
    } else {
      setAllRankings((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newItems = incoming.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    }
    setServerHasMore(leaderboardData.hasMore ?? false);
  }, [leaderboardData, paginationOffset]);

  const {
    data: knockoutBracketData,
    error: knockoutBracketError,
    refetch: refetchKnockoutBracket,
    isFetching: isKnockoutBracketFetching,
  } = useQuery({
    queryKey: ["knockoutBracket", resolvedId],
    queryFn: () => getKnockoutBracket(userToken, resolvedId),
    enabled: canFetchLeaderboard && !isH2H,
  });

  const {
    data: h2hMatchesData,
    error: h2hMatchesError,
    refetch: refetchH2HMatches,
    isFetching: isH2HMatchesFetching,
  } = useQuery({
    queryKey: ["customH2HMatches", resolvedId],
    queryFn: () => getCustomH2HMatches(resolvedId as string, userToken),
    enabled: canFetchLeaderboard && isH2H,
    ...H2H_QUERY_OPTIONS,
  });

  const {
    data: h2hStandingsData,
    error: h2hStandingsError,
    refetch: refetchH2HStandings,
    isFetching: isH2HStandingsFetching,
  } = useQuery({
    queryKey: ["customH2HStandings", resolvedId],
    queryFn: () => getCustomH2HStandings(resolvedId as string, userToken),
    enabled: canFetchLeaderboard && isH2H,
    ...H2H_QUERY_OPTIONS,
  });

  // ── Refresh logic ────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!canFetchLeaderboard) {
      return;
    }
    setPaginationOffset(0);
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [refetchLeaderboard()];
      if (isH2H) {
        tasks.push(refetchH2HMatches(), refetchH2HStandings());
      } else {
        tasks.push(refetchKnockoutBracket());
      }
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [
    canFetchLeaderboard,
    isH2H,
    refetchLeaderboard,
    refetchH2HMatches,
    refetchH2HStandings,
    refetchKnockoutBracket,
  ]);

  const handleLoadMore = useCallback(() => {
    if (serverHasMore && !isLeaderboardFetching) {
      setPaginationOffset((prev) => prev + PAGE_SIZE);
    }
  }, [serverHasMore, isLeaderboardFetching]);

  const isRefreshing =
    refreshing ||
    isLeaderboardFetching ||
    (isH2H
      ? isH2HMatchesFetching || isH2HStandingsFetching
      : isKnockoutBracketFetching);

  return {
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
    refetchKnockoutBracket,
    isKnockoutBracketFetching,

    h2hMatchesData,
    h2hMatchesError,
    refetchH2HMatches,
    isH2HMatchesFetching,

    h2hStandingsData,
    h2hStandingsError,
    refetchH2HStandings,
    isH2HStandingsFetching,

    onRefresh,
    isRefreshing,
  };
}
