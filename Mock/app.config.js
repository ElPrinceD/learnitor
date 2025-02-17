export default {
  expo: {
    name: "Mock",
    slug: "mock",
    description: "Learn it all",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    newArchEnabled: true,
    assetBundlePatterns: [
      "/*"
    ],
    sourceExts: [
      "js,json,ts,tsx,jsx,svg"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cradle.learnitor",
      infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["com.googleusercontent.apps.214047247223-svtdq5sv7lh1jubvgisg7jvd7b4hh68i"]  
        }
      ]
    }
    },
    android: {
      usesCleartextTraffic: true,
      permissions: [
        "INTERNET",
        "OTHER_PERMISSION_IF_NEEDED"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      
      package: "com.cradle.learnitor",
      // googleServicesFile: process.env.GOOGLE_SERVICES_JSON
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-sqlite",
      "@react-native-google-signin/google-signin",
      "react-native-video"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "7fd80734-c8a7-49db-accf-6b9f79c74f9f"
      },
      TWITTER_CLIENT_ID: "RGJSaVBYcFVsaEc2R3NrX1BvZTg6MTpjaQ"
    },
    owner: "mandey",
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/7fd80734-c8a7-49db-accf-6b9f79c74f9f"
    }
  }
}
