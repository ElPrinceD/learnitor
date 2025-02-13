import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  FC,
} from "react";
import * as SQLite from "expo-sqlite";
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
import db from "./Database";
import { 
  Category, 
  Course, 
  User, 
  Message, 
  Community, 
  Plan 
} from "./components/types"; // Assuming your types are exported from a file named 'types'

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
    category?: number
  ) => Promise<Plan[]>;
  fetchAndCacheCategoryNames: (
    token: string | null
  ) => Promise<Record<number, string>>;
  getCachedTodayPlans: (date: Date, category?: number) => Promise<Plan[]>;
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
    Record<string, Message>
  >({});
  const { userToken, userInfo } = useAuth();
  const userId = userInfo?.user?.id;

  const messageQueue: any[] = [];

  const connectWebSocket = useCallback(() => {
    if (!token || socket) return; 

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
          const newMessage: Message = {
            id: data.id,
            community: data.community_id,
            sender: data.sender_id,
            message: data.message,
            sent_at: data.sent_at,
          };
          await db.insertOrUpdateMessage(newMessage);

          await db.insertOrUpdateLastMessage(data.community_id, newMessage);
          if (userId && data.sender_id !== userId) {
            setUnreadCommunityMessages((prev) => ({
              ...prev,
              [data.community_id]: newMessage,
            }));
          }
          break;
        case "history":
          for (const msg of data.messages) {
            const message: Message = {
              id: msg.id,
              community: data.community_id,
              sender: msg.sender_id,
              message: msg.message,
              sent_at: msg.sent_at,
            };
            await db.insertOrUpdateMessage(message);
          }
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            await db.insertOrUpdateLastMessage(data.community_id, {
              id: lastMessage.id,
              community: data.community_id,
              sender: lastMessage.sender_id,
              message: lastMessage.message,
              sent_at: lastMessage.sent_at,
            });
            if (userId && lastMessage.sender_id !== userId) {
              setUnreadCommunityMessages((prev) => ({
                ...prev,
                [data.community_id]: lastMessage,
              }));
            }
          }
          break;
        case "message_status":
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            await db.insertOrUpdateMessage({
              id: messageId,
              community: communityId,
              sender: data.sender_id,
              message: '', // We're only updating status here
              sent_at: '', // Assuming no change in sent_at
              status: data.status,
            });
            const lastMessage = await db.getLastMessage(communityId);
            if (lastMessage && lastMessage.id === messageId) {
              await db.insertOrUpdateLastMessage(communityId, {
                ...lastMessage,
                status: data.status,
              });
              if (userId && data.sender_id !== userId) {
                setUnreadCommunityMessages((prev) => ({
                  ...prev,
                  [communityId]: {
                    ...lastMessage,
                    status: data.status,
                  },
                }));
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
    if (!token || socket) return; 
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
          const unsentMessages = await db.db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM messages WHERE status = ?',
              ['pending'],
              (_, { rows }) => rows._array
            );
          });
          
          for (const message of unsentMessages) {
            await sendMessage({
              type: "send_message",
              community_id: message.community,
              message: message.message,
              sender: message.sender,
              sender_id: message.sender,
              temp_id: message.id,
            });
            
            // Update message status to 'sending' in the database
            await db.insertOrUpdateMessage({
              ...message,
              status: 'sending',
            });
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
        const lastMessage = await db.getLastMessage(community.id);
        if (!lastMessage) {
          sendMessage({ type: "fetch_history", community_id: community.id });
        } else if (userId && lastMessage.sender !== userId) {
          setUnreadCommunityMessages((prev) => ({
            ...prev,
            [community.id]: lastMessage,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching initial last messages:", error);
    }
  }, [token, isConnected, sendMessage, userId]);

  const getCommunityIdFromMessage = async (messageId: number) => {
    const messages = await db.db.transaction(tx => {
      tx.executeSql(
        'SELECT community FROM messages WHERE id = ?',
        [messageId],
        (_, { rows }) => rows.length > 0 ? rows.item(0).community : null
      );
    });
    return messages;
  };

  // Calculate unread communities count
  const unreadCommunitiesCount = Object.values(unreadCommunityMessages).filter(
    (message) => message.status !== "read"
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

      // Update SQLite to persist this status
      const lastMessage = await db.getLastMessage(communityId);
      if (lastMessage) {
        await db.insertOrUpdateLastMessage(communityId, {
          ...lastMessage,
          status: "read",
        });

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
    async (token: string, date: Date, category?: number) => {
      if (token && isConnected) {
        try {
          const dateString = date.toISOString().split("T")[0];
          const plans = await getTodayPlans(token, date, category);
          for (const plan of plans) {
            await db.insertOrUpdatePlan({
              id: plan.id,
              title: plan.title,
              description: plan.description,
              due_date: plan.due_date,
              due_time_start: plan.due_time_start,
              due_time_end: plan.due_time_end,
              category: plan.category,
            });
          }
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
          const categories = await getCategoryNames(token);
          await db.db.transaction(tx => {
            Object.entries(categories).forEach(([id, name]) => {
              tx.executeSql('INSERT OR REPLACE INTO plans (id, planData) VALUES (?, ?)', [id, JSON.stringify({ name })]);
            });
          });
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
    async (date: Date, category?: number): Promise<Plan[]> => {
      const dateString = date.toISOString().split("T")[0];
      const plans = await db.getPlansByDate(dateString);
      return plans.filter(plan => plan.category === (category || 0));
    },
    []
  );

  const getCachedCategoryNames = useCallback(
    async (): Promise<Record<number, string>> => {
      const categories = await db.db.transaction(tx => {
        return tx.executeSql('SELECT * FROM plans', [], (_, { rows }) => {
          const result = {};
          rows._array.forEach(row => {
            result[row.id] = JSON.parse(row.planData).name;
          });
          return result;
        });
      });
      return categories;
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
        await db.insertOrUpdateCommunity(newCommunity);
      } catch (error) {
        console.error("Error updating cached communities:", error);
      }
    }
  };

  const fetchAndCacheCommunities = useCallback(async () => {
    if (token && isConnected) {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {
          await db.insertOrUpdateCommunity(community);
        }
        console.log("Communities fetched and cached.");
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
        const courses = await getCourses(token);
        for (const course of courses) {
          await db.insertOrUpdateCourse(course);
        }
        console.log("Courses fetched and cached.");
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
        const categories = await getCourseCategories(token);
        for (const category of categories) {
          await db.db.transaction(tx => {
            tx.executeSql('INSERT OR REPLACE INTO course_categories (id, name) VALUES (?, ?)', [category.id, category.name]);
          });
        }
        console.log("Course categories fetched and cached.");
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
    const loadAndCacheData = async () => {
      if (token && isConnected) {
        try {
          await db.initDatabase();
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