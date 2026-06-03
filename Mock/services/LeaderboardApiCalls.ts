import axios from 'axios';
import ApiUrl from '../config';
import {
  normalizeCustomH2HMatch,
  parseCustomH2HStandingsResponse,
} from '../utils/h2hStandings';

const apiClient = axios.create({
  baseURL: ApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RankingSummary {
  world: string | { rank: string | null; movement?: "up" | "down" | "same" } | null;
  country: string | { rank: string | null; movement?: "up" | "down" | "same" } | null;
  school: string | { rank: string | null; movement?: "up" | "down" | "same" } | null;
}

export interface CustomLeaderboard {
  id: string;
  name: string;
  memberCount?: number;
  icon?: string;
  scoringMode?: "all_points" | "exam_only" | "custom_1v1";
  invite_code?: string;
  isCodePublic?: boolean;
  isCreator?: boolean;
  // The requesting user's rank within this squad.
  //   number -> the user's current rank in the squad's ladder
  //              (score ladder for `all_points`/`exam_only`, pts ladder for
  //              `custom_1v1`)
  //   null   -> unranked (e.g. brand-new squad, season hasn't started, or
  //              the first H2H week hasn't resolved yet)
  // See Mock/BACKEND_RANKING_UPDATES.md Section "User rank on squad list".
  userRank?: number | null;
  timeframe?: string;
}

export interface RankingItem {
  id: number;
  rank: number;
  username: string;
  avatarUrl: string | null;
  score: number;
  badge?: string;
  movement?: "up" | "down" | "same";
  // Per Mock/BACKEND_RANKING_UPDATES.md Section 3:
  //   null   -> current week's exam has not yet started
  //   0      -> exam is open/closed but the user did not participate
  //   number -> the score this user achieved on the current week's exam
  // Custom squads: always when the ladder is exam-weighted. Global lists
  // (world / country / school): optional until the API adds it; the app
  // still shows the SW column for those boards for layout parity.
  weeklyExamScore?: number | null;
  // Per integration guide: same semantics as weeklyExamScore but
  // tracks the broader study-week activity score. null = current week,
  // no activity yet; 0 = week ended, no points.
  studyWeekScore?: number | null;
  institutionId?: number;
  schoolName?: string;
}

export interface SchoolInstitution {
  id: number;
  name: string;
  city?: string;
  country?: string;
}

export interface UserStatus {
  rank: number | null;
  percentile: string | null;
  message: string | null;
  institutionId?: number;
  schoolName?: string;
}

export interface SquadMember {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface SquadInfo {
  knockoutStartWeek?: number;
  knockoutStarted?: boolean;
  totalKnockoutRounds?: number;
  invite_code?: string;
  isCodePublic?: boolean;
  isCreator?: boolean;
  members?: SquadMember[];
}

export interface LeaderboardDetailsResponse {
  rankings: RankingItem[];
  userStatus: UserStatus;
  squadInfo?: SquadInfo;
  schoolName?: string;
  schoolInstitution?: SchoolInstitution;
  countryName?: string;
  country?: string;
  // For segment leaderboards (world/country/school) the backend returns
  // knockout timing at the response root instead of inside squadInfo.
  knockoutStartWeek?: number;
  knockoutStarted?: boolean;
  totalKnockoutRounds?: number;
  // Server-side pagination fields.
  hasMore?: boolean;
  totalCount?: number;
  // The study week currently in progress (1-indexed).
  currentStudyWeek?: number;
}

export interface H2HMatchup {
  id: string;
  opponentName: string;
  opponentAvatar: string | null;
  userScore: number | null;
  opponentScore: number | null;
  status: "pending" | "won" | "lost" | "draw";
  round: number;
  totalRounds: number;
}

export interface KnockoutMatch {
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner?: "player1" | "player2";
}

export interface KnockoutRound {
  round: number;
  matches: KnockoutMatch[];
}

export interface KnockoutBracketResponse {
  rounds: KnockoutRound[];
  totalRounds: number;
  currentRound: number;
}

export interface CustomH2HMatchItem {
  id: string;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  result: "w" | "d" | "l" | "pending";
  round?: number;
}

export interface CustomH2HStanding {
  rank: number;
  name: string;
  pts: number;
  w: number;
  d: number;
  l: number;
  totalScore: number;
  weekScore: number;
  tiebreaker?: "standoff";
  isUser?: boolean;
  isAverage?: boolean;
}

type RawRecord = Record<string, unknown>;

const normalizeList = <T>(
  payload: unknown,
  normalizeItem: (raw: RawRecord) => T
): T[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeItem(item as RawRecord));
  }
  if (payload && typeof payload === "object") {
    const record = payload as RawRecord;
    const nested =
      record.results ??
      record.data ??
      record.matches ??
      record.items;
    if (Array.isArray(nested)) {
      return nested.map((item) => normalizeItem(item as RawRecord));
    }
  }
  return [];
};

/** Ensures H2H fetches always hit the server so fixture rebuild can run. */
export const H2H_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: "always" as const,
};

