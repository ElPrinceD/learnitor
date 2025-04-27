import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  FC,
  useRef,
} from "react";
import { SQLiteProvider, useSQLiteContext, SQLiteDatabase } from "expo-sqlite";
import {
  getCommunities,
  getCommunityDetails,
  getUserCommunities,
  getCommunityMessages,
} from "./CommunityApiCalls";
import * as Notifications from "expo-notifications";
import { Community } from "./components/types";
import { getCourseCategories, getCourses } from "./CoursesApiCalls";
import WsUrl from "./configWs";
import { getCategoryNames, getTodayPlans } from "./TimelineApiCalls";
import { useAuth } from "./components/AuthContext";

interface Task {
  id: number;
  title: string;
  due_date: string;
  due_time_start: string;
}


export interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinAndSubscribeToCommunity: (communityId: string) => Promise<void>;
  unsubscribeFromCommunity: (communityId: string) => void;
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
  unreadMessages: Record<string, number>;
  scheduleTaskNotification: (task: any) => Promise<string | null>;
  cancelTaskNotification: (taskId: string) => Promise<void>;
  storeNotificationId: (taskId: string, notificationId: string) => Promise<void>;
  getNotificationId: (taskId: string) => Promise<string | null>;
  markMessageAsRead: (communityId: string, messageId?: string) => void;
  sqliteGetItem: (key: string) => Promise<string | null>;
  sqliteSetItem: (key: string, value: string) => Promise<void>;
  sqliteRemoveItem: (key: string) => Promise<void>;
  sqliteClear: () => Promise<void>;
  setCurrentCommunity: (communityId: string | null) => void;
  communities: Community[] | null;
  refreshCommunities: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

