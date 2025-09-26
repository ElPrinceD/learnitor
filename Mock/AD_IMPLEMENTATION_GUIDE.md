# Ad Implementation Guide

## Overview

This guide covers the implementation of Google Mobile Ads using `react-native-google-mobile-ads` SDK in strategic locations throughout the app to maximize revenue while maintaining a good user experience.

## Implementation Summary

### ✅ Completed Features

1. **Google Mobile Ads SDK Integration**

   - Installed `react-native-google-mobile-ads` package
   - Added Google Mobile Ads plugin to app.config.js
   - Created comprehensive ad configuration
   - Added SDK initialization

2. **Ad Components Created**

   - `BannerAd.tsx` - For banner ads in carousel
   - `InterstitialAd.tsx` - For full-screen ads after game completion
   - `RewardedAd.tsx` - For rewarded video ads before showing answers
   - `AdManager.tsx` - Centralized ad management with context

3. **Strategic Ad Placements**

   **A. Game Completion Ads (Interstitial)**

   - Location: `app/(game)/Results.tsx`
   - Trigger: When game results are displayed
   - Type: Full-screen interstitial ads
   - Revenue Impact: High (users are engaged after completing games)

   **B. Answer Viewing Ads (Rewarded Video)**

   - Location: `app/(tabs)/(two)/ScorePage.tsx`
   - Trigger: When user clicks "Show Answers"
   - Type: Rewarded video ads (user must watch to see answers)
   - Revenue Impact: High (users actively choose to watch for content)

   **C. Home Page Carousel Ads (Banner)**

   - Location: `app/(tabs)/home.tsx`
   - Trigger: Every 3rd carousel item
   - Type: Banner ads integrated with content
   - Revenue Impact: Medium (discovery and engagement)

## Technical Implementation

### Ad Configuration (`config/AdConfig.ts`)

```typescript
export const AD_CONFIG = {
  // Test Ad Unit IDs (automatically switches based on __DEV__)
  BANNER_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/6300978111" // Test banner
    : "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // Your real ID
  INTERSTITIAL_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/1033173712" // Test interstitial
    : "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // Your real ID
  REWARDED_AD_UNIT_ID: __DEV__
    ? "ca-app-pub-3940256099942544/5224354917" // Test rewarded
    : "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // Your real ID

  BANNER_SIZE: "ADAPTIVE_BANNER" as const,
  AD_TIMEOUT: 10000,
  CAROUSEL_AD_FREQUENCY: 3, // Show ad every 3rd carousel item
  GAME_COMPLETION_AD_ENABLED: true,
  ANSWER_VIEWING_AD_ENABLED: true,
};
```

### Ad Manager Integration

The `AdManagerProvider` is integrated into the app layout to provide ad functionality throughout the app:

```typescript
// In app/_layout.tsx
import mobileAds from "react-native-google-mobile-ads";

// Initialize Google Mobile Ads
mobileAds().initialize();

<AdManagerProvider>{/* App content */}</AdManagerProvider>;
```

## Usage Examples

### Game Completion Ad

```typescript
const { showGameCompletionAd } = useAdManager();

useEffect(() => {
  showGameCompletionAd(); // Shows interstitial ad when game ends
}, []);
```

### Answer Viewing Ad

```typescript
const { showAnswerViewingAd } = useAdManager();

const handleShowAnswers = () => {
  showAnswerViewingAd(() => {
    setShowAnswers(true); // Show answers after ad completion
  });
};
```

### Carousel Banner Ads

```typescript
// Automatically integrated in ReanimatedCarouselWithAds
// Shows banner ad every 3rd carousel item
```

## Production Setup

### 1. Replace Test Ad Unit IDs

✅ **COMPLETED** - Your real AdMob ad unit IDs have been configured:

```typescript
BANNER_AD_UNIT_ID: 'ca-app-pub-1639151369389939/8380744082',
INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-1639151369389939/6760363044',
REWARDED_AD_UNIT_ID: 'ca-app-pub-1639151369389939/7878003595',
```

### 2. Google AdMob Account Setup

1. Create AdMob account at https://admob.google.com
2. Create new app in AdMob dashboard
3. Generate ad unit IDs for each ad type
4. Update configuration with real IDs

### 3. Testing

- Use test ad unit IDs during development
- Test on both Android and iOS
- Verify ad loading and error handling

## Revenue Optimization

### Ad Frequency Strategy

- **Carousel**: 1 ad per 3 content items (33% ad ratio)
- **Game Completion**: 1 ad per completed game (100% completion rate)
- **Answer Viewing**: 1 ad per answer viewing session (user choice)

### User Experience Considerations

- **Non-blocking**: Ads don't prevent core functionality
- **Fallback**: If ads fail to load, content is still accessible
- **Clear labeling**: Users know when they're viewing ads
- **Rewarded choice**: Answer viewing ads are optional but rewarding

## Monitoring and Analytics

### Key Metrics to Track

1. **Ad Load Rate**: Percentage of successful ad loads
2. **Ad Click Rate**: User interaction with ads
3. **Revenue per User**: Total ad revenue divided by active users
4. **User Retention**: Impact of ads on user retention

### Implementation Notes

- All ads include proper error handling
- Loading states are managed appropriately
- Ads are non-intrusive to core app functionality
- Test ad units are used in development mode

## Next Steps

1. **Test the implementation** with test ad units
2. **Set up AdMob account** and get real ad unit IDs
3. **Replace test IDs** with production IDs
4. **Monitor performance** and adjust frequency if needed
5. **A/B test** different ad placements and frequencies

## Files Modified

### New Files Created

- `config/AdConfig.ts` - Ad configuration
- `components/ads/BannerAd.tsx` - Banner ad component
- `components/ads/InterstitialAd.tsx` - Interstitial ad component
- `components/ads/RewardedAd.tsx` - Rewarded ad component
- `components/ads/AdManager.tsx` - Ad management context
- `components/ReanimatedCarouselWithAds.tsx` - Carousel with ads

### Files Modified

- `app/_layout.tsx` - Added AdManagerProvider
- `app/(game)/Results.tsx` - Added game completion ads
- `app/(tabs)/(two)/ScorePage.tsx` - Added answer viewing ads
- `app/(tabs)/home.tsx` - Updated to use carousel with ads
- `app.config.js` - Added Google Mobile Ads plugin

The implementation is complete and ready for testing with real Google AdMob ad units using the modern `react-native-google-mobile-ads` SDK!
