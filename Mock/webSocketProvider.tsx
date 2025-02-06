import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import SQLite from 'react-native-sqlite-storage';
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

// Initialize SQLite
SQLite.enablePromise(true);

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
  fetchAndCacheTodayPlans: (token: string, date: Date, category?: string) => Promise<any[]>;
  fetchAndCacheCategoryNames: (token: string) => Promise<Record<number, string>>;
  getCachedTodayPlans: (date: Date, category?: string) => Promise<any[]>;
  getCachedCategoryNames: () => Promise<Record<number, string>>;
  unreadCommunitiesCount: number;
  markMessageAsRead: (communityId: string) => void;
  fetchMessagesPage: (communityId: string, page?: number, pageSize?: number, before?: string) => Promise<any[]>;
  db: SQLite.SQLiteDatabase | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, any>>({});

  const { userToken, userInfo } = useAuth();
  const userId = userInfo?.user?.id;

  const messageQueue: any[] = [];
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  const initializeDB = useCallback(async () => {
    try {
      const newDb = await new Promise<SQLite.SQLiteDatabase>((resolve, reject) => {
        const db = SQLite.openDatabase(
          { name: "messages.db", location: "default" },
          () => {
            console.log("Database opened");
            resolve(db);
          },
          (error) => {
            console.error("Database error:", error);
            reject(error);
          }
        );
      });
      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          community_id TEXT NOT NULL,
          message TEXT,
          sent_at TIMESTAMP NOT NULL,
          sender_id TEXT,
          sender TEXT,
          sender_image TEXT,
          status TEXT,
          reply_to_id TEXT,
          reply_to_snippet TEXT,
          reply_to_sender_id TEXT,
          image TEXT,
          document TEXT,
          video TEXT,
          FOREIGN KEY (community_id) REFERENCES communities(id)
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS communities (
          id TEXT PRIMARY KEY,
          name TEXT,
          image_url TEXT,
          members_count INTEGER,
          shareable_link TEXT
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS last_messages (
          community_id TEXT PRIMARY KEY,
          message_id TEXT,
          message TEXT,
          sent_at TIMESTAMP,
          sender_id TEXT,
          sender TEXT,
          sender_image TEXT,
          status TEXT,
          reply_to_id TEXT,
          reply_to_snippet TEXT,
          reply_to_sender_name TEXT
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          category_id INTEGER,
          description TEXT
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS course_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          category TEXT,
          title TEXT,
          description TEXT,
          due_date TEXT,
          due_time TEXT
        )
      `);

      await newDb.executeSql(`
        CREATE TABLE IF NOT EXISTS category_names (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        )
      `);

      await newDb.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at)');
      await newDb.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id)');

      setDb(newDb);
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }, []);

  useEffect(() => {
    initializeDB();
    if (token) {
      connectWebSocket();
    }
  }, [token, initializeDB]);

  // Reconnect logic
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
  }, [reconnectAttempts]);

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
          await handleMessageUpdate(data);
          break;
        case "history":
          await handleHistoryUpdate(data);
          break;
        case "message_status":
          await handleMessageStatusUpdate(data);
          break;
        // ... handle other message types ...
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
    if (socket && isConnected && messageQueue.length > 0) {
      console.log("Sending queued messages.");
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        socket.send(JSON.stringify(msg));
      }
    }
  }, [socket, isConnected]);

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token || !isConnected || !db) return;
    try {
      const communities = await getUserCommunities(token);
      for (const community of communities) {
        const [results] = await db.executeSql('SELECT * FROM last_messages WHERE community_id = ?', [community.id]);
        if (results.rows.length === 0) {
          sendMessage({ type: "fetch_history", community_id: community.id });
        } else if (userId && results.rows.item(0).sender_id !== userId) {
          setUnreadCommunityMessages((prev) => ({
            ...prev,
            [community.id]: results.rows.item(0),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching initial last messages:", error);
    }
  }, [token, isConnected, sendMessage, userId, db]);

  const handleMessageUpdate = useCallback(async (data: any) => {
    if (!db) return;
    const now = new Date().toISOString();
    await db.executeSql(`
      INSERT INTO messages (community_id, message, sent_at, sender_id, sender, sender_image, status, reply_to_id, reply_to_snippet, reply_to_sender_id, image, document, video)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.community_id, data.message, now, data.sender_id, data.sender, data.sender_image, "sent", data.reply_to?.id, data.reply_to?.snippet, data.reply_to?.sender_id, data.image, data.document, data.video]);

    // Update last message for the community
    await db.executeSql(`
      INSERT OR REPLACE INTO last_messages (community_id, message_id, message, sent_at, sender_id, sender, sender_image, status, reply_to_id, reply_to_snippet, reply_to_sender_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.community_id, data.id, data.message, now, data.sender_id, data.sender, data.sender_image, "sent", data.reply_to?.id, data.reply_to?.snippet, data.reply_to?.sender_name]);

    if (userId && data.sender_id !== userId) {
      setUnreadCommunityMessages((prev) => ({
        ...prev,
        [data.community_id]: data,
      }));
    }
  }, [userId, db]);

  const handleHistoryUpdate = useCallback(async (data: any) => {
    if (!db) return;
    for (const message of data.messages) {
      await handleMessageUpdate(message);
    }
  }, [handleMessageUpdate, db]);

  const handleMessageStatusUpdate = useCallback(async (data: any) => {
    if (!db) return;
    await db.executeSql('UPDATE messages SET status = ? WHERE id = ?', [data.status, data.message_id]);
    await db.executeSql('UPDATE last_messages SET status = ? WHERE message_id = ?', [data.status, data.message_id]);
  }, [db]);

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected && db) {
        try {
          sendMessage({ type: "join_community", community_id: communityId });
          await updateCachedCommunities(communityId);
        } catch (error) {
          console.error("Failed to join community:", error);
        }
      }
    },
    [socket, isConnected, sendMessage, db]
  );

  const unsubscribeFromCommunity = useCallback(
    (communityId: string | number) => {
      if (socket && isConnected) {
        sendMessage({ type: "leave_community", community_id: communityId });
        // Mark community as inactive or remove from local storage
      }
    },
    [socket, isConnected, sendMessage]
  );

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (socket && isConnected && token && db) {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {
          await subscribeToExistingCommunity(community.id);
        }
      } catch (error) {
        console.error("Error fetching user communities:", error);
      }
    }
  }, [socket, isConnected, token, db]);

  const subscribeToExistingCommunity = useCallback(
    async (communityId: string | number) => {
      if (socket && isConnected && db) {
        try {
          sendMessage({ type: "subscribe_existing", community_id: communityId });
          await updateCachedCommunities(communityId);
        } catch (error) {
          console.error("Failed to subscribe to existing community:", error);
        }
      }
    },
    [socket, isConnected, sendMessage, db]
  );

  const updateCachedCommunities = useCallback(async (communityId: string | number) => {
    if (token && isConnected && db) {
      try {
        const community = await getCommunityDetails(communityId, token);
        await db.executeSql(`
          INSERT OR REPLACE INTO communities (id, name, image_url, members_count, shareable_link)
          VALUES (?, ?, ?, ?, ?)
        `, [community.id, community.name, community.image_url, community.members?.length ?? 0, community.shareable_link]);
      } catch (error) {
        console.error("Error updating cached communities:", error);
      }
    }
  }, [token, isConnected, db]);

  const fetchAndCacheCommunities = useCallback(async () => {
    if (token && isConnected && db) {
      try {
        const communities = await getUserCommunities(token);
        for (const community of communities) {
          await updateCachedCommunities(community.id);
        }
        console.log("Communities fetched and cached.");
      } catch (error) {
        console.error("Failed to fetch or cache communities:", error);
      }
    }
  }, [token, isConnected, updateCachedCommunities, db]);

  const fetchAndCacheCourses = useCallback(async () => {
    if (token && isConnected && db) {
      try {
        const courses = await getCourses(token);
        for (const course of courses) {
          await db.executeSql(`
            INSERT OR REPLACE INTO courses (id, name, category_id, description)
            VALUES (?, ?, ?, ?)
          `, [course.id, course.name, course.category_id, course.description]);
        }
        console.log("Courses fetched and cached.");
      } catch (error) {
        console.error("Failed to fetch or cache courses:", error);
      }
    }
  }, [token, isConnected, db]);

  const fetchAndCacheCourseCategories = useCallback(async () => {
    if (token && isConnected && db) {
      try {
        const categories = await getCourseCategories(token);
        for (const category of categories) {
          await db.executeSql(`
            INSERT OR REPLACE INTO course_categories (id, name)
            VALUES (?, ?)
          `, [category.id, category.name]);
        }
        console.log("Course categories fetched and cached.");
      } catch (error) {
        console.error("Failed to fetch or cache course categories:", error);
      }
    }
  }, [token, isConnected, db]);

  const fetchAndCacheTodayPlans = useCallback(
    async (token: string, date: Date, category?: string) => {
      if (token && isConnected && db) {
        try {
          const plans = await getTodayPlans(token, date, category);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          for (const plan of plans) {
            await db.executeSql(`
              INSERT OR REPLACE INTO plans (id, date, category, title, description, due_date, due_time)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [plan.id, dateStr, category || 'all', plan.title, plan.description, plan.due_date, plan.due_time]);
          }
          return plans;
        } catch (error) {
          console.error("Failed to fetch or cache today's plans:", error);
          throw error;
        }
      }
      return [];
    },
    [isConnected, db]
  );

  const fetchAndCacheCategoryNames = useCallback(
    async (token: string) => {
      if (token && isConnected && db) {
        try {
          const categories = await getCategoryNames(token);
          for (const [id, name] of Object.entries(categories)) {
            await db.executeSql(`
              INSERT OR REPLACE INTO category_names (id, name)
              VALUES (?, ?)
            `, [parseInt(id, 10), name]);
          }
          return categories;
        } catch (error) {
          console.error("Failed to fetch or cache category names:", error);
          throw error;
        }
      }
      return {};
    },
    [isConnected, db]
  );

  const getCachedTodayPlans = useCallback(
    async (date: Date, category?: string) => {
      if (!db) return [];
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const query = category 
        ? 'SELECT * FROM plans WHERE date = ? AND category = ?'
        : 'SELECT * FROM plans WHERE date = ?';
      
      const [results] = await db.executeSql(query, [dateStr, category || 'all']);
      return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i));
    },
    []
  );

  const getCachedCategoryNames = useCallback(
    async (): Promise<Record<number, string>> => {
      if (!db) return {};
      const [results] = await db.executeSql('SELECT * FROM category_names');
      const categories = {};
      for (let i = 0; i < results.rows.length; i++) {
        const item = results.rows.item(i);
        categories[item.id] = item.name;
      }
      return categories;
    },
    []
  );

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
      if (db) {
        await db.executeSql('UPDATE last_messages SET status = ? WHERE community_id = ?', ["read", communityId]);
        sendMessage({
          type: "message_status_update",
          message_id: unreadCommunityMessages[communityId]?.message_id,
          status: "read",
        });
      }
    },
    [unreadCommunityMessages, sendMessage, db]
  );

  const fetchMessagesPage = useCallback(
    async (communityId: string, page: number = 1, pageSize: number = 20, before?: string) => {
      if (!isConnected || !db) return [];

      // Query for a page of messages
      const offset = (page - 1) * pageSize;
      let query = 'SELECT * FROM messages WHERE community_id = ?';
      let params = [communityId];

      if (before) {
        query += ' AND sent_at < ?';
        params.push(before);
      }

      query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
      params = params.concat([pageSize, offset]);

      try {
        const [results] = await db.executeSql(query, params);
        // Convert SQLite result to an array of message objects
        return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i));
      } catch (error) {
        console.error('Failed to fetch messages page:', error);
        return [];
      }
    },
    [db, isConnected]
  );

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
    fetchMessagesPage,
    db,
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