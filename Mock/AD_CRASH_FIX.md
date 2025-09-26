# Ad Crash Fix Guide

## Issue

The app crashes on startup due to Google Mobile Ads SDK configuration issues.

## Solution Steps

### 1. Test Without Ads (Current State)

The app should now run without crashing since we've temporarily disabled:

- `mobileAds().initialize()`
- `AdManagerProvider`

### 2. Re-enable Ads Properly

#### Step 1: Install Native Dependencies

```bash
# For iOS (if using iOS)
cd ios && pod install && cd ..

# For Android, the SDK should work with Expo managed workflow
```

#### Step 2: Update app.config.js

Make sure your app.config.js has the correct plugin configuration:

```javascript
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "react-native-google-mobile-ads",
        {
          "android_app_id": "ca-app-pub-1639151369389939~6963720638",
          "ios_app_id": "ca-app-pub-1639151369389939~6963720638"
        }
      ]
    ]
  }
}
```

#### Step 3: Re-enable Ads Gradually

1. **First, re-enable the SDK initialization:**

```typescript
// In app/_layout.tsx
mobileAds().initialize();
```

2. **Then re-enable the AdManagerProvider:**

```typescript
// In app/_layout.tsx
<AdManagerProvider>{/* rest of your app */}</AdManagerProvider>
```

#### Step 4: Test Each Step

- Test after enabling SDK initialization
- Test after enabling AdManagerProvider
- Test with individual ad components

### 3. Alternative: Use Expo Development Build

If the managed workflow doesn't work, you might need to create a development build:

```bash
npx expo install expo-dev-client
npx expo run:android
# or
npx expo run:ios
```

### 4. Debug Steps

1. Check Metro logs for specific error messages
2. Test on physical device (ads don't work in simulator)
3. Verify AdMob account is properly configured
4. Check that ad unit IDs are correct

### 5. Fallback: Conditional Ads

If ads continue to cause issues, implement conditional loading:

```typescript
// In app/_layout.tsx
useEffect(() => {
  if (!__DEV__) {
    mobileAds().initialize();
  }
}, []);
```

This only initializes ads in production builds.
