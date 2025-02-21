import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  FC,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCommunities,
  getCommunityDetails,
  getUserCommunities,
  getCommunityMessages,
} from "./CommunityApiCalls";
import { getCourseCategories, getCourses } from "./CoursesApiCalls";
import WsUrl from "./configWs";
import { getCategoryNames, getTodayPlans } from "./TimelineApiCalls";
import { useAuth } from "./components/AuthContext";

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
  fetchAndCacheTodayPlans: (
    token: string | null,
    date: Date | null,
    category?: string
  ) => Promise<any[]>;
  fetchAndCacheCategoryNames: (
    token: string | null
  ) => Promise<Record<number, string>>;
  getCachedTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  getCachedCategoryNames: () => Promise<Record<number, string>>;
  unreadCommunitiesCount: number;
  markMessageAsRead: (communityId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

export const WebSocketProvider: FC<WebSocketProviderProps> = ({
  children,
  token,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<
    Record<string, any>
  >({});

  const { userToken, userInfo } = useAuth();
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const userId = userInfo?.user?.id;

  const messageQueue: any[] = [];

  const connectWebSocket = useCallback(() => {
    if (!token) return;

    if (socket) {
      socket.close();
    }
    const ws = new WebSocket(`${WsUrl}/ws/chat/?token=${token}`);
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log("WebSocket connected");
      subscribeToExistingUserCommunities().catch(console.error);
      fetchInitialLastMessages().catch(console.error);
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "message":
          // Update full message history with reply information
          const cachedMessages = await AsyncStorage.getItem(
            `messages_${data.community_id}`
          );
          const updatedMessages = cachedMessages
            ? JSON.parse(cachedMessages)
            : [];
          updatedMessages.push({
            _id: data.id.toString(),
            text: data.message,
            createdAt: new Date(data.sent_at),
            user: {
              _id: data.sender_id,
              name: data.sender,
              avatar: data.sender_image || null,
            },
            status: data.status || "sent",
            replyTo: data.reply_to
              ? {
                  _id: data.reply_to.id ? data.reply_to.id.toString() : null,
                  text: data.reply_to.snippet || null,
                  user: {
                    _id: data.reply_to.sender_id || null,
                    name: data.reply_to.sender_name || null,
                  },
                }
              : null,
            image: data.image || null,  
            video: data.video || null,  
            document: data.document || null,  
          });

          await AsyncStorage.setItem(
            `messages_${data.community_id}`,
            JSON.stringify(updatedMessages)
          );

          // Update last message for list view with status
          const newLastMessage = {
            ...data,
            status: data.status || "sent",
            sent_at: new Date(data.sent_at).toISOString(),
            replyTo: data.reply_to
              ? {
                  id: data.reply_to.id ? data.reply_to.id.toString() : null,
                  snippet: data.reply_to.snippet || null,
                  sender_name: data.reply_to.sender_name || null,
                }
              : null,
          };
          await AsyncStorage.setItem(
            `last_message_${data.community_id}`,
            JSON.stringify(newLastMessage)
          );
          if (userId && data.sender_id !== userId) {
            setUnreadCommunityMessages((prev) => ({
              ...prev,
              [data.community_id]: newLastMessage,
            }));
          }
          break;
        case "history":
          // Store full history including replies, images, videos, and documents
          const normalizedMessages = data.messages.map((msg) => ({
            _id: msg.id.toString(),
            text: msg.message,
            createdAt: new Date(msg.sent_at),
            user: {
              _id: msg.sender_id,
              name: msg.sender,
              avatar: msg.sender_image || null,
            },
            status: msg.status || "sent",
            replyTo: msg.reply_to
              ? {
                  _id: msg.reply_to.id ? msg.reply_to.id.toString() : null,
                  text: msg.reply_to.snippet || null,
                  user: {
                    _id: msg.reply_to.sender_id || null,
                    name: msg.reply_to.sender_name || null,
                  },
                }
              : null,
            image: msg.image || null,
            video: msg.video || null,
            document: msg.document || null,
          }));

          await AsyncStorage.setItem(
            `messages_${data.community_id}`,
            JSON.stringify(normalizedMessages)
          );

          // Store only the last message for list view
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            await AsyncStorage.setItem(
              `last_message_${data.community_id}`,
              JSON.stringify({
                ...lastMessage,
                sent_at: new Date(lastMessage.sent_at).toISOString(),
                status: lastMessage.status || "sent",
                replyTo: lastMessage.reply_to
                  ? {
                      id: lastMessage.reply_to.id
                        ? lastMessage.reply_to.id.toString()
                        : null,
                      snippet: lastMessage.reply_to.snippet || null,
                      sender_name: lastMessage.reply_to.sender_name || null,
                    }
                  : null,
              })
            );
            if (userId && lastMessage.sender_id !== userId) {
              setUnreadCommunityMessages((prev) => ({
                ...prev,
                [data.community_id]: {
                  ...lastMessage,
                  status: lastMessage.status || "sent",
                  sent_at: new Date(lastMessage.sent_at).toISOString(),
                  replyTo: lastMessage.reply_to
                    ? {
                        id: lastMessage.reply_to.id
                          ? lastMessage.reply_to.id.toString()
                          : null,
                        snippet: lastMessage.reply_to.snippet || null,
                        sender_name: lastMessage.reply_to.sender_name || null,
                      }
                    : null,
                },
              }));
            }
          }
          break;
        case "message_status":
          // Update message status in both full history and last message cache
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            const messages = await AsyncStorage.getItem(
              `messages_${communityId}`
            );
            if (messages) {
              let parsedMessages = JSON.parse(messages);
              const messageIndex = parsedMessages.findIndex(
                (msg) => msg._id === messageId.toString()
              );
              if (messageIndex !== -1) {
                parsedMessages[messageIndex].status = data.status;
                await AsyncStorage.setItem(
                  `messages_${communityId}`,
                  JSON.stringify(parsedMessages)
                );
              }
            }
            const lastMessage = await AsyncStorage.getItem(
              `last_message_${communityId}`
            );
            if (lastMessage) {
              let parsedLastMessage = JSON.parse(lastMessage);
              if (parsedLastMessage.id === messageId) {
                parsedLastMessage.status = data.status;
                await AsyncStorage.setItem(
                  `last_message_${communityId}`,
                  JSON.stringify(parsedLastMessage)
                );
                if (userId && data.sender_id !== userId) {
                  setUnreadCommunityMessages((prev) => ({
                    ...prev,
                    [communityId]: parsedLastMessage,
                  }));
                }
              }
            }
          }
          break;
        case "join_success":
          break;
      }
    };

    ws.onclose = (event: CloseEvent) => {
      console.log("WebSocket disconnected");

      console.log("Close event code:", event?.code);
      console.log("Close event reason:", event?.reason);

      setIsConnected(false);
      if (reconnectAttempts > 3) {
        console.warn("Connection lost. Trying to reconnect...");
      }
      if (reconnectAttempts > 0 || token) {
        reconnectWebSocket();
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (error.type === "error" && error.eventPhase === 1006) {
        console.warn("Network error detected. Attempting to reconnect...");
      }
      if (token) {
       reconnectWebSocket();
      }
    };

    return () => {
      ws.close();
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      connectWebSocket();
    }
  }, [token, connectWebSocket]);

  const reconnectWebSocket = useCallback(() => {
    const initialBackoffMs = 1000; // 1 second
    const maxBackoffMs = 300000; // 5 minutes
    const backoffMultiplier = 1.5;

    const attempt = reconnectAttempts;
    let backoff = Math.min(
      maxBackoffMs,
      initialBackoffMs * Math.pow(backoffMultiplier, attempt)
    );
    backoff += Math.random() * 1000; // Add randomness

    console.log(`Attempting to reconnect in ${backoff / 1000} seconds...`);

    setTimeout(() => {
      setReconnectAttempts(attempt + 1);
      connectWebSocket();
    }, backoff);
  }, [reconnectAttempts, connectWebSocket]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not connected. Queuing the message.");
        messageQueue.push(message);
      }
    },
    [socket, isConnected]
  );

  useEffect(() => {
    if (isConnected) {
      const resendUnsentMessages = async () => {
        try {
          // Get all keys from AsyncStorage.
          const allKeys = await AsyncStorage.getAllKeys();
          // Filter to keys that start with 'unsent_message_'.
          const unsentKeys = allKeys.filter((key) =>
            key.startsWith("unsent_message_")
          );
          
          // Process each unsent message.
          for (const key of unsentKeys) {
            const json = await AsyncStorage.getItem(key);
            if (json) {
              const message = JSON.parse(json);
              
              // Send the message.
              // If sendMessage returns a promise, await it.
              await sendMessage({
                type: "send_message",
                community_id: message.communityId,
                message: message.content.text,
                sender: message.user.name,
                sender_id: message.user._id,
                temp_id: message._id,
                ...(message.replyTo && { reply_to: message.replyTo }),
                image: message.content.image,
                document: message.content.document,
              });
              
              // Remove the key once the message is sent.
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.error("Error resending unsent messages: ", error);
        }
      };
  
      resendUnsentMessages();
    }
  }, [isConnected, sendMessage]);
  

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token || !isConnected) return;
    try {
      const communities = await getUserCommunities(token);
      for (const community of communities) {
        const cachedLastMessage = await AsyncStorage.getItem(
          `last_message_${community.id}`
        );

        if (!cachedLastMessage) {
          sendMessage({ type: "fetch_history", community_id: community.id });
        } else if (userId && JSON.parse(cachedLastMessage).sender_id !== userId) {
          setUnreadCommunityMessages((prev) => ({
            ...prev,
            [community.id]: JSON.parse(cachedLastMessage),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching initial last messages:", error);
    }
  }, [token, isConnected, sendMessage, userId]);

  const getCommunityIdFromMessage = async (messageId: string) => {
    const allCachedMessages = await AsyncStorage.multiGet(
      (
        await AsyncStorage.getAllKeys()
      ).filter((key) => key.startsWith("messages_"))
    );
    for (const [key, messages] of allCachedMessages) {
      if (messages) {
        const parsedMessages = JSON.parse(messages);
        if (parsedMessages.some((msg) => msg._id === messageId)) {
          return key.split("_")[1]; // Extract community_id from the key
        }
      }
    }
    return null;
  };

  // Calculate unread communities count
  const unreadCommunitiesCount = Object.values(unreadCommunityMessages).filter(
    (message) => message?.status !== "read"
  ).length;

  const markMessageAsRead = useCallback(
    async (communityId: string) => {
      setUnreadCommunityMessages((prev) => ({
        ...prev,
        [communityId]: {
          ...prev[communityId],
          status: "read",
        },
      }));

      // Update AsyncStorage to persist this status
      const lastMessageStr = await AsyncStorage.getItem(
        `last_message_${communityId}`
      );
      if (lastMessageStr) {
        const lastMessage = JSON.parse(lastMessageStr);
        await AsyncStorage.setItem(
          `last_message_${communityId}`,
          JSON.stringify({
            ...lastMessage,
            status: "read",
          })
        );

        socket?.send(
          JSON.stringify({
            type: "message_status_update",
            message_id: lastMessage.id,
            status: "read",
          })
        );
      }
    },
    [lastMessages, socket]
  );

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected) {
        try {
          const message = { type: "join_community", community_id: communityId };
          socket.send(JSON.stringify(message));

          const handleJoinSuccess = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (
              data.type === "join_success" &&
              data.community_id === communityId
            ) {
              console.log(`Successfully joined community: ${communityId}`);
              socket.removeEventListener("message", handleJoinSuccess);
            }
          };

          socket.addEventListener("message", handleJoinSuccess);

          await updateCachedCommunities(communityId);
        } catch (error) {
          console.error("Failed to join community:", error);
        }
      } else {
        console.error("WebSocket is not connected.");
      }
    },
    [socket, isConnected]
  );

  const unsubscribeFromCommunity = useCallback(
    (communityId: string | number) => {
      if (socket && isConnected) {
        sendMessage({ type: "leave_community", community_id: communityId });
      } else {
        console.error("WebSocket is not connected.");
      }
    },
    [socket, isConnected, sendMessage]
  );

  const fetchAndCacheTodayPlans = useCallback(
    async (token: string, date: Date, category?: string) => {
      if (token && isConnected) {
        try {
          const dateString = date?.toISOString().split("T")[0];
          const cacheKey = `todayPlans_${dateString}_${category || "all"}`;
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
      }
    },
    [isConnected]
  );

  const fetchAndCacheCategoryNames = useCallback(
    async (token: string) => {
      if (token && isConnected) {
        try {
          const cachedCategories = await AsyncStorage.getItem("categoryNames");
          if (cachedCategories) {
            return JSON.parse(cachedCategories);
          }
          const categories = await getCategoryNames(token);
          await AsyncStorage.setItem(
            "categoryNames",
            JSON.stringify(categories)
          );
          return categories;
        } catch (error) {
          console.error("Failed to fetch or cache category names:", error);
          throw error;
        }
      }
    },
    [isConnected]
  );

  const getCachedTodayPlans = useCallback(
    async (date: Date, category?: string) => {
      const dateString = date.toISOString().split("T")[0];
      const cacheKey = `todayPlans_${dateString}_${category || "all"}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      return cachedData ? JSON.parse(cachedData) : [];
    },
    []
  );

  const getCachedCategoryNames = useCallback(
    async (): Promise<Record<number, string>> => {
      const cachedData = await AsyncStorage.getItem("categoryNames");
      return cachedData ? JSON.parse(cachedData) : {};
    },
    []
  );

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

  const subscribeToExistingCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected) {
        try {
          sendMessage({
            type: "subscribe_existing",
            community_id: communityId,
          });
          await updateCachedCommunities(communityId);
        } catch (error) {
          console.error("Failed to subscribe to existing community:", error);
        }
      }
    },
    [socket, isConnected, sendMessage]
  );

  const updateCachedCommunities = async (communityId: string | number) => {
    if (token && isConnected) {
      try {
        const newCommunity = await getCommunityDetails(communityId, token);
        let cachedCommunities = await AsyncStorage.getItem("communities");
        let communities = cachedCommunities
          ? JSON.parse(cachedCommunities)
          : [];

        if (!communities.some((c) => c.id === communityId)) {
          communities.push(newCommunity);
          await AsyncStorage.setItem(
            "communities",
            JSON.stringify(communities)
          );
        }
      } catch (error) {
        console.error("Error updating cached communities:", error);
      }
    }
  };

  const fetchAndCacheCommunities = useCallback(async () => {
    if (token && isConnected) {
      try {
        let cachedCommunities = await AsyncStorage.getItem("communities");
        if (!cachedCommunities || JSON.parse(cachedCommunities).length === 0) {
          const communities = await getUserCommunities(token);
          await AsyncStorage.setItem(
            "communities",
            JSON.stringify(communities)
          );
          console.log("Communities fetched and cached.");
        } else {
          console.log("Communities already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache communities:", error);
      }
    } else {
      console.warn("WebSocket not connected, skipping community fetch.");
    }
  }, [token, isConnected]);

  const fetchAndCacheCourses = useCallback(async () => {
    if (token && isConnected) {
      try {
        let cachedCourses = await AsyncStorage.getItem("courses");
        if (!cachedCourses || JSON.parse(cachedCourses).length === 0) {
          const courses = await getCourses(token);
          await AsyncStorage.setItem("courses", JSON.stringify(courses));
          console.log("Courses fetched and cached.");
        } else {
          console.log("Courses already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache courses:", error);
      }
    } else {
      console.warn("WebSocket not connected, skipping course fetch.");
    }
  }, [token, isConnected]);

  const fetchAndCacheCourseCategories = useCallback(async () => {
    if (token && isConnected) {
      try {
        let cachedCategories = await AsyncStorage.getItem("courseCategories");
        if (!cachedCategories || JSON.parse(cachedCategories).length === 0) {
          const categories = await getCourseCategories(token);
          await AsyncStorage.setItem(
            "courseCategories",
            JSON.stringify(categories)
          );
          console.log("Course categories fetched and cached.");
        } else {
          console.log("Course categories already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache course categories:", error);
      }
    } else {
      console.warn(
        "WebSocket not connected, skipping course categories fetch."
      );
    }
  }, [token, isConnected]);

  useEffect(() => {
    // This effect will run once when the component mounts or when token changes
    const loadAndCacheData = async () => {
      if (token && isConnected) {
        try {
          await fetchAndCacheCommunities();
          await fetchAndCacheCourses();
          await fetchAndCacheCourseCategories();
          await fetchAndCacheTodayPlans(token, new Date());
          await fetchAndCacheCategoryNames(token);
          const communities = await getUserCommunities(token);
          for (const community of communities) {
            sendMessage({ type: "fetch_history", community_id: community.id });
          }
          await fetchInitialLastMessages();
        } catch (error) {
          console.error("Error during initial data load:", error);
        }
      }
    };

    loadAndCacheData();
  }, [
    token,
    isConnected,
    fetchAndCacheCommunities,
    fetchAndCacheCourses,
    fetchAndCacheCourseCategories,
    fetchAndCacheTodayPlans,
    fetchAndCacheCategoryNames,
    sendMessage,
    fetchInitialLastMessages,
  ]);

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
    getCachedCategoryNames,
    unreadCommunitiesCount,
    markMessageAsRead,
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
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};