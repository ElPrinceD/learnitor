import axios from 'axios';
import ApiUrl from './config'; // Assuming you have a config file for API URL
import { GameDetailsResponse } from "./components/types";

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});



export const getGameDetails = async (
  gameId,
  token
): Promise<GameDetailsResponse> => {
    try {

        const response = await apiClient.get<GameDetailsResponse>(
            `/games/${gameId}/`,
            {
                headers: { Authorization: `Token ${token}` },
            }
        );
        return response.data;
           } catch (error) {
        console.error('Error fetching game details:', error);
        throw error;
    }
};


export const startGame = async (gameId, token): Promise<void> => {
  await apiClient.post(
    `/games/${gameId}/start_game/`,
    {},
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
};
