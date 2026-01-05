export default {
  "expo": {
    "name": "Elevay",
    "slug": "mock",
    "scheme": "elevay",
    "description": "Learn it all",
    "version": "1.0.7",
    "deepLinking": true,
    "orientation": "portrait",
    "icon": "./assets/images/ElevayWithoutTextLogo.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/ElevayLogoSplash.png",
      "resizeMode": "cover",
      "backgroundColor": "#ffffff",
      "dark": {
        "image": "./assets/images/ElevayLogoSplash.png",
        "resizeMode": "cover",
        "backgroundColor": "#18191a"
      }
    },
    "newArchEnabled": true,
    "assetBundlePatterns": ["**/*"],
    "sourceExts": ["js", "json", "ts", "tsx", "jsx", "svg"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cradle.learnitor",
      "buildNumber": "6",
      "associatedDomains": ["applinks:elevay.online"],
      "statusBar": {
        "style": "dark-content",
        "dark": {
          "style": "light-content"
        }
      },
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "UIBackgroundModes": ["remote-notification"],
        "UIDesignRequiresCompatibility": true,
        "CFBundleLocalizations": ["en-GB"],
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.214047247223-svtdq5sv7lh1jubvgisg7jvd7b4hh68i"
            ]
          }
        ],
        "NSUserNotificationsUsageDescription": "This app uses notifications to alert you about new messages and updates.",
        "EXErrorRecoveryEnabled": false
      }
    },
    "android": {
      "usesCleartextTraffic": true,
      "permissions": [
        "INTERNET", 
        "NOTIFICATIONS",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK"
      ],
      "versionCode": 7,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/ElevayWithoutTextLogo.png",
        "backgroundColor": "#18191a",
        "dark": {
          "backgroundColor": "#18191a"
        }
      },
      "package": "com.cradle.learnitor",
      "hermesEnabled": true,
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-1639151369389939~6963720638"
      },
      "googleServicesFile": "./google-services.json",
      "useNextNotificationsApi": true,
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "elevay.online",
              "pathPrefix": "/GameIntro"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "statusBar": {
        "backgroundColor": "#ffffff",
        "style": "dark-content",
        "dark": {
          "backgroundColor": "#18191a",
          "style": "light-content"
        }
      },
      "navigationBar": {
        "backgroundColor": "#ffffff",
        "style": "light-content",
        "dark": {
          "backgroundColor": "#18191a",
          "style": "dark-content"
        }
      }
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
      [
        "expo-system-ui",
        {
          "android": {
            "statusBarColor": "#ffffff",
            "navigationBarColor": "#ffffff",
            "statusBarStyle": "dark-content",
            "navigationBarStyle": "light-content",
            "dark": {
              "statusBarColor": "#18191a",
              "navigationBarColor": "#18191a",
              "statusBarStyle": "light-content",
              "navigationBarStyle": "dark-content"
            }
          },
          "ios": {
            "statusBarStyle": "dark-content",
            "dark": {
              "statusBarStyle": "light-content"
            }
          }
        }
      ],
      "expo-sqlite",
      "@react-native-google-signin/google-signin",
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-1639151369389939~6963720638",
          "iosAppId": "ca-app-pub-1639151369389939~6963720638"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/ElevayWithoutTextLogo.png",
          "color": "#18191a",
          "defaultChannel": "default",
          "dark": {
            "color": "#18191a"
          }
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
      ],
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "elevay",
          "organization": "elevay"
        }
      ],
      "expo-web-browser",
      "expo-dev-client",
      "./plugins/disable-error-recovery"
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
      "API_URL": "https://16.171.33.30/"
    },
    "owner": "mandey",
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/7fd80734-c8a7-49db-accf-6b9f79c74f9f",
      "fallbackToCacheTimeout": 3000,
      "checkAutomatically": "NEVER",
      "enabled": true
    },
  
  },

};
