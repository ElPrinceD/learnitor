import { create } from 'zustand';

interface GameState {
  score: number;
  streak: number;
  multiplier: number;
  isGameActive: boolean;
  gameId: string | null;
  setTimeLimit: (seconds: number) => void;
  timeLimit: number; // in seconds
  
  // Actions
  startGame: (gameId: string, timeLimit: number) => void;
  endGame: () => void;
  resetGame: () => void;
  answerQuestion: (isCorrect: boolean, timeTakenMs: number, basePoints?: number) => void;
}

const BASE_POINTS_PER_QUESTION = 100;
const STREAK_BONUS_RATE = 0.1; // 10% extra per streak
const MAX_STREAK_BONUS = 2.0; // max +200% bonus

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  streak: 0,
  multiplier: 1.0,
  isGameActive: false,
  gameId: null,
  timeLimit: 20,

  setTimeLimit: (seconds) => set({ timeLimit: seconds }),

  startGame: (gameId, timeLimit) => set({
    score: 0,
    streak: 0,
    multiplier: 1.0,
    isGameActive: true,
    gameId,
    timeLimit,
  }),

  endGame: () => set({
    isGameActive: false,
  }),

  resetGame: () => set({
    score: 0,
    streak: 0,
    multiplier: 1.0,
    isGameActive: false,
    gameId: null,
  }),

  answerQuestion: (isCorrect, timeTakenMs, basePoints = BASE_POINTS_PER_QUESTION) => set((state) => {
    if (!state.isGameActive || !isCorrect) {
      // Wrong answer resets streak and multiplier
      return {
        streak: 0,
        multiplier: 1.0,
      };
    }

    // --- Time Bonus Math ---
    // Instant answer (0ms) -> 100% time bonus
    // At limit (e.g. 20000ms) -> 0% time bonus
    const maxTimeMs = state.timeLimit * 1000;
    const timeRatio = Math.max(0, Math.min(1, 1 - (timeTakenMs / maxTimeMs))); 
    const timeBonus = basePoints * timeRatio;

    // --- Streak Bonus Math ---
    const newStreak = state.streak + 1;
    // Streak multiplier starts at 1.0. For each consecutive correct: +10%
    // E.g. streak 1 = 1.0 (no extra bonus for first answer)
    // streak 2 = 1.1, streak 3 = 1.2
    const bonusMultiplier = Math.min(1.0 + (newStreak - 1) * STREAK_BONUS_RATE, MAX_STREAK_BONUS);

    const totalPointsForQuestion = (basePoints + timeBonus) * bonusMultiplier;

    return {
      streak: newStreak,
      multiplier: bonusMultiplier,
      score: state.score + totalPointsForQuestion,
    };
  }),
}));
