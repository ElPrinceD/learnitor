import React, { useEffect, useState, useRef } from "react";
import {
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { AD_CONFIG, AdLoadingState } from "../../config/AdConfig";

interface RewardedAdComponentProps {
  onRewardEarned?: (reward: { type: string; amount: number }) => void;
  onAdClosed?: () => void;
  onAdOpened?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  onAdNotReady?: () => void;
  autoLoad?: boolean;
}

const useRewardedAd = ({
  onRewardEarned,
  onAdClosed,
  onAdOpened,
  onAdFailedToLoad,
  onAdNotReady,
  autoLoad = true,
}: RewardedAdComponentProps) => {
  const [adState, setAdState] = useState<AdLoadingState>(
    AdLoadingState.LOADING
  );
  const [isAdReady, setIsAdReady] = useState(false);
  const rewardedAdRef = useRef<RewardedAd | null>(null);

  useEffect(() => {
    if (autoLoad) {
      // Add a small delay to ensure SDK is initialized
      const timer = setTimeout(() => {
        loadAd();
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (rewardedAdRef.current) {
          rewardedAdRef.current.removeAllListeners();
        }
      };
    }

    return () => {
      if (rewardedAdRef.current) {
        rewardedAdRef.current.removeAllListeners();
      }
    };
  }, [autoLoad]);

  const loadAd = () => {
    try {
      // Check if Google Mobile Ads is available
      if (!RewardedAd || typeof RewardedAd.createForAdRequest !== "function") {
        setAdState(AdLoadingState.ERROR);
        return;
      }

      const rewardedAd = RewardedAd.createForAdRequest(
        AD_CONFIG.REWARDED_AD_UNIT_ID,
        {
          requestNonPersonalizedAdsOnly: false,
        }
      );

      rewardedAdRef.current = rewardedAd;

      // Set up event listeners
      const unsubscribeLoaded = rewardedAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          setAdState(AdLoadingState.LOADED);
          setIsAdReady(true);
        }
      );

      const unsubscribeError = rewardedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          setAdState(AdLoadingState.ERROR);
          setIsAdReady(false);
          onAdFailedToLoad?.(error.message || "Rewarded ad failed to load");
        }
      );

      const unsubscribeOpened = rewardedAd.addAdEventListener(
        AdEventType.OPENED,
        () => {
          onAdOpened?.();
        }
      );

      const unsubscribeClosed = rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          setAdState(AdLoadingState.LOADING);
          setIsAdReady(false);
          onAdClosed?.();
          // Load next ad for future use
          loadAd();
        }
      );

      const unsubscribeRewarded = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          onRewardEarned?.(reward);
        }
      );

      // Load the ad
      rewardedAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeOpened();
        unsubscribeClosed();
        unsubscribeRewarded();
      };
    } catch (error) {
      setAdState(AdLoadingState.ERROR);
      onAdFailedToLoad?.("Failed to create rewarded ad: " + error);
    }
  };

  const showAd = () => {
    if (isAdReady && rewardedAdRef.current) {
      try {
        rewardedAdRef.current.show();
        setAdState(AdLoadingState.SHOWN);
      } catch (error) {
        onAdFailedToLoad?.("Failed to show rewarded ad");
      }
    } else if (onAdNotReady) {
      onAdNotReady();
    } else {
      onAdClosed?.();
    }
  };

  return {
    showAd,
    isAdReady,
    adState,
    loadAd,
  };
};

export default useRewardedAd;
