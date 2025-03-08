import { useEffect } from "react";
import { Linking } from "react-native";
import { useAuth } from "./components/AuthContext";
import ApiUrl from "./config";
import { useWebSocket } from "./webSocketProvider";
import { router } from "expo-router";


const DeepLinkHandler = () => {
  const { userToken } = useAuth();
  const { joinAndSubscribeToCommunity, fetchAndCacheCommunities } = useWebSocket();
  const API_URL = ApiUrl

  const handleDeepLink = async (url) => {
    if (!url || !userToken?.token) return;

    const match = url.match(/myapp:\/\/join\/(.+)/);
    if (!match) return;

    const shareableLink = match[1];
    try {
      const response = await fetch(`${API_URL}/join/${shareableLink}/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${userToken.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.status === "joined" || data.status === "already_joined") {
        await joinAndSubscribeToCommunity(data.community_id);
        await fetchAndCacheCommunities();
        router.push({ pathname: "CommunityDetailScreen", params: { id: data.community_id } });
      } else {
        console.error("Failed to join community:", data);
      }
    } catch (error) {
      console.error("Error joining community via link:", error);
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
    return () => subscription.remove();
  }, [userToken]);

  return null;
};

export default DeepLinkHandler;