// Google Mobile Ads Configuration
export const AD_CONFIG = {
  // AdMob App ID
  APP_ID: 'ca-app-pub-1639151369389939~6963720638',
  
  // Test Ad Unit IDs (replace with real ones in production)
  BANNER_AD_UNIT_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test banner ad unit
    : 'ca-app-pub-1639151369389939/8380744082', // Your production banner ad unit
  INTERSTITIAL_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712' // Test interstitial ad unit
    : 'ca-app-pub-1639151369389939/6760363044', // Your production interstitial ad unit
  REWARDED_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917' // Test rewarded ad unit
    : 'ca-app-pub-1639151369389939/7878003595', // Your production rewarded ad unit
  NATIVE_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/2247696110' // Test native ad unit
    : 'ca-app-pub-1639151369389939/3485416729', // Your production native ad unit
  
  // Ad Settings
  BANNER_SIZE: 'ADAPTIVE_BANNER' as const,
  AD_TIMEOUT: 10000, // 10 seconds timeout for ad loading
  
  // Ad Frequency Settings
  CAROUSEL_AD_FREQUENCY: 2, // Show ad every 2nd carousel item (2 ads total for good balance)
  GAME_COMPLETION_AD_ENABLED: true,
  ANSWER_VIEWING_AD_ENABLED: true,
};

// Ad placement types
export enum AdPlacement {
  HOME_CAROUSEL = 'home_carousel',
  GAME_COMPLETION = 'game_completion',
  ANSWER_VIEWING = 'answer_viewing',
}

// Ad loading states
export enum AdLoadingState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  SHOWN = 'shown',
}
