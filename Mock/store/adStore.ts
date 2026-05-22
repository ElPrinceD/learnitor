import { create } from 'zustand';
import { AdPlacement } from '../config/AdConfig';

// ── Types ──────────────────────────────────────────────────────────────
interface AdState {
  gameCompletionAdReady: boolean;
  answerViewingAdReady: boolean;

  // Callbacks set by the initializer component
  _showGameCompletionAdFn: (() => void) | null;
  _showAnswerViewingAdFn: ((onRewardEarned: () => void) => void) | null;

  // Actions
  showGameCompletionAd: () => void;
  showAnswerViewingAd: (onRewardEarned: () => void) => void;
  isAdReady: (placement: AdPlacement) => boolean;

  // Bridge setters (called by AdInitializer)
  _setGameCompletionReady: (ready: boolean) => void;
  _setAnswerViewingReady: (ready: boolean) => void;
  _registerGameCompletionAd: (showFn: () => void) => void;
  _registerAnswerViewingAd: (showFn: (onReward: () => void) => void) => void;
}

// ── Store ──────────────────────────────────────────────────────────────
export const useAdStore = create<AdState>()((set, get) => ({
  gameCompletionAdReady: false,
  answerViewingAdReady: false,
  _showGameCompletionAdFn: null,
  _showAnswerViewingAdFn: null,

  _setGameCompletionReady: (ready) =>
    set((s) =>
      s.gameCompletionAdReady === ready ? s : { gameCompletionAdReady: ready }
    ),
  _setAnswerViewingReady: (ready) =>
    set((s) =>
      s.answerViewingAdReady === ready ? s : { answerViewingAdReady: ready }
    ),
  _registerGameCompletionAd: (showFn) =>
    set((s) =>
      s._showGameCompletionAdFn === showFn
        ? s
        : { _showGameCompletionAdFn: showFn }
    ),
  _registerAnswerViewingAd: (showFn) =>
    set((s) =>
      s._showAnswerViewingAdFn === showFn ? s : { _showAnswerViewingAdFn: showFn }
    ),

  showGameCompletionAd: () => {
    const { _showGameCompletionAdFn, gameCompletionAdReady } = get();
    if (gameCompletionAdReady && _showGameCompletionAdFn) {
      _showGameCompletionAdFn();
    }
    // If ad is not ready, proceed without showing ad (matches original)
  },

  showAnswerViewingAd: (onRewardEarned) => {
    const { _showAnswerViewingAdFn, answerViewingAdReady } = get();
    if (answerViewingAdReady && _showAnswerViewingAdFn) {
      _showAnswerViewingAdFn(onRewardEarned);
    } else {
      // Graceful fallback — still earn reward (matches original behavior)
      onRewardEarned();
    }
  },

  isAdReady: (placement) => {
    const state = get();
    switch (placement) {
      case AdPlacement.GAME_COMPLETION:
        return state.gameCompletionAdReady;
      case AdPlacement.ANSWER_VIEWING:
        return state.answerViewingAdReady;
      default:
        return false;
    }
  },
}));

// ── Backward-compatible hook ───────────────────────────────────────────
export const useAdManager = () => {
  const store = useAdStore();
  return {
    showGameCompletionAd: store.showGameCompletionAd,
    showAnswerViewingAd: store.showAnswerViewingAd,
    isAdReady: store.isAdReady,
  };
};
