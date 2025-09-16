import React from "react";
import { TouchableOpacity, Linking, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

interface InAppBrowserLinkProps {
  url: string;
  children: React.ReactNode;
  style?: any;
}

const InAppBrowserLink: React.FC<InAppBrowserLinkProps> = ({
  url,
  children,
  style,
}) => {
  const handlePress = async () => {
    try {
      // Open URL using native browser (SFSafariViewController on iOS, Chrome Custom Tabs on Android)
      await WebBrowser.openBrowserAsync(url, {
        // Enable native browser features
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: "#007AFF", // iOS control color
        showTitle: true,
        enableBarCollapsing: true, // Android Chrome Custom Tabs
        showInRecents: true, // Show in recent apps
      });
    } catch (error) {
      console.error("WebBrowser error:", error);
      // Fallback to system browser if expo-web-browser fails
      try {
        await Linking.openURL(url);
      } catch (linkingError) {
        console.error("Linking error:", linkingError);
        Alert.alert("Error", "Could not open the link");
      }
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      {children}
    </TouchableOpacity>
  );
};

export default InAppBrowserLink;
