import { useEffect, useRef } from "react";
import { queryClient } from "./QueryClient";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "./GamesApiCalls";
import ApiUrl from "./config";
import WsUrl from "./configWs";
export const useWebSocket = (
  gameCode,
  userInfo,
  setPlayers,
  goToGame,
  gameId,
  userToken,
  setAllScores,
  setCurrentQuestion,
  currentQuestion,
  gameQuestions,
  handleSubmit
) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (gameCode) {
      ws.current = new WebSocket(`${WsUrl}/games/${gameCode}/ws/`);

      ws.current.onopen = () => console.log("WebSocket connection opened");

      ws.current.onerror = (error) => console.error("WebSocket connection error:", error);

      ws.current.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket data:", data);

            if (data && data.data && data.data.players) {
              const newPlayers = data.data.players.map((player) => ({
                id: player.id,
                profileName: `${player.first_name} ${player.last_name}`,
                profile_picture:
                  player.id === userInfo?.user.id
                    ? userInfo.user.profile_picture
                    : `${ApiUrl}${player.profile_picture}`,
              }));
              setPlayers(newPlayers);
            }
            if (data.type === "game.start") {
              console.log("User has received start game ", userInfo?.user.first_name);
              goToGame();
            }
            if (data.type === "question.attempted" && gameQuestions[currentQuestion]) {
              if (data.question_id === gameQuestions[currentQuestion].id) {
                if (currentQuestion < gameQuestions.length - 1) {
                  setCurrentQuestion((prevQuestion) => prevQuestion + 1);
                } else {
                  handleSubmit();
                }
              }
            }
            if (data.type === "all_scores_submitted") {
              const scoresObject = data.scores.reduce((acc, score) => {
                acc[score.user_id] = score.score;
                return acc;
              }, {});
              setAllScores(scoresObject);
            }
          } catch (error) {
            console.error("Error parsing JSON data:", error);
          }
        } else {
          console.error("Received WebSocket message with undefined data");
        }
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [
    gameCode,
    userInfo,
    setPlayers,
    goToGame,
    currentQuestion,
    gameQuestions,
    setCurrentQuestion,
    setAllScores,
    handleSubmit
  ]);

  const { data: gameDetails, error: gameDetailsError, refetch: refetchGameDetails } = useQuery({
    queryKey: ["gameDetails", gameId, userToken?.token],
    queryFn: () => getGameDetails(gameId, userToken?.token),
    enabled: !!userToken,
  });

  useEffect(() => {
    if (gameDetails) {
      if (gameDetails.players) {
        const newPlayers = gameDetails.players.map((player) => ({
          id: player.id,
          profileName: `${player.first_name} ${player.last_name}`,
          profile_picture:
            player.id === userInfo?.user.id
              ? userInfo.user.profile_picture
              : `${ApiUrl}${player.profile_picture}`,
        }));
        setPlayers(newPlayers);
      }
    }
  }, [gameDetails, userInfo, setPlayers]);

  const sendWebSocketMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { sendWebSocketMessage, refetchGameDetails };
};
