# Google Mobile Ads Setup Guide

## Overview

This guide covers the setup and configuration of `react-native-google-mobile-ads` SDK for your React Native/Expo app.

## ✅ Completed Migration

### 1. Package Installation

- ✅ Removed `expo-ads-admob`
- ✅ Installed `react-native-google-mobile-ads`
- ✅ Updated app.config.js plugin

### 2. Code Updates

- ✅ Updated all ad components to use new SDK
- ✅ Updated configuration to use new API
- ✅ Added SDK initialization in app layout

## Configuration Files

### Ad Configuration (`config/AdConfig.ts`)

```typescript
export const AD_CONFIG = {
  // AdMob App ID
  APP_ID: "ca-app-pub-1639151369389939~6963720638",

  // Test Ad Unit IDs (automatically switches based on __DEV__)
  BANNER_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/6300978111" // Test banner
    : "ca-app-pub-1639151369389939/8380744082", // Your production banner
  INTERSTITIAL_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/1033173712" // Test interstitial
    : "ca-app-pub-1639151369389939/6760363044", // Your production interstitial
  REWARDED_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/5224354917" // Test rewarded
    : "ca-app-pub-1639151369389939/7878003595", // Your production rewarded

  BANNER_SIZE: "ADAPTIVE_BANNER" as const,
  AD_TIMEOUT: 10000,
  CAROUSEL_AD_FREQUENCY: 3,
  GAME_COMPLETION_AD_ENABLED: true,
  ANSWER_VIEWING_AD_ENABLED: true,
};
```

### App Configuration (`app.config.js`)

```javascript
"plugins": [
  "expo-router",
  "expo-font",
  "expo-secure-store",
  "expo-sqlite",
  "@react-native-google-signin/google-signin",
  [
    "react-native-google-mobile-ads",
    {
      "android_app_id": "ca-app-pub-1639151369389939~6963720638",
      "ios_app_id": "ca-app-pub-1639151369389939~6963720638"
    }
  ],
  // ... other plugins
]
```

### SDK Initialization (`app/_layout.tsx`)

```typescript
import mobileAds from "react-native-google-mobile-ads";

// Initialize Google Mobile Ads
mobileAds().initialize();
```

## Key Differences from expo-ads-admob

### 1. **Better Performance**

- More efficient ad loading
- Better memory management
- Improved error handling

### 2. **Modern API**

- Cleaner component APIs
- Better TypeScript support
- More reliable event handling

### 3. **Active Maintenance**

- Regularly updated
- Better community support
- Latest Google Ads features

## Ad Components Updated

### BannerAd Component

```typescript
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

<BannerAd
  unitId={AD_CONFIG.BANNER_AD_UNIT_ID}
  size={BannerAdSize.ADAPTIVE_BANNER}
  onAdLoaded={handleAdLoaded}
  onAdFailedToLoad={handleAdFailedToLoad}
  requestOptions={{
    requestNonPersonalizedAdsOnly: false,
  }}
/>;
```

### InterstitialAd Component

```typescript
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";

const interstitialAd = InterstitialAd.createForAdRequest(
  AD_CONFIG.INTERSTITIAL_AD_UNIT_ID,
  {
    requestNonPersonalizedAdsOnly: false,
  }
);
```

### RewardedAd Component

```typescript
import {
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const rewardedAd = RewardedAd.createForAdRequest(
  AD_CONFIG.REWARDED_AD_UNIT_ID,
  {
    requestNonPersonalizedAdsOnly: false,
  }
);
```

## Production Setup

### 1. Create AdMob Account

1. Go to https://admob.google.com
2. Create account and add your app
3. Generate ad unit IDs for each ad type

### 2. Update Ad Unit IDs

✅ **COMPLETED** - Your real ad unit IDs have been configured:

```typescript
BANNER_AD_UNIT_ID: 'ca-app-pub-1639151369389939/8380744082',
INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-1639151369389939/6760363044',
REWARDED_AD_UNIT_ID: 'ca-app-pub-1639151369389939/7878003595',
```

### 3. Build Configuration

#### For Expo Development Build

```bash
npx expo install --fix
npx expo prebuild
```

#### For EAS Build

```bash
eas build --platform android
eas build --platform ios
```

## Testing

### Test Ad Units

The implementation automatically uses test ad units in development mode:

- **Banner**: `ca-app-pub-3940256099942544/6300978111`
- **Interstitial**: `ca-app-pub-3940256099942544/1033173712`
- **Rewarded**: `ca-app-pub-3940256099942544/5224354917`

### Testing Checklist

- [ ] Banner ads load in carousel
- [ ] Interstitial ads show after game completion
- [ ] Rewarded ads show before answer viewing
- [ ] Error handling works when ads fail to load
- [ ] App functionality not blocked by ads

## Benefits of react-native-google-mobile-ads

### 1. **Better Revenue**

- Higher fill rates
- Better ad targeting
- More ad formats supported

### 2. **Improved User Experience**

- Faster ad loading
- Better error handling
- Smoother animations

### 3. **Developer Experience**

- Better TypeScript support
- Cleaner APIs
- More documentation

### 4. **Future-Proof**

- Actively maintained
- Regular updates
- Latest Google Ads features

## Troubleshooting

### Common Issues

1. **Ads not loading**

   - Check internet connection
   - Verify ad unit IDs
   - Check console for errors

2. **Build errors**

   - Run `npx expo install --fix`
   - Clear cache: `npx expo start --clear`

3. **Test ads not showing**
   - Ensure `__DEV__` is true
   - Check device is connected to internet
   - Verify test ad unit IDs

### Debug Mode

Enable debug mode for testing:

```typescript
import mobileAds from "react-native-google-mobile-ads";

// Enable debug mode
mobileAds().setRequestConfiguration({
  testDeviceIdentifiers: ["YOUR_DEVICE_ID"],
});
```

## Next Steps

1. **Test the implementation** with test ad units
2. **Create AdMob account** and get real ad unit IDs
3. **Update configuration** with production IDs
4. **Build and test** on real devices
5. **Monitor performance** and revenue

The migration to `react-native-google-mobile-ads` is complete and ready for testing!
