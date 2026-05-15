import axios from 'axios';
import ApiUrl from '../config'; // Assuming you have a config file for API URL
import { GameDetailsResponse } from "../components/types";

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});



export const getGameDetails = async (
  gameId: string | number,
  token: string | null | undefined
): Promise<GameDetailsResponse> => {
    try {

        const response = await apiClient.get<GameDetailsResponse>(
            `/games/${gameId}/`,
            {
                headers: { Authorization: `Token ${token}` },
            }
        );

        return response.data;
    } catch (error: any) {
        throw error;
    }
};


export const startGame = async (gameId: string | number, token: string | null | undefined): Promise<void> => {
  await apiClient.post(
    `/games/${gameId}/start_game/`,
    {},
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
};

// --- Universal end-of-game result submission ---
// Spec: Mock/BACKEND_RANKING_UPDATES.md Section 1.
// Idempotent on (gameId, userId, gameMode). Used by single-player, weekly
// exam, and as the REST recovery path for multiplayer.

export type GameMode = "single_player" | "multiplayer" | "weekly_exam";

export interface GameResultSubmitData {
  gameId: string;
  gameMode: GameMode;
  finalScore: number;
  highestStreak?: number;
}

export interface GameResultSubmitResponse {
  success: boolean;
  gameScore: number;
  newTotalScore: number;
}

export const submitGameResult = async (
  token: string | null | undefined,
  data: GameResultSubmitData
): Promise<GameResultSubmitResponse> => {
  const response = await apiClient.post<GameResultSubmitResponse>(
    '/api/games/results/submit',
    data,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};