// --- Existing API calls ---

export const getRankingsSummary = async (token: string | null | undefined): Promise<RankingSummary> => {
  const response = await apiClient.get<RankingSummary>('/api/leaderboards/rankings/summary', {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const getCustomLeaderboards = async (
  token: string | null | undefined,
  timeframe: string = "season"
): Promise<CustomLeaderboard[]> => {
  const response = await apiClient.get<CustomLeaderboard[]>('/api/leaderboards/custom', {
    headers: { Authorization: `Token ${token}` },
    params: { timeframe },
  });
  return response.data;
};

export const createCustomLeaderboard = async (
  token: string | null | undefined,
  name: string,
  scoringMode: string
): Promise<any> => {
  const response = await apiClient.post(
    '/api/leaderboards/custom/create',
    { name, scoringMode },
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const joinCustomLeaderboard = async (
  token: string | null | undefined,
  inviteCode: string
): Promise<any> => {
  const response = await apiClient.post(
    '/api/leaderboards/custom/join',
    { inviteCode },
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const getLeaderboardDetails = async (
  id: string,
  token: string | null | undefined,
  timeframe: string = "season",
  limit: number = 15,
  offset: number = 0
): Promise<LeaderboardDetailsResponse> => {
  const response = await apiClient.get<LeaderboardDetailsResponse>(`/api/leaderboards/details/${id}`, {
    headers: { Authorization: `Token ${token}` },
    params: { timeframe, limit, offset },
  });
  return response.data;
};

export const getH2HCurrent = async (
  token: string | null | undefined,
  squadId?: string
): Promise<H2HMatchup | null> => {
  const response = await apiClient.get<H2HMatchup | null>("/api/h2h/current", {
    headers: { Authorization: `Token ${token}` },
    params: squadId ? { squadId } : undefined,
  });
  return response.data;
};

export const getKnockoutBracket = async (
  token: string | null | undefined,
  squadId?: string
): Promise<KnockoutBracketResponse> => {
  // Segment brackets (world/country/school) use the leaderboard details path.
  // Custom squad brackets use the per-squad custom path.
  const SEGMENT_IDS = ['world', 'country', 'school'];
  const isSegment = !!squadId && SEGMENT_IDS.includes(squadId.toLowerCase());
  const url = isSegment
    ? `/api/leaderboards/details/${squadId.toLowerCase()}/knockout-bracket`
    : `/api/leaderboards/custom/${squadId}/knockout-bracket`;
  const response = await apiClient.get<KnockoutBracketResponse>(url, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const getCustomH2HMatches = async (
  squadId: string,
  token: string | null | undefined
): Promise<CustomH2HMatchItem[]> => {
  const response = await apiClient.get<unknown>(
    `/api/h2h/custom/${squadId}/matches`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return normalizeList(response.data, normalizeCustomH2HMatch);
};

export const getCustomH2HStandings = async (
  squadId: string,
  token: string | null | undefined
): Promise<CustomH2HStanding[]> => {
  const response = await apiClient.get<unknown>(
    `/api/h2h/custom/${squadId}/standings`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return parseCustomH2HStandingsResponse(response.data);
};

// --- Squad Management API calls (NEW) ---

export const updateSquadDetails = async (
  id: string,
  token: string | null | undefined,
  data: { name?: string; isCodePublic?: boolean }
): Promise<{ id: string; name: string; isCodePublic: boolean }> => {
  const response = await apiClient.put(
    `/api/leaderboards/custom/${id}`,
    data,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const regenerateInviteCode = async (
  id: string,
  token: string | null | undefined
): Promise<{ invite_code: string }> => {
  const response = await apiClient.post(
    `/api/leaderboards/custom/${id}/regenerate-code`,
    {},
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const removeSquadMember = async (
  id: string,
  userId: number,
  token: string | null | undefined
): Promise<void> => {
  await apiClient.delete(
    `/api/leaderboards/custom/${id}/members/${userId}`,
    { headers: { Authorization: `Token ${token}` } }
  );
};

export const deleteSquad = async (
  id: string,
  token: string | null | undefined
): Promise<void> => {
  await apiClient.delete(
    `/api/leaderboards/custom/${id}`,
    { headers: { Authorization: `Token ${token}` } }
  );
};
