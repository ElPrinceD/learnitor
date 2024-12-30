import React, { createContext, useContext, useEffect, useState, useCallback, FC } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCommunities, getUserCommunities} from './CommunityApiCalls';
import { getCourseCategories, getCourses } from "./CoursesApiCalls";
import ApiUrl from './config';

// Define the shape of the context
interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  subscribeToCommunity: (communityId: string | number) => void;
  unsubscribeFromCommunity: (communityId: string | number) => void;
  subscribeToUserCommunities: () => Promise<void>;
  fetchAndCacheCommunities: () => Promise<void>;
  fetchAndCacheCourses: () => Promise<void>;
  fetchAndCacheCourseCategories: () => Promise<void>;
}

// Create the context with a default value of null
const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string;
}

export const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;

    // WebSocket connection
    const ws = new WebSocket(`https://learnitor.onrender.com/ws/chat/?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      subscribeToUserCommunities(); // Only subscribe to user communities on connect
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch(data.type) {
        case 'message':
          const cachedMessages = await AsyncStorage.getItem(`messages_${data.community_id}`);
          const updatedMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
          updatedMessages.unshift({
            id: data.id,
            sender: data.sender,
            message: data.message,
            sent_at: new Date().toISOString()
          });
          await AsyncStorage.setItem(`messages_${data.community_id}`, JSON.stringify(updatedMessages));
          break;
        case 'history':
          await AsyncStorage.setItem(`messages_${data.community_id}`, JSON.stringify(data.messages));
          break;
      }

      console.log("WebSocket message received:", data);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setSocket(ws);

    return () => {
      if (ws) ws.close();
    };
  }, [token]);

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected.");
    }
  }, [socket, isConnected]);

  const subscribeToCommunity = useCallback((communityId: string | number) => {
    if (socket && isConnected) {
      sendMessage({ type: 'join_community', community_id: communityId });
    }
  }, [socket, isConnected, sendMessage]);

  const unsubscribeFromCommunity = useCallback((communityId: string | number) => {
    if (socket && isConnected) {
      sendMessage({ type: 'leave_community', community_id: communityId });
    } else {
      console.error("WebSocket is not connected.");
    }
  }, [socket, isConnected, sendMessage]);

  const subscribeToUserCommunities = useCallback(async () => {
    if (socket && isConnected && token) {
      try {
        const communities = await getUserCommunities(token);
        communities.forEach(community => subscribeToCommunity(community.id));
      } catch (error) {
        console.error("Error fetching user communities:", error);
      }
    }
  }, [socket, isConnected, token, subscribeToCommunity]);

  const fetchAndCacheCommunities = useCallback(async () => {
    if (token) {
      try {
        let cachedCommunities = await AsyncStorage.getItem('communities');
        if (!cachedCommunities || JSON.parse(cachedCommunities).length === 0) {
          const communities = await getUserCommunities(token);
          await AsyncStorage.setItem('communities', JSON.stringify(communities));
          console.log("Communities fetched and cached.");
        } else {
          console.log("Communities already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache communities:", error);
      }
    }
  }, [token]);

  // Fetch and cache courses independently of WebSocket connection
  const fetchAndCacheCourses = useCallback(async () => {
    if (token) {
      try {
        let cachedCourses = await AsyncStorage.getItem('courses');
        if (!cachedCourses || JSON.parse(cachedCourses).length === 0) {
          const courses = await getCourses(token);
          await AsyncStorage.setItem('courses', JSON.stringify(courses));
          console.log("Courses fetched and cached.");
        } else {
          console.log("Courses already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache courses:", error);
      }
    }
  }, [token]);

  // Fetch and cache course categories independently of WebSocket connection
  const fetchAndCacheCourseCategories = useCallback(async () => {
    if (token) {
      try {
        let cachedCategories = await AsyncStorage.getItem('courseCategories');
        if (!cachedCategories || JSON.parse(cachedCategories).length === 0) {
          const categories = await getCourseCategories(token);
          await AsyncStorage.setItem('courseCategories', JSON.stringify(categories));
          console.log("Course categories fetched and cached.");
        } else {
          console.log("Course categories already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache course categories:", error);
      }
    }
  }, [token]);

  // Explicitly define the value for the context
  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    sendMessage,
    subscribeToCommunity,
    unsubscribeFromCommunity,
    subscribeToUserCommunities,
    fetchAndCacheCommunities,
    fetchAndCacheCourses,
    fetchAndCacheCourseCategories
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === null) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};