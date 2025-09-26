import React, { useEffect, useState, useRef } from "react";
import { Alert } from "react-native";
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
  autoLoad?: boolean;
}

const useRewardedAd = ({
  onRewardEarned,
  onAdClosed,
  onAdOpened,
  onAdFailedToLoad,
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
      console.log(
        "Creating rewarded ad with unit ID:",
        AD_CONFIG.REWARDED_AD_UNIT_ID
      );

      // Check if Google Mobile Ads is available
      if (!RewardedAd || typeof RewardedAd.createForAdRequest !== "function") {
        console.warn(
          "Google Mobile Ads SDK not available, skipping ad creation"
        );
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
      console.error("Error creating rewarded ad:", error);
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
    } else {
      // If ad is not ready, show alert and proceed
      Alert.alert(
        "Ad Not Ready",
        "The ad is still loading. Please try again in a moment.",
        [{ text: "OK", onPress: () => onAdClosed?.() }]
      );
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