export const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[] | null>(null);
  const { userToken, userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const db: SQLiteDatabase = useSQLiteContext();
  const messageQueue: any[] = [];
  const operationQueue = useRef<Promise<void>>(Promise.resolve());

  // Initialize SQLite tables
  useEffect(() => {
    db.execAsync(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        community_id TEXT,
        message_id TEXT,
        status TEXT,
        sender_id TEXT,
        PRIMARY KEY (community_id, message_id)
      );
    `).catch(console.error);
  }, [db]);

  // SQLite operation queue to prevent race conditions
  const enqueueSQLiteOperation = useCallback(async (operation: () => Promise<unknown>) => {
    const current = operationQueue.current;
    const next = current.then(async () => {
      try {
        await operation();
      } catch (error) {
        console.error("Error in SQLite operation:", error);
      }
    });
    operationQueue.current = next;
    await next;
  }, []);

  const sqliteSetItem = useCallback(
    async (key: string, value: string): Promise<void> => {
      await enqueueSQLiteOperation(() =>
        db.runAsync("INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?);", [key, value])
      );
    },
    [db, enqueueSQLiteOperation]
  );

  const sqliteGetItem = useCallback(
    async (key: string): Promise<string | null> => {
      let result: string | null = null;
      await enqueueSQLiteOperation(async () => {
        const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM storage WHERE key = ?;", [key]);
        result = row ? row.value : null;
      });
      return result;
    },
    [db, enqueueSQLiteOperation]
  );

  const sqliteClear = useCallback(async () => {
    await enqueueSQLiteOperation(() => db.runAsync("DELETE FROM storage"));
    await enqueueSQLiteOperation(() => db.runAsync("DELETE FROM messages"));
  }, [db, enqueueSQLiteOperation]);

  const sqliteRemoveItem = useCallback(
    async (key: string): Promise<void> => {
      await enqueueSQLiteOperation(() => db.runAsync("DELETE FROM storage WHERE key = ?;", [key]));
    },
    [db, enqueueSQLiteOperation]
  );

  const sqliteGetAllKeys = useCallback(
    async (): Promise<string[]> => {
      let results: string[] = [];
      await enqueueSQLiteOperation(async () => {
        const rows = await db.getAllAsync<{ key: string }>("SELECT key FROM storage;");
        results = rows.map((row) => row.key);
      });
      return results;
    },
    [db, enqueueSQLiteOperation]
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

  const updateUnreadCount = useCallback(
    async (communityId: string, delta: number = 0) => {
      setUnreadMessages((prev) => {
        const current = prev[communityId] ?? 0;
        const next   = Math.max(0, current + delta);
        // write it to SQLite immediately:
        sqliteSetItem(`unread_count_${communityId}`, JSON.stringify(next));
        return { ...prev, [communityId]: next };
      });
    },
    [sqliteSetItem]
  );
  

  const markMessageAsRead = useCallback(
    async (communityId: string, messageId?: string) => {
      if (!messageId) {
        await enqueueSQLiteOperation(() =>
          db.runAsync(
            "UPDATE messages SET status = 'read' WHERE community_id = ? AND status != 'read';",
            [communityId]
          )
        );
        await updateUnreadCount(communityId, -unreadMessages[communityId] || 0);
        socket?.send(JSON.stringify({
          type: "mark_all_read",
          community_id: communityId,
        }));
      } else {
        await enqueueSQLiteOperation(() =>
          db.runAsync(
            "UPDATE messages SET status = 'read' WHERE community_id = ? AND message_id = ? AND status != 'read';",
            [communityId, messageId]
          )
        );
        await updateUnreadCount(communityId, -1);
        socket?.send(JSON.stringify({
          type: "message_status_update",
          message_id: messageId,
          status: "read",
        }));
      }
      await loadUnreadCounts(); // Sync state with SQLite
    },
    [socket, updateUnreadCount, unreadMessages, enqueueSQLiteOperation, loadUnreadCounts]
  );

  const loadUnreadCounts = useCallback(async () => {
    const allKeys = await sqliteGetAllKeys();
    const unreadKeys = allKeys.filter((key) => key.startsWith("unread_count_"));
    const unreadCounts: Record<string, number> = {};
    for (const key of unreadKeys) {
      const communityId = key.replace("unread_count_", "");
      const countStr = await sqliteGetItem(key);
      if (countStr) {
        unreadCounts[communityId] = JSON.parse(countStr);
      }
    }
    setUnreadMessages(unreadCounts);
  }, [sqliteGetAllKeys, sqliteGetItem]);

  const fetchAndCacheCommunitiesFn = useCallback(async () => {
    if (token && isConnected) {
      try {
        let leftCommunityIds = await sqliteGetItem("leftCommunityIds");
        leftCommunityIds = leftCommunityIds ? JSON.parse(leftCommunityIds) : [];

        let cachedCommunities = await sqliteGetItem("communities");
        if (!cachedCommunities || JSON.parse(cachedCommunities).length === 0) {
          const communities = await getUserCommunities(token);
          const filtered = communities.filter((c: any) => !leftCommunityIds.includes(c.id.toString()));
          await sqliteSetItem("communities", JSON.stringify(filtered));
          setCommunities(filtered);
          console.log("Communities fetched and cached.");
        } else {
          const communities = JSON.parse(cachedCommunities);
          const filtered = communities.filter((c: any) => !leftCommunityIds.includes(c.id.toString()));
          await sqliteSetItem("communities", JSON.stringify(filtered));
          setCommunities(filtered);
          console.log("Cached communities updated after filtering left communities.");
        }
      } catch (error) {
        console.error("Failed to fetch or cache communities:", error);
      }
    } else {
      console.warn("WebSocket not connected, skipping community fetch.");
    }
  }, [token, isConnected, sqliteGetItem, sqliteSetItem]);

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (socket && isConnected && token) {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {
          await subscribeToExistingCommunity(community.id.toString());
        }
      } catch (error) {
        console.error("Error fetching user communities:", error);
      }
    }
  }, [socket, isConnected, token]);

  const subscribeToExistingCommunity = useCallback(
    async (communityId: string) => {
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
    [socket, isConnected]
  );

  const updateCachedCommunitiesFn = async (communityId: string) => {
    if (token && isConnected) {
      try {
        const newCommunity = await getCommunityDetails(communityId, token);
        await sqliteSetItem(`community_${communityId}`, JSON.stringify(newCommunity));
        const cachedCommunitiesRaw = await sqliteGetItem("communities");
        let cachedCommunities = cachedCommunitiesRaw ? JSON.parse(cachedCommunitiesRaw) : [];
        const communityIndex = cachedCommunities.findIndex((comm: any) => comm.id.toString() === communityId);
        if (communityIndex !== -1) {
          cachedCommunities[communityIndex] = newCommunity;
        } else {
          cachedCommunities.push(newCommunity);
        }
        await sqliteSetItem("communities", JSON.stringify(cachedCommunities));
        setCommunities(cachedCommunities);
      } catch (error) {
        console.error("Error updating cached communities:", error);
      }
    }
  };

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
      loadUnreadCounts().catch(console.error);
      fetchAndCacheCommunitiesFn().catch(console.error); // Fetch latest communities on reconnect
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "message": {
          const keyMessages = `messages_${data.community_id}`;
          const cachedMessages = await sqliteGetItem(keyMessages);
          const updatedMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
          const newMessage = {
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
          };
          updatedMessages.push(newMessage);
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
            await enqueueSQLiteOperation(() =>
              db.runAsync(
                "INSERT OR REPLACE INTO messages (community_id, message_id, status, sender_id) VALUES (?, ?, ?, ?);",
                [data.community_id, data.id.toString(), data.status || "sent", data.sender_id]
              )
            );
            if (data.community_id === currentCommunityId) {
              await markMessageAsRead(data.community_id, data.id.toString());
            } else {
              await updateUnreadCount(data.community_id, 1);
            }
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

            for (const msg of data.messages) {
              if (userId && msg.sender_id !== userId) {
                await enqueueSQLiteOperation(() =>
                  db.runAsync(
                    "INSERT OR REPLACE INTO messages (community_id, message_id, status, sender_id) VALUES (?, ?, ?, ?);",
                    [data.community_id, msg.id.toString(), msg.status || "sent", msg.sender_id]
                  )
                );
              }
            }

            const unreadCountResult = await db.getFirstAsync<{ count: number }>(
              "SELECT COUNT(*) as count FROM messages WHERE community_id = ? AND status != 'read' AND sender_id != ?;",
              [data.community_id, userId || ""]
            );
            const unreadCount = unreadCountResult?.count || 0;
            await updateUnreadCount(data.community_id, unreadCount - (unreadMessages[data.community_id] || 0));
          }
          break;
        }
        case "message_status": {
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            await enqueueSQLiteOperation(() =>
              db.runAsync(
                "UPDATE messages SET status = ? WHERE community_id = ? AND message_id = ?;",
                [data.status, communityId, messageId]
              )
            );

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
              }
            }

            if (data.status === "read") {
              await updateUnreadCount(communityId, -1);
            }
          }
          break;
        }
        case "community_updated": {
          console.log("Received community_updated event:", data);
          const updatedCommunity = data.community;
          if (!updatedCommunity?.id) {
            console.error("Invalid community_updated message: missing id");
            break;
          }
          const communityId = updatedCommunity.id.toString();
          console.log(`Updating cache for community ${communityId}`);
          await sqliteSetItem(`community_${communityId}`, JSON.stringify(updatedCommunity));
          const cachedCommunitiesRaw = await sqliteGetItem("communities");
          let cachedCommunities = cachedCommunitiesRaw ? JSON.parse(cachedCommunitiesRaw) : [];
          const communityIndex = cachedCommunities.findIndex((comm: any) => comm.id.toString() === communityId);
          if (communityIndex !== -1) {
            console.log(`Updating existing community at index ${communityIndex}`);
            cachedCommunities[communityIndex] = updatedCommunity;
          } else {
            console.log(`Adding new community ${communityId}`);
            cachedCommunities.push(updatedCommunity);
          }
          await sqliteSetItem("communities", JSON.stringify(cachedCommunities));
          setCommunities(cachedCommunities);
          console.log(`Updated cache and state for community ${communityId}:`, cachedCommunities);
          break;
        }
        case "error": {
          console.error("WebSocket error from server:", data.message);
          break;
        }
        case "join_success":
          break;
      }
    };

    ws.onclose = (event: CloseEvent) => {
      reconnectWebSocket();
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

  const loadCachedCommunities = useCallback(async () => {
    try {
      const cachedCommunities = await sqliteGetItem("communities");
      if (cachedCommunities) {
        setCommunities(JSON.parse(cachedCommunities));
      }
    } catch (error) {
      console.error("Error loading cached communities:", error);
    }
  }, [sqliteGetItem]);

  useEffect(() => {

      console.log('Here: ',loadUnreadCounts)
    loadCachedCommunities();
  }, [loadCachedCommunities]);

  const refreshCommunities = useCallback(async () => {
    try {
      const cachedCommunities = await sqliteGetItem("communities");
      if (cachedCommunities) {
        setCommunities(JSON.parse(cachedCommunities));
      }
    } catch (error) {
      console.error("Error refreshing communities:", error);
    }
  }, [sqliteGetItem]);

 

  const reconnectWebSocket = useCallback(() => {
    const initialBackoffMs = 1000;
    const maxBackoffMs = 300000;
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
              const content = message.content || {};
              await sendMessage({
                type: "send_message",
                community_id: message.communityId,
                message: content.text || "",
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

  const getCommunityIdFromMessage = async (messageId: string) => {
    const allKeys = await sqliteGetAllKeys();
    const messageKeys = allKeys.filter((key) => key.startsWith("messages_"));
    const multi = await sqliteMultiGet(messageKeys);
    for (const [key, messages] of multi) {
      if (messages) {
        const parsedMessages = JSON.parse(messages);
        if (parsedMessages.some((msg: any) => msg._id === messageId)) {
          return key.split("_")[1];
        }
      }
    }
    return null;
  };

  const setCurrentCommunity = (communityId: string | null) => {
    setCurrentCommunityId(communityId);
    if (communityId) {
      markMessageAsRead(communityId);
    }
  };

  const joinAndSubscribeToCommunity = useCallback(
    (communityId: string) => {
      return new Promise<void>((resolve, reject) => {
        if (socket && isConnected) {
          try {
            const message = { type: "join_community", community_id: communityId };
            socket.send(JSON.stringify(message));
            const handleJoinSuccess = (event: MessageEvent) => {
              const data = JSON.parse(event.data);
              if (data.type === "join_success" && data.community_id.toString() === communityId) {
                console.log(`Successfully joined community: ${communityId}`);
                socket.removeEventListener("message", handleJoinSuccess);
                resolve();
              }
            };
            socket.addEventListener("message", handleJoinSuccess);
            // Timeout to prevent hanging
            setTimeout(() => {
              socket.removeEventListener("message", handleJoinSuccess);
              reject(new Error("Timeout waiting for join_success"));
            }, 10000); // 10 seconds timeout
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("WebSocket is not connected."));
        }
      });
    },
    [socket, isConnected]
  );

  const unsubscribeFromCommunity = useCallback(
    (communityId: string) => {
      if (socket && isConnected) {
        sendMessage({ type: "leave_community", community_id: communityId });
      } else {
        console.error("WebSocket is not connected.");
      }
    },
    [socket, isConnected, sendMessage]
  );

  const fetchAndCacheCommunities = fetchAndCacheCommunitiesFn;

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
  }, [token, isConnected, sqliteGetItem, sqliteSetItem]);

  const fetchAndCacheCourses = fetchAndCacheCoursesFn;

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
  }, [token, isConnected, sqliteGetItem, sqliteSetItem]);

  const fetchAndCacheTodayPlans = useCallback(
    async (token: string | null, date: Date | null, category?: string) => {
      if (token && isConnected && date) {
        try {
          const dateString = date.toISOString().split("T")[0];
          const normalizedCategory = category || "all";
          const cacheKey = `todayPlans_${dateString}_${normalizedCategory}`;
          const cachedPlans = await sqliteGetItem(cacheKey);
          if (cachedPlans) {
            return JSON.parse(cachedPlans);
          }
          const plans = await getTodayPlans(token, date, normalizedCategory === "all" ? undefined : normalizedCategory);
          await sqliteSetItem(cacheKey, JSON.stringify(plans));
          return plans;
        } catch (error) {
          console.error("Failed to fetch or cache today's plans:", error);
          throw error;
        }
      }
      return [];
    },
    [isConnected, sqliteGetItem, sqliteSetItem]
  );

  const getCachedTodayPlans = useCallback(
    async (date: Date, category?: string) => {
      const dateString = date.toISOString().split("T")[0];
      const normalizedCategory = category || "all";
      const cacheKey = `todayPlans_${dateString}_${normalizedCategory}`;
      const cachedData = await sqliteGetItem(cacheKey);
      return cachedData ? JSON.parse(cachedData) : [];
    },
    [sqliteGetItem]
  );

  const fetchAndCacheCategoryNames = useCallback(
    async (token: string | null) => {
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
      return {};
    },
    [isConnected, sqliteGetItem, sqliteSetItem]
  );

  const getCachedCategoryNames = useCallback(async (): Promise<Record<number, string>> => {
    const cachedData = await sqliteGetItem("categoryNames");
    return cachedData ? JSON.parse(cachedData) : {};
  }, [sqliteGetItem]);

  const scheduleTaskNotification = useCallback(async (task: Task): Promise<string | null> => {
    try {
      const [year, month, day] = task.due_date.split("-").map(Number);
      const [hours, minutes] = task.due_time_start.split(":").map(Number);
      const triggerDate = new Date(year, month - 1, day, hours, minutes);

      if (triggerDate <= new Date()) {
        console.log(`Task ${task.id} is in the past, skipping notification`);
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Plan Reminder",
          body: `${task.title} is due now!`,
          data: { taskId: task.id },
          sound: "default",
        },
        trigger: triggerDate,
      });

      console.log(`Scheduled notification for task ${task.id} at ${triggerDate.toISOString()}`);
      return notificationId;
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      return null;
    }
  }, []);

  const cancelTaskNotification = useCallback(async (taskId: string): Promise<void> => {
    try {
      const notificationId = await sqliteGetItem(`notification_${taskId}`);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await sqliteRemoveItem(`notification_${taskId}`);
        console.log(`Canceled notification for task ${taskId}`);
      }
    } catch (error) {
      console.error("Failed to cancel notification:", error);
    }
  }, [sqliteGetItem, sqliteRemoveItem]);

  const storeNotificationId = useCallback(
    async (taskId: string, notificationId: string): Promise<void> => {
      await sqliteSetItem(`notification_${taskId}`, notificationId);
      console.log(`Stored notification ID ${notificationId} for task ${taskId}`);
    },
    [sqliteSetItem]
  );

  const getNotificationId = useCallback(
    async (taskId: string): Promise<string | null> => {
      return await sqliteGetItem(`notification_${taskId}`);
    },
    [sqliteGetItem]
  );

  useEffect(() => {
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
            sendMessage({ type: "fetch_history", community_id: community.id.toString() });
          }
          await loadUnreadCounts();
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
    loadUnreadCounts,
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
    scheduleTaskNotification,
    cancelTaskNotification,
    storeNotificationId,
    getNotificationId,
    fetchAndCacheTodayPlans,
    fetchAndCacheCategoryNames,
    getCachedTodayPlans,
    getCachedCategoryNames,
    unreadMessages,
    loadUnreadCounts,
    markMessageAsRead,
    sqliteGetItem,
    sqliteSetItem,
    sqliteRemoveItem,
    sqliteClear,
    setCurrentCommunity,
    communities,
    refreshCommunities,
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