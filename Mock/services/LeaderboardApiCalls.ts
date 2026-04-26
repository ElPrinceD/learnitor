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
}

export interface RankingItem {
  id: number;
  rank: number;
  username: string;
  avatarUrl: string | null;
  score: number;
  badge?: string;
  movement?: "up" | "down" | "same";
}

export interface UserStatus {
  rank: number | null;
  percentile: string | null;
  message: string | null;
}

export interface LeaderboardDetailsResponse {
  rankings: RankingItem[];
  userStatus: UserStatus;
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

export const getKnockoutBracket = async (token: string | null | undefined): Promise<KnockoutBracketResponse> => {
  const response = await apiClient.get<KnockoutBracketResponse>('/api/knockout/bracket', {
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
