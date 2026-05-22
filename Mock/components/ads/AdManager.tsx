import React, { createContext, useContext, useCallback, useState } from "react";
import useInterstitialAd from "./InterstitialAd";
import useRewardedAd from "./RewardedAd";
import { AdPlacement } from "../../config/AdConfig";
import { useAlert } from "../../contexts/AlertContext";

interface AdManagerContextType {
  showGameCompletionAd: () => void;
  showAnswerViewingAd: (onRewardEarned: () => void) => void;
  isAdReady: (placement: AdPlacement) => boolean;
}

const AdManagerContext = createContext<AdManagerContextType | undefined>(
  undefined
);

export const useAdManager = () => {
  const context = useContext(AdManagerContext);
  if (!context) {
    throw new Error("useAdManager must be used within an AdManagerProvider");
  }
  return context;
};

interface AdManagerProviderProps {
  children: React.ReactNode;
}

export const AdManagerProvider: React.FC<AdManagerProviderProps> = ({
  children,
}) => {
  const { showErrorAlert } = useAlert();
  const [gameCompletionAdReady, setGameCompletionAdReady] = useState(false);
  const [answerViewingAdReady, setAnswerViewingAdReady] = useState(false);

  const gameCompletionAd = useInterstitialAd({
    onAdClosed: () => {
      setGameCompletionAdReady(false);
    },
    onAdOpened: () => {
      setGameCompletionAdReady(false);
    },
    onAdFailedToLoad: (error) => {
      setGameCompletionAdReady(false);
    },
    autoLoad: true,
  });

  const answerViewingAd = useRewardedAd({
    onRewardEarned: () => {
      setAnswerViewingAdReady(false);
    },
    onAdClosed: () => {
      setAnswerViewingAdReady(false);
    },
    onAdOpened: () => {
      setAnswerViewingAdReady(false);
    },
    onAdFailedToLoad: () => {
      setAnswerViewingAdReady(false);
    },
    onAdNotReady: () => {
      showErrorAlert(
        "Ad Not Ready",
        "The ad is still loading. Please try again in a moment.",
        () => setAnswerViewingAdReady(false)
      );
    },
    autoLoad: true,
  });

  const showGameCompletionAd = useCallback(() => {
    if (gameCompletionAd.isAdReady) {
      gameCompletionAd.showAd();
    } else {
      // If ad is not ready, proceed without showing ad
      console.log("Game completion ad not ready, proceeding without ad");
    }
  }, [gameCompletionAd]);

  const showAnswerViewingAd = useCallback(
    (onRewardEarned: () => void) => {
      if (answerViewingAd.isAdReady) {
        answerViewingAd.showAd();
        // Call the reward callback immediately after showing ad
        onRewardEarned();
      } else {
        // If ad is not ready, proceed without showing ad (graceful fallback)
        onRewardEarned();
      }
    },
    [answerViewingAd]
  );

  const isAdReady = useCallback(
    (placement: AdPlacement) => {
      switch (placement) {
        case AdPlacement.GAME_COMPLETION:
          return gameCompletionAd.isAdReady;
        case AdPlacement.ANSWER_VIEWING:
          return answerViewingAd.isAdReady;
        default:
          return false;
      }
    },
    [gameCompletionAd.isAdReady, answerViewingAd.isAdReady]
  );

  const value: AdManagerContextType = {
    showGameCompletionAd,
    showAnswerViewingAd,
    isAdReady,
  };

  return (
    <AdManagerContext.Provider value={value}>
      {children}
    </AdManagerContext.Provider>
  );
};
