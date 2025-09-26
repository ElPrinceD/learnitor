import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
  NativeAdEventType,
} from "react-native-google-mobile-ads";
import { AD_CONFIG, AdLoadingState } from "../../config/AdConfig";
import Colors from "../../constants/Colors";
import { SIZES, rMS, rV } from "../../constants";

interface NativeAdComponentProps {
  placement: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  style?: any;
}

const NativeAdComponent: React.FC<NativeAdComponentProps> = ({
  placement,
  onAdLoaded,
  onAdFailedToLoad,
  style,
}) => {
  const [adState, setAdState] = useState<AdLoadingState>(
    AdLoadingState.LOADING
  );
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    loadNativeAd();
  }, []);

  const loadNativeAd = async () => {
    try {
      console.log(
        "Loading native ad with unit ID:",
        AD_CONFIG.NATIVE_AD_UNIT_ID
      );

      const ad = await NativeAd.createForAdRequest(
        AD_CONFIG.NATIVE_AD_UNIT_ID,
        {
          requestNonPersonalizedAdsOnly: false,
        }
      );

      setNativeAd(ad);
      setAdState(AdLoadingState.LOADED);
      onAdLoaded?.();
    } catch (error) {
      console.error("Failed to load native ad:", error);
      setAdState(AdLoadingState.ERROR);
      onAdFailedToLoad?.(error.message || "Native ad failed to load");
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.background,
      borderRadius: 10,
      marginVertical: 0,
      overflow: "hidden",
      elevation: 0,
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      height: "100%",
      width: "100%",
      position: "relative",
      flex: 1,
      ...style,
    },
    adLabel: {
      position: "absolute",
      top: rMS(12),
      left: rMS(12),
      backgroundColor: "rgba(0,0,0,0.85)",
      paddingHorizontal: rMS(8),
      paddingVertical: rMS(4),
      borderRadius: rMS(6),
      zIndex: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    adLabelText: {
      color: "white",
      fontSize: rMS(12),
      fontWeight: "bold",
      letterSpacing: 1,
    },
    adContent: {
      flex: 1,
      padding: 0,
      margin: 0,
    },
    mediaContainer: {
      flex: 1,
      position: "relative",
      backgroundColor: themeColors.background,
      overflow: "hidden",
      margin: 0,
      padding: 0,
      borderRadius: 10,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
      padding: rMS(15),
    },
    textOverlay: {
      marginBottom: rMS(12),
    },
    ctaContainer: {
      pointerEvents: "auto",
      alignSelf: "flex-start",
    },
    headline: {
      fontSize: rMS(18),
      fontWeight: "bold",
      color: "white",
      marginBottom: rMS(4),
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    tagline: {
      fontSize: rMS(14),
      color: "rgba(255,255,255,0.9)",
      fontWeight: "400",
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    ctaButton: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "white",
      paddingHorizontal: rMS(20),
      paddingVertical: rMS(8),
      borderRadius: rMS(20),
      alignSelf: "flex-start",
      alignItems: "center",
      shadowColor: "rgba(0,0,0,0.3)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
      minHeight: rMS(36),
      justifyContent: "center",
      minWidth: rMS(100),
    },
    ctaText: {
      color: "white",
      fontSize: SIZES.medium,
      fontWeight: "600",
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

  // Don't render if ad is loading
  if (adState === AdLoadingState.LOADING) {
    return <View style={{ height: 0, width: 0 }} />;
  }

  // Don't render if ad failed to load
  if (adState === AdLoadingState.ERROR) {
    return <View style={{ height: 0, width: 0 }} />;
  }

  // Don't render if no native ad
  if (!nativeAd) {
    return <View style={{ height: 0, width: 0 }} />;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>AD</Text>
      </View>
      <NativeAdView nativeAd={nativeAd} style={styles.adContent}>
        <View style={styles.mediaContainer}>
          <NativeMediaView
            style={{
              width: "100%",
              height: "100%",
              borderRadius: rMS(10),
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.textOverlay}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.headline} />
              </NativeAsset>
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.tagline} />
              </NativeAsset>
            </View>
            <View style={styles.ctaContainer}>
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Learn More</Text>
                </View>
              </NativeAsset>
            </View>
          </View>
        </View>
      </NativeAdView>
    </View>
  );
};

export default NativeAdComponent;
