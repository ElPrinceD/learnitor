import axios from 'axios';
import ApiUrl from '../config';

const apiClient = axios.create({
  baseURL: ApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RankingSummary {
  world: string | null;
  country: string | null;
  school: string | null;
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
}

export interface UserStatus {
  rank: number | null;
  percentile: string | null;
  message: string | null;
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
}

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
  timeframe: string = "season"
): Promise<LeaderboardDetailsResponse> => {
  const response = await apiClient.get<LeaderboardDetailsResponse>(`/api/leaderboards/details/${id}`, {
    headers: { Authorization: `Token ${token}` },
    params: { timeframe },
  });
  return response.data;
};

export const getH2HCurrent = async (token: string | null | undefined): Promise<H2HMatchup | null> => {
  const response = await apiClient.get<H2HMatchup | null>('/api/h2h/current', {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const getKnockoutBracket = async (
  token: string | null | undefined,
  squadId?: string
): Promise<KnockoutBracketResponse> => {
  // Per-squad bracket endpoint (see BACKEND_KNOCKOUT_BRACKET.md).
  // Global leaderboard IDs (world/country/school) don't have a per-squad
  // bracket, so fall back to the legacy global endpoint for those.
  const isGlobal = !squadId || ['world', 'country', 'school'].includes(squadId.toLowerCase());
  const url = isGlobal
    ? '/api/knockout/bracket'
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
  const response = await apiClient.get<CustomH2HMatchItem[]>(`/api/h2h/custom/${squadId}/matches`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const getCustomH2HStandings = async (
  squadId: string,
  token: string | null | undefined
): Promise<CustomH2HStanding[]> => {
  const response = await apiClient.get<CustomH2HStanding[]>(`/api/h2h/custom/${squadId}/standings`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
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
