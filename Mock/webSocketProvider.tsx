import React, { createContext, useContext, useEffect, useState, useCallback, FC } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCommunities, getCommunityDetails, getUserCommunities, getCommunityMessages } from './CommunityApiCalls';
import { getCourseCategories, getCourses } from "./CoursesApiCalls";
import ApiUrl from './config';
import { getCategoryNames, getTodayPlans } from "./TimelineApiCalls";

// Define the shape of the context
interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinAndSubscribeToCommunity: (communityId: string | number) => Promise<void>;
  unsubscribeFromCommunity: (communityId: string | number) => void;
  subscribeToExistingUserCommunities: () => Promise<void>;
  fetchAndCacheCommunities: () => Promise<void>;
  fetchAndCacheCourses: () => Promise<void>;
  fetchAndCacheCourseCategories: () => Promise<void>;
  fetchAndCacheTodayPlans: (token: string, date: Date, category?: string) => Promise<void>;
  fetchAndCacheCategoryNames: (token: string) => Promise<void>;
  getCachedTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  getCachedCategoryNames: () => Promise<any>;
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

    const fetchCommunityMessages = async () => {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {

          
          const messages = await getCommunityMessages( community.id, token);
          const transformedMessages = messages.map((message) => ({
            _id: message.id,
            text: message.message,
            createdAt: new Date(message.sent_at),
            user: {
              _id: message.sender_id,
              name: message.sender,
            },
          }));
          await AsyncStorage.setItem(`messages_${community.id}`, JSON.stringify(transformedMessages));
          
          // Set the last message for this community
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            await AsyncStorage.setItem(`last_message_${community.id}`, JSON.stringify(lastMessage));
          }
        }
      } catch (error) {
        console.error("Error fetching community messages:", error);
      }
    };

    fetchCommunityMessages();

    // WebSocket connection
    const ws = new WebSocket(`${ApiUrl}/ws/chat/?token=${token}`);

    ws.onopen = async () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    
      if (isConnected && token) {
        try {
          await subscribeToExistingUserCommunities(); // Ensure this is awaited for sequential execution
          fetchInitialLastMessages(); // Fetch the last messages
        } catch (error) {
          console.error("Error during WebSocket initialization:", error);
        }
      }
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      switch(data.type) {
        case 'message':
          // Update full message history
          const cachedMessages = await AsyncStorage.getItem(`messages_${data.community_id}`);
          const updatedMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
          updatedMessages.push({
            id: data.id,
            sender: data.sender,
            message: data.message,
            sent_at: data.sent_at
          });
          await AsyncStorage.setItem(`messages_${data.community_id}`, JSON.stringify(updatedMessages));

          // Update last message for list view
          await AsyncStorage.setItem(`last_message_${data.community_id}`, JSON.stringify(data));
          break;
        case 'history':
          // Store full history
          const normalizedMessages = data.messages.map(msg => ({
            ...msg,
            sent_at: new Date(msg.sent_at).toISOString() // Ensure sent_at is ISO string
          }));
          
          await AsyncStorage.setItem(`messages_${data.community_id}`, JSON.stringify(normalizedMessages));
          console.log("Normalized: ", normalizedMessages);
          
          // Store only the last message for list view
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            await AsyncStorage.setItem(`last_message_${data.community_id}`, JSON.stringify({
              ...lastMessage,
              sent_at: new Date(lastMessage.sent_at).toISOString()
            }));
          }
          break;
        case 'join_success':
          // Handle join success if needed, like updating UI or local state
          console.log(`Successfully joined community: ${data.community_id}`);
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

  const messageQueue: any[] = []; // Queue to store messages

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Queuing the message.");
      messageQueue.push(message); // Queue the message
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (socket && isConnected && messageQueue.length > 0) {
      console.log("Sending queued messages.");
      messageQueue.forEach(msg => socket.send(JSON.stringify(msg)));
      messageQueue.length = 0; // Clear the queue
    }
  }, [socket, isConnected]);

  const fetchInitialLastMessages = useCallback(async () => {
    try {
      const communities = await getUserCommunities(token);

      for (const community of communities) {
        
        const cachedLastMessage = await AsyncStorage.getItem(`last_message_${community.id}`);
        console.log("LAst ",cachedLastMessage)
        if (!cachedLastMessage) {
          // If there's no cached last message, fetch history to get the last one
          sendMessage({ type: 'history', community_id: community.id });
        }
      }
    } catch (error) {
      console.error("Error fetching initial last messages:", error);
    }
  }, [token, sendMessage]);

  // Function for joining a new community
  const joinAndSubscribeToCommunity = useCallback(async (communityId: string | number) => {
    if (socket && isConnected) {
      try {
        const message = { type: 'join_community', community_id: communityId };
        socket.send(JSON.stringify(message));
  
        // Wait for acknowledgment from the server that the join was successful
        const handleJoinSuccess = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'join_success' && data.community_id === communityId) {
            console.log(`Successfully joined community: ${communityId}`);
            socket.removeEventListener('message', handleJoinSuccess);
          }
        };
  
        socket.addEventListener('message', handleJoinSuccess);
  
        // Update the cached communities
        await updateCachedCommunities(communityId);
      } catch (error) {
        console.error("Failed to join community:", error);
      }
    } else {
      console.error("WebSocket is not connected.");
    }
  }, [socket, isConnected, token]);
  

  const unsubscribeFromCommunity = useCallback((communityId: string | number) => {
    if (socket && isConnected) {
      sendMessage({ type: 'leave_community', community_id: communityId });
    } else {
      console.error("WebSocket is not connected.");
    }
  }, [socket, isConnected, sendMessage]);

  const fetchAndCacheTodayPlans = useCallback(async (token: string, date: Date, category?: string) => {
    try {
      const dateString = date.toISOString().split('T')[0]; // Simplified for caching key
      const cacheKey = `todayPlans_${dateString}_${category || 'all'}`;
      const cachedPlans = await AsyncStorage.getItem(cacheKey);
      if (cachedPlans) {
        return JSON.parse(cachedPlans);
      }
      const plans = await getTodayPlans(token, date, category);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(plans));
      return plans;
    } catch (error) {
      console.error("Failed to fetch or cache today's plans:", error);
      throw error;
    }
  }, []);

  const fetchAndCacheCategoryNames = useCallback(async (token: string) => {
    try {
      const cachedCategories = await AsyncStorage.getItem('categoryNames');
      if (cachedCategories) {
        return JSON.parse(cachedCategories);
      }
      const categories = await getCategoryNames(token);
      await AsyncStorage.setItem('categoryNames', JSON.stringify(categories));
      return categories;
    } catch (error) {
      console.error("Failed to fetch or cache category names:", error);
      throw error;
    }
  }, []);

  const getCachedTodayPlans = useCallback(async (date: Date, category?: string) => {
    const dateString = date.toISOString().split('T')[0];
    const cacheKey = `todayPlans_${dateString}_${category || 'all'}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return cachedData ? JSON.parse(cachedData) : [];
  }, []);

  const getCachedCategoryNames = useCallback(async () => {
    const cachedData = await AsyncStorage.getItem('categoryNames');
    return cachedData ? JSON.parse(cachedData) : {};
  }, []);

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (socket && isConnected && token) {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {
          await subscribeToExistingCommunity(community.id);
        }
      } catch (error) {
        console.error("Error fetching user communities:", error);
      }
    }
  }, [socket, isConnected, token]);

  // Helper function to subscribe to an existing community without trying to join
  const subscribeToExistingCommunity = useCallback(async (communityId: string | number) => {
    if (socket && isConnected) {
      try {
        // Directly subscribe to the community's group without attempting to join
        const community_group_name = `community_${communityId}`;
        // Simulate adding to a group layer since we don't have direct access in the frontend
        sendMessage({ type: 'subscribe_existing', community_id: communityId });
        
        await updateCachedCommunities(communityId);
      } catch (error) {
        console.error("Failed to subscribe to existing community:", error);
      }
    }
  }, [socket, isConnected]);

  const updateCachedCommunities = async (communityId: string | number) => {
    try {
      const newCommunity = await getCommunityDetails(communityId, token);
      let cachedCommunities = await AsyncStorage.getItem('communities');
      let communities = cachedCommunities ? JSON.parse(cachedCommunities) : [];

      // Add to cache only if not already there
      if (!communities.some(c => c.id === communityId)) {
        communities.push(newCommunity);
        await AsyncStorage.setItem('communities', JSON.stringify(communities));
      }
    } catch (error) {
      console.error("Error updating cached communities:", error);
    }
  };

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
    joinAndSubscribeToCommunity,
    unsubscribeFromCommunity,
    subscribeToExistingUserCommunities,
    fetchAndCacheCommunities,
    fetchAndCacheCourses,
    fetchAndCacheCourseCategories,
    fetchAndCacheTodayPlans,
    fetchAndCacheCategoryNames,
    getCachedTodayPlans,
    getCachedCategoryNames
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