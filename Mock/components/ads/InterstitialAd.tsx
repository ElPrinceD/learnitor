import React, { useEffect, useState, useRef } from "react";
import { Alert } from "react-native";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { AD_CONFIG, AdLoadingState } from "../../config/AdConfig";

interface InterstitialAdComponentProps {
  onAdClosed?: () => void;
  onAdOpened?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  autoLoad?: boolean;
}

const useInterstitialAd = ({
  onAdClosed,
  onAdOpened,
  onAdFailedToLoad,
  autoLoad = true,
}: InterstitialAdComponentProps) => {
  const [adState, setAdState] = useState<AdLoadingState>(
    AdLoadingState.LOADING
  );
  const [isAdReady, setIsAdReady] = useState(false);
  const interstitialAdRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    if (autoLoad) {
      loadAd();
    }

    return () => {
      if (interstitialAdRef.current) {
        interstitialAdRef.current.removeAllListeners();
      }
    };
  }, [autoLoad]);

  const loadAd = () => {
    try {
      const interstitialAd = InterstitialAd.createForAdRequest(
        AD_CONFIG.INTERSTITIAL_AD_UNIT_ID,
        {
          requestNonPersonalizedAdsOnly: false,
        }
      );

      interstitialAdRef.current = interstitialAd;

      // Set up event listeners
      const unsubscribeLoaded = interstitialAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          setAdState(AdLoadingState.LOADED);
          setIsAdReady(true);
        }
      );

      const unsubscribeError = interstitialAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          setAdState(AdLoadingState.ERROR);
          setIsAdReady(false);
          onAdFailedToLoad?.(error.message || "Interstitial ad failed to load");
        }
      );

      const unsubscribeOpened = interstitialAd.addAdEventListener(
        AdEventType.OPENED,
        () => {
          onAdOpened?.();
        }
      );

      const unsubscribeClosed = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          setAdState(AdLoadingState.LOADING);
          setIsAdReady(false);
          onAdClosed?.();
          // Load next ad for future use
          loadAd();
        }
      );

      // Load the ad
      interstitialAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeOpened();
        unsubscribeClosed();
      };
    } catch (error) {
      setAdState(AdLoadingState.ERROR);
      onAdFailedToLoad?.("Failed to create interstitial ad");
    }
  };

  const showAd = () => {
    if (isAdReady && interstitialAdRef.current) {
      try {
        interstitialAdRef.current.show();
        setAdState(AdLoadingState.SHOWN);
      } catch (error) {
        onAdFailedToLoad?.("Failed to show interstitial ad");
      }
    } else {
      // If ad is not ready, proceed without showing ad
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

export default useInterstitialAd;
