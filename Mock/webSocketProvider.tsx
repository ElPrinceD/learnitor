import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  FC,
} from "react";
import { SQLiteProvider, useSQLiteContext, SQLiteDatabase } from "expo-sqlite";
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

// ----- WebSocket Context Types -----
export interface WebSocketContextType {
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
  fetchAndCacheCategoryNames: (token: string | null) => Promise<Record<number, string>>;
  getCachedTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  getCachedCategoryNames: () => Promise<Record<number, string>>;
  unreadCommunitiesCount: number;
  markMessageAsRead: (communityId: string) => void;
  sqliteGetItem: (key: string) => Promise<string | null>; // Add this
  sqliteSetItem: (key: string, value: string) => Promise<void>;
  sqliteRemoveItem: (key: string) => Promise<void>;
  sqliteClear: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

// ----- WebSocketProvider Component -----
export const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, any>>({});
  const { userToken, userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const messageQueue: any[] = [];

  // Get the SQLite database instance from the context.
  const db: SQLiteDatabase = useSQLiteContext();

  // Initialize our key–value storage table on mount.
  useEffect(() => {
    db.execAsync(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `).catch(console.error);
  }, [db]);

  // ----- SQLite Helper Functions -----
  const sqliteSetItem = useCallback(
    async (key: string, value: string): Promise<void> => {
      await db.runAsync("INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?);", [key, value]);
    },
    [db]
  );

  const sqliteGetItem = useCallback(
    async (key: string): Promise<string | null> => {
      const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM storage WHERE key = ?;", [key]);
      return row ? row.value : null;
    },
    [db]
  );

  const sqliteClear = useCallback(async () => {
    await db.runAsync("DELETE FROM storage");
  }, [db]);

  const sqliteRemoveItem = useCallback(
    async (key: string): Promise<void> => {
      await db.runAsync("DELETE FROM storage WHERE key = ?;", [key]);
    },
    [db]
  );

  const sqliteGetAllKeys = useCallback(
    async (): Promise<string[]> => {
      const rows = await db.getAllAsync<{ key: string }>("SELECT key FROM storage;");
      return rows.map((row) => row.key);
    },
    [db]
  );

  const sqliteMultiGet = useCallback(
    async (keys: string[]): Promise<[string, string | null][]> => {
      const results: [string, string | null][] = [];
      for (const key of keys) {
        const value = await sqliteGetItem(key);
        results.push([key, value]);
      }
      return results;
    },
    [sqliteGetItem]
  );

  // ----- WebSocket Connection and Message Handling -----
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
        case "message": {
          const keyMessages = `messages_${data.community_id}`;
          const cachedMessages = await sqliteGetItem(keyMessages);
          const updatedMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
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
          await sqliteSetItem(keyMessages, JSON.stringify(updatedMessages));

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
          await sqliteSetItem(`last_message_${data.community_id}`, JSON.stringify(newLastMessage));
          if (userId && data.sender_id !== userId) {
            setUnreadCommunityMessages((prev) => ({
              ...prev,
              [data.community_id]: newLastMessage,
            }));
          }
          break;
        }
        case "history": {
          const normalizedMessages = data.messages.map((msg: any) => ({
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
          await sqliteSetItem(`messages_${data.community_id}`, JSON.stringify(normalizedMessages));
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            await sqliteSetItem(
              `last_message_${data.community_id}`,
              JSON.stringify({
                ...lastMessage,
                sent_at: new Date(lastMessage.sent_at).toISOString(),
                status: lastMessage.status || "sent",
                replyTo: lastMessage.reply_to
                  ? {
                      id: lastMessage.reply_to.id ? lastMessage.reply_to.id.toString() : null,
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
                        id: lastMessage.reply_to.id ? lastMessage.reply_to.id.toString() : null,
                        snippet: lastMessage.reply_to.snippet || null,
                        sender_name: lastMessage.reply_to.sender_name || null,
                      }
                    : null,
                },
              }));
            }
          }
          break;
        }
        case "message_status": {
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            const messagesStr = await sqliteGetItem(`messages_${communityId}`);
            if (messagesStr) {
              let parsedMessages = JSON.parse(messagesStr);
              const messageIndex = parsedMessages.findIndex((msg: any) => msg._id === messageId.toString());
              if (messageIndex !== -1) {
                parsedMessages[messageIndex].status = data.status;
                await sqliteSetItem(`messages_${communityId}`, JSON.stringify(parsedMessages));
              }
            }
            const lastMessageStr = await sqliteGetItem(`last_message_${communityId}`);
            if (lastMessageStr) {
              let parsedLastMessage = JSON.parse(lastMessageStr);
              if (parsedLastMessage.id === messageId) {
                parsedLastMessage.status = data.status;
                await sqliteSetItem(`last_message_${communityId}`, JSON.stringify(parsedLastMessage));
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
        }
        case "join_success":
          // Optionally handle join success events here.
          break;
      }
    };

    ws.onclose = (event: CloseEvent) => {
      console.log("WebSocket disconnected");
      console.log("Close event code:", event?.code);
      console.log("Close event reason:", event?.reason);
      setIsConnected(false);
      if (reconnectAttempts > 3) {
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
    let backoff = Math.min(maxBackoffMs, initialBackoffMs * Math.pow(backoffMultiplier, attempt));
    backoff += Math.random() * 1000;
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
          const allKeys = await sqliteGetAllKeys();
          const unsentKeys = allKeys.filter((key) => key.startsWith("unsent_message_"));
          for (const key of unsentKeys) {
            const json = await sqliteGetItem(key);
            if (json) {
              const message = JSON.parse(json);
              const content = message.content || {}; // Default to empty object if content is missing
              await sendMessage({
                type: "send_message",
                community_id: message.communityId,
                message: content.text || "", // Fallback to empty string if text is undefined
                sender: message.user.name,
                sender_id: message.user._id,
                temp_id: message._id,
                ...(message.replyTo && { reply_to: message.replyTo }),
                image: content.image || undefined,
                document: content.document || undefined,
              });
              await sqliteRemoveItem(key);
            }
          }
        } catch (error) {
          console.error("Error resending unsent messages: ", error);
        }
      };
      resendUnsentMessages();
    }
  }, [isConnected, sendMessage, sqliteGetAllKeys, sqliteGetItem, sqliteRemoveItem]);

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token || !isConnected) return;
    try {
      const communities = await getUserCommunities(token);
      for (const community of communities) {
        const cachedLastMessage = await sqliteGetItem(`last_message_${community.id}`);
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
    const allKeys = await sqliteGetAllKeys();
    const messageKeys = allKeys.filter((key) => key.startsWith("messages_"));
    const multi = await sqliteMultiGet(messageKeys);
    for (const [key, messages] of multi) {
      if (messages) {
        const parsedMessages = JSON.parse(messages);
        if (parsedMessages.some((msg: any) => msg._id === messageId)) {
          return key.split("_")[1]; // Extract community_id from the key
        }
      }
    }
    return null;
  };

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
      const lastMessageStr = await sqliteGetItem(`last_message_${communityId}`);
      if (lastMessageStr) {
        const lastMessage = JSON.parse(lastMessageStr);
        await sqliteSetItem(`last_message_${communityId}`, JSON.stringify({
          ...lastMessage,
          status: "read",
        }));
        socket?.send(
          JSON.stringify({
            type: "message_status_update",
            message_id: lastMessage.id,
            status: "read",
          })
        );
      }
    },
    [socket]
  );

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected) {
        try {
          const message = { type: "join_community", community_id: communityId };
          socket.send(JSON.stringify(message));
          const handleJoinSuccess = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "join_success" && data.community_id === communityId) {
              console.log(`Successfully joined community: ${communityId}`);
              socket.removeEventListener("message", handleJoinSuccess);
            }
          };
          socket.addEventListener("message", handleJoinSuccess);
          await updateCachedCommunitiesFn(communityId);
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

  // Renamed to updateCachedCommunitiesFn to avoid duplication errors.
  const updateCachedCommunitiesFn = async (communityId: string | number) => {
    if (token && isConnected) {
      try {
        const newCommunity = await getCommunityDetails(communityId, token);
        let cachedCommunities = await sqliteGetItem("communities");
        let communities = cachedCommunities ? JSON.parse(cachedCommunities) : [];
        if (!communities.some((c: any) => c.id === communityId)) {
          communities.push(newCommunity);
          await sqliteSetItem("communities", JSON.stringify(communities));
        }
      } catch (error) {
        console.error("Error updating cached communities:", error);
      }
    }
  };

  // Renamed to fetchAndCacheCommunitiesFn to avoid duplication errors.
  const fetchAndCacheCommunitiesFn = useCallback(async () => {
    if (token && isConnected) {
      try {
        let cachedCommunities = await sqliteGetItem("communities");
        if (!cachedCommunities || JSON.parse(cachedCommunities).length === 0) {
          const communities = await getUserCommunities(token);
          await sqliteSetItem("communities", JSON.stringify(communities));
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

  // Renamed to fetchAndCacheCoursesFn to avoid duplication errors.
  const fetchAndCacheCoursesFn = useCallback(async () => {
    if (token && isConnected) {
      try {
        let cachedCourses = await sqliteGetItem("courses");
        if (!cachedCourses || JSON.parse(cachedCourses).length === 0) {
          const courses = await getCourses(token);
          await sqliteSetItem("courses", JSON.stringify(courses));
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
        let cachedCategories = await sqliteGetItem("courseCategories");
        if (!cachedCategories || JSON.parse(cachedCategories).length === 0) {
          const categories = await getCourseCategories(token);
          await sqliteSetItem("courseCategories", JSON.stringify(categories));
          console.log("Course categories fetched and cached.");
        } else {
          console.log("Course categories already cached.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache course categories:", error);
      }
    } else {
      console.warn("WebSocket not connected, skipping course categories fetch.");
    }
  }, [token, isConnected]);

  const fetchAndCacheTodayPlans = useCallback(
    async (token: string, date: Date, category?: string) => {
      if (token && isConnected) {
        try {
          const dateString = date.toISOString().split("T")[0];
          const cacheKey = `todayPlans_${dateString}_${category || "all"}`;
          const cachedPlans = await sqliteGetItem(cacheKey);
          if (cachedPlans) {
            return JSON.parse(cachedPlans);
          }
          const plans = await getTodayPlans(token, date, category);
          await sqliteSetItem(cacheKey, JSON.stringify(plans));
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
          const cachedCategories = await sqliteGetItem("categoryNames");
          if (cachedCategories) {
            return JSON.parse(cachedCategories);
          }
          const categories = await getCategoryNames(token);
          await sqliteSetItem("categoryNames", JSON.stringify(categories));
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
      const cachedData = await sqliteGetItem(cacheKey);
      return cachedData ? JSON.parse(cachedData) : [];
    },
    []
  );

  const getCachedCategoryNames = useCallback(async (): Promise<Record<number, string>> => {
    const cachedData = await sqliteGetItem("categoryNames");
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

  const subscribeToExistingCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected) {
        try {
          sendMessage({
            type: "subscribe_existing",
            community_id: communityId,
          });
          await updateCachedCommunitiesFn(communityId);
        } catch (error) {
          console.error("Failed to subscribe to existing community:", error);
        }
      }
    },
    [socket, isConnected, sendMessage]
  );

  const fetchAndCacheCommunities = fetchAndCacheCommunitiesFn; // alias for context
  const fetchAndCacheCourses = fetchAndCacheCoursesFn; // alias for context

  useEffect(() => {
    const loadAndCacheData = async () => {
      if (token && isConnected) {
        try {
          await fetchAndCacheCommunitiesFn();
          await fetchAndCacheCoursesFn();
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
    fetchAndCacheCommunitiesFn,
    fetchAndCacheCoursesFn,
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
    sqliteGetItem, // Add this
    sqliteSetItem,
    sqliteRemoveItem,
    sqliteClear,
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
