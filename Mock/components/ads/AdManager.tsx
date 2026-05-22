/**
 * Ad Manager — Zustand-backed.
 *
 * State and public API live in `store/adStore.ts`.
 * This file provides:
 *   1. `useAdManager` — re-exported from the store (backward-compatible).
 *   2. `AdInitializer` — a React component that bridges the ad SDK hooks
 *      to the Zustand store. Must be mounted inside the React tree.
 *   3. `AdManagerProvider` — no-op wrapper kept temporarily.
 */
import React, { useEffect, useCallback, useRef } from "react";
import useInterstitialAd from "./InterstitialAd";
import useRewardedAd from "./RewardedAd";
import { useAdStore } from "../../store/adStore";
import { useAlertStore } from "../../store/alertStore";

// Re-export
export { useAdManager } from "../../store/adStore";

/**
 * Bridges the React ad hooks (which rely on useEffect/useState) to the
 * Zustand ad store. Mount once in the React tree.
 */
export const AdInitializer: React.FC = () => {
  const showErrorAlert = useAlertStore((s) => s.showErrorAlert);

  const markGameCompletionNotReady = useCallback(() => {
    useAdStore.getState()._setGameCompletionReady(false);
  }, []);

  const markAnswerViewingNotReady = useCallback(() => {
    useAdStore.getState()._setAnswerViewingReady(false);
  }, []);

  const onAnswerAdNotReady = useCallback(() => {
    showErrorAlert(
      "Ad Not Ready",
      "The ad is still loading. Please try again in a moment.",
      () => useAdStore.getState()._setAnswerViewingReady(false)
    );
  }, [showErrorAlert]);

  const gameCompletionAd = useInterstitialAd({
    onAdClosed: markGameCompletionNotReady,
    onAdOpened: markGameCompletionNotReady,
    onAdFailedToLoad: markGameCompletionNotReady,
    autoLoad: true,
  });

  const answerViewingAd = useRewardedAd({
    onRewardEarned: markAnswerViewingNotReady,
    onAdClosed: markAnswerViewingNotReady,
    onAdOpened: markAnswerViewingNotReady,
    onAdFailedToLoad: markAnswerViewingNotReady,
    onAdNotReady: onAnswerAdNotReady,
    autoLoad: true,
  });

  const gameCompletionAdRef = useRef(gameCompletionAd);
  gameCompletionAdRef.current = gameCompletionAd;

  const answerViewingAdRef = useRef(answerViewingAd);
  answerViewingAdRef.current = answerViewingAd;

  useEffect(() => {
    useAdStore
      .getState()
      ._setGameCompletionReady(gameCompletionAd.isAdReady);
  }, [gameCompletionAd.isAdReady]);

  useEffect(() => {
    useAdStore
      .getState()
      ._setAnswerViewingReady(answerViewingAd.isAdReady);
  }, [answerViewingAd.isAdReady]);

  useEffect(() => {
    useAdStore.getState()._registerGameCompletionAd(() => {
      gameCompletionAdRef.current.showAd();
    });
  }, []);

  useEffect(() => {
    useAdStore.getState()._registerAnswerViewingAd((onRewardEarned) => {
      const ad = answerViewingAdRef.current;
      if (ad.isAdReady) {
        ad.showAd();
        onRewardEarned();
      } else {
        onRewardEarned();
      }
    });
  }, []);

  return null;
};

/**
 * No-op provider kept temporarily so `_layout.tsx` compiles during
 * incremental migration.
 */
export const AdManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <AdInitializer />
    {children}
  </>
);
