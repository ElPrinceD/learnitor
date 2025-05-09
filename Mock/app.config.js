export default {
  "expo": {
    "name": "Elevay",
    "slug": "mock",
    "scheme": "myapp",
    "description": "Learn it all",
    "version": "1.0.0",
    "deepLinking": true,
    "orientation": "portrait",
    "icon": "./assets/images/Elevay.jpg",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/Elevay.jpg",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "newArchEnabled": true,
    "assetBundlePatterns": ["**/*"],
    "sourceExts": ["js", "json", "ts", "tsx", "jsx", "svg"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cradle.learnitor",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"],
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.214047247223-svtdq5sv7lh1jubvgisg7jvd7b4hh68i"
            ]
          }
        ],
        "NSUserNotificationsUsageDescription": "This app uses notifications to alert you about new messages and updates."
      }
    },
    "android": {
      "usesCleartextTraffic": true,
      "permissions": ["INTERNET", "NOTIFICATIONS"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.cradle.learnitor",
      "hermesEnabled": true,
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "@react-native-google-signin/google-signin",
      "react-native-video",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/Elevay.jpg",
          "color": "#ffffff",
          "sounds": ["default"]
        }
      ],
      [
        "expo-sqlite",
        {
          "enableFTS": true,
          "useSQLCipher": true,
          "android": {
            "enableFTS": false,
            "useSQLCipher": false
          },
          "ios": {
            "customBuildFlags": [
              "-DSQLITE_ENABLE_DBSTAT_VTAB=1",
              "-DSQLITE_ENABLE_SNAPSHOT=1"
            ]
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "7fd80734-c8a7-49db-accf-6b9f79c74f9f"
      },
      "TWITTER_CLIENT_ID": "RGJSaVBYcFVsaEc2R3NrX1BvZTg6MTpjaQ",
      "API_URL": "http://16.171.33.30/"
    },
    "owner": "mandey",
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/7fd80734-c8a7-49db-accf-6b9f79c74f9f"
    },
    plugins: [
      "expo-web-browser", // Add this line
      "expo-dev-client"
    ],
  }

};
