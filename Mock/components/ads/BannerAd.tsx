import React, { useEffect, useState } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { AD_CONFIG, AdLoadingState } from "../../config/AdConfig";
import Colors from "../../constants/Colors";

interface BannerAdComponentProps {
  placement: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  style?: any;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  placement,
  onAdLoaded,
  onAdFailedToLoad,
  style,
}) => {
  const [adState, setAdState] = useState<AdLoadingState>(
    AdLoadingState.LOADING
  );
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleAdLoaded = () => {
    setAdState(AdLoadingState.LOADED);
    onAdLoaded?.();
  };

  const handleAdFailedToLoad = (error: any) => {
    setAdState(AdLoadingState.ERROR);
    onAdFailedToLoad?.(error.message || "Ad failed to load");
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      marginVertical: 8,
      overflow: "hidden",
      ...style,
    },
    loadingContainer: {
      height: 50,
      backgroundColor: themeColors.card,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    errorContainer: {
      height: 50,
      backgroundColor: themeColors.card,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
  });

  // Don't render if ad failed to load
  if (adState === AdLoadingState.ERROR) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_CONFIG.BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
};

export default BannerAdComponent;
