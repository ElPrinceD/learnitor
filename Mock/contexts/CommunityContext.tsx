import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

import { useWebSocket } from './webSocketProvider';
import { useCache } from './CacheContext';
import {
  getCommunities,
  getCommunityDetails,
  getUserCommunities,
  getLastMessages,
  getCommunityMessages,
} from '../services/CommunityApiCalls';
import { useAuth } from '../components/AuthContext';

// Type Definitions
interface Message {
  id: string;
  community_id: string;
  message: string;
  sender_id: string | null;
  sender: string;
  sender_image: string | null;
  sent_at: string;
  status: 'sent' | 'read' | 'delivered';
  reply_to: ReplyTo | null;
  image: string | null;
  document: string | null;
  temp_id?: string;
  is_edited: boolean;
}

interface ReplyTo {
  id: string | null;
  snippet: string | null;
  sender_id: string | null;
  sender_name: string | null;
}

interface Community {
  id: string;
  name: string;
  members: Array<{ id: string; first_name: string; last_name: string; email: string; profile_picture: string }>;
}

interface CommunityContextType {
  lastMessages: Record<string, Message>;
  unreadCommunitiesCount: number;
  unreadMessages: Record<string, number>;
  joinAndSubscribeToCommunity: (communityId: string) => Promise<void>;
  unsubscribeFromCommunity: (communityId: string, removed: boolean) => Promise<void>;
  subscribeToExistingUserCommunities: () => Promise<void>;
  fetchAndCacheCommunities: () => Promise<void>;
  markMessageAsRead: (communityId: string) => Promise<void>;
  setCurrentCommunityId: (communityId: string | null) => void;
  fetchInitialLastMessages: () => Promise<void>;
  fetchAndCacheMessages: (communityId: string, token: string) => Promise<Message[]>;
  removeMemberFromCommunity: (communityId: string, memberId: string) => void;
}

interface CommunityProviderProps {
  token: string | null;
  children: ReactNode;
}

// Context Creation
const CommunityContext = createContext<CommunityContextType | null>(null);

// Utility Functions
const normalizeMessage = (data: any): Message => ({
  id: data.id?.toString() || data._id?.toString() || data.temp_id || crypto.randomUUID(),
  community_id: (data.community_id || data.community)?.toString() || '',
  message: data.message || data.text || '',
  sender_id: data.sender_id || data.user?._id || null,
  sender: data.sender || data.user?.name || 'Unknown User',
  sender_image: data.sender_image || data.user?.avatar || null,
  sent_at: new Date(data.sent_at || data.createdAt || Date.now()).toISOString(),
  status: data.status || 'sent',
  reply_to: data.reply_to || data.replyTo
    ? {
        id: data.reply_to?.id?.toString() || data.replyTo?._id?.toString() || null,
        snippet: data.reply_to?.snippet || data.replyTo?.text || null,
        sender_id: data.reply_to?.sender_id || data.replyTo?.user?._id || null,
        sender_name: data.reply_to?.sender_name || data.replyTo?.user?.name || null,
      }
    : null,
  image: data.image || null,
  document: data.document || null,
  temp_id: data.temp_id || data.tempId,
  is_edited: data.is_edited || data.isEdited || false,
});

// Community Provider
export const CommunityProvider: React.FC<CommunityProviderProps> = ({ token, children }) => {
  const { socket, isConnected, sendMessage, addMessageListener, removeMessageListener } = useWebSocket();
  const { setItem, getItem, removeItem, getAllKeys } = useCache();
  const { userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const userName = userInfo?.user.first_name + ' ' + userInfo?.user.last_name;

  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, Message>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const messageQueue = useMemo(() => new Map<string, any>(), []);

  // Cache Utilities
  const getCachedMessages = useCallback(
    async (communityId: string): Promise<Message[]> => {
      try {
        const cached = await getItem(`messages_${communityId}`);
        return cached ? JSON.parse(cached) : [];
      } catch (error) {
        console.error(`Error retrieving cached messages for community ${communityId}:`, error);
        return [];
      }
    },
    [getItem]
  );

  const cacheMessages = useCallback(
    async (communityId: string, messages: Message[]) => {
      try {
        await setItem(`messages_${communityId}`, JSON.stringify(messages));
      } catch (error) {
        console.error(`Error caching messages for community ${communityId}:`, error);
      }
    },
    [setItem]
  );

  // WebSocket Message Handlers
  const handleNewMessage = useCallback(
    async (data: any) => {
      const normalizedMessage = normalizeMessage(data);
      const communityId = normalizedMessage.community_id;

      const messages = await getCachedMessages(communityId);
      if (!messages.some((msg) => msg.id === normalizedMessage.id || msg.temp_id === normalizedMessage.temp_id)) {
        const updatedMessages = [normalizedMessage, ...messages];
        await cacheMessages(communityId, updatedMessages);
      } else if (normalizedMessage.temp_id) {
        const updatedMessages = messages.map((msg) =>
          msg.temp_id === normalizedMessage.temp_id ? normalizedMessage : msg
        );
        await cacheMessages(communityId, updatedMessages);
      }

      await setItem(`last_message_${communityId}`, JSON.stringify(normalizedMessage));
      setLastMessages((prev) => ({ ...prev, [communityId]: normalizedMessage }));

      if (userId && normalizedMessage.sender_id !== userId.toString()) {
        if (communityId === currentCommunityId) {
          socket?.send(
            JSON.stringify({
              type: 'message_status_update',
              message_id: normalizedMessage.id,
              status: 'read',
            })
          );
          normalizedMessage.status = 'read';
          await setItem(`last_message_${communityId}`, JSON.stringify(normalizedMessage));
        } else {
          setUnreadCommunityMessages((prev) => ({ ...prev, [communityId]: normalizedMessage }));
          setUnreadMessages((prev) => ({ ...prev, [communityId]: (prev[communityId] || 0) + 1 }));
        }
      }
    },
    [userId, currentCommunityId, socket, setItem, getCachedMessages, cacheMessages]
  );

  const handleMessageEdit = useCallback(
    async (data: any) => {
      const { message_id, community_id, new_content } = data;
      if (!community_id) return;

      const messages = await getCachedMessages(community_id);
      const messageIndex = messages.findIndex((msg) => msg.id === message_id.toString());

      if (messageIndex !== -1) {
        messages[messageIndex] = {
          ...messages[messageIndex],
          message: new_content,
          is_edited: true,
        };
        await cacheMessages(community_id, messages);
      }

      const lastMessage = await getItem(`last_message_${community_id}`);
      if (lastMessage && JSON.parse(lastMessage).id === message_id) {
        const updatedLastMessage = { ...JSON.parse(lastMessage), message: new_content, is_edited: true };
        await setItem(`last_message_${community_id}`, JSON.stringify(updatedLastMessage));
        setLastMessages((prev) => ({ ...prev, [community_id]: updatedLastMessage }));
        if (userId && updatedLastMessage.sender_id !== userId) {
          setUnreadCommunityMessages((prev) => ({ ...prev, [community_id]: updatedLastMessage }));
        }
      }
    },
    [userId, getItem, setItem, getCachedMessages, cacheMessages]
  );

  const handleMessageDelete = useCallback(
    async (data: any) => {
      const { message_id, community_id } = data;
      if (!community_id) return;

      const messages = await getCachedMessages(community_id);
      const filteredMessages = messages.filter((msg) => msg.id !== message_id.toString());
      await cacheMessages(community_id, filteredMessages);

      const lastMessage = await getItem(`last_message_${community_id}`);
      if (lastMessage && JSON.parse(lastMessage).id === message_id) {
        if (filteredMessages.length > 0) {
          const newLastMessage = filteredMessages[0];
          await setItem(`last_message_${community_id}`, JSON.stringify(newLastMessage));
          setLastMessages((prev) => ({ ...prev, [community_id]: newLastMessage }));
          if (userId && newLastMessage.sender_id !== userId.toString()) {
            setUnreadCommunityMessages((prev) => ({ ...prev, [community_id]: newLastMessage }));
          }
        } else {
          await removeItem(`last_message_${community_id}`);
          setLastMessages((prev) => {
            const newLastMessages = { ...prev };
            delete newLastMessages[community_id];
            return newLastMessages;
          });
          setUnreadCommunityMessages((prev) => {
            const newUnread = { ...prev };
            delete newUnread[community_id];
            return newUnread;
          });
        }
      }
    },
    [userId, getItem, setItem, removeItem, getCachedMessages, cacheMessages]
  );

  const handleCommunityUpdate = useCallback(
    async (data: any) => {
      const updatedCommunity = data.community;
      if (!updatedCommunity?.id) return;

      const communityId = updatedCommunity.id.toString();
      const existingCommunity = await getItem(`community_${communityId}`);
      const mergedCommunity = existingCommunity
        ? { ...JSON.parse(existingCommunity), ...updatedCommunity }
        : updatedCommunity;

      await setItem(`community_${communityId}`, JSON.stringify(mergedCommunity));
    },
    [getItem, setItem]
  );

  const handleMemberJoined = useCallback(
    async (data: any) => {
      const { community_id, user_details } = data;
      const cachedCommunity = await getItem(`community_${community_id}`);
      if (cachedCommunity) {
        const community = JSON.parse(cachedCommunity);
        if (!community.members.some((member: any) => member.id.toString() === user_details.id.toString())) {
          community.members.push({
            id: user_details.id,
            first_name: user_details.first_name,
            last_name: user_details.last_name,
            email: user_details.email,
            profile_picture: user_details.profile_picture,
          });
          await setItem(`community_${community_id}`, JSON.stringify(community));
        }
      }
    },
    [getItem, setItem]
  );

  const unsubscribeFromCommunity = useCallback(
    async (communityId: string, removed: boolean) => {
      if (!isConnected || !socket) return;

      if (!removed) {
        sendMessage({
          type: 'leave_community',
          community_id: communityId,
        });
      }

      await Promise.all([
        removeItem(`community_${communityId}`),
        removeItem(`messages_${communityId}`),
        removeItem(`last_message_${communityId}`),
      ]);
    },
    [isConnected, socket, sendMessage, removeItem]
  );

  const handleMemberRemoved = useCallback(
    async (data: any) => {
      const { user_id, community_id } = data;
      if (!user_id || !community_id) return;

      if (user_id.toString() === userId?.toString()) {
        await unsubscribeFromCommunity(community_id, true);
        await Promise.all([
          removeItem(`messages_${community_id}`),
          removeItem(`last_message_${community_id}`),
          removeItem(`community_${community_id}`),
        ]);
        setUnreadMessages((prev) => {
          const updated = { ...prev };
          delete updated[community_id];
          return updated;
        });
        setUnreadCommunityMessages((prev) => {
          const updated = { ...prev };
          delete updated[community_id];
          return updated;
        });
        setLastMessages((prev) => {
          const newLastMessages = { ...prev };
          delete newLastMessages[community_id];
          return newLastMessages;
        });
      } else {
        const cachedCommunity = await getItem(`community_${community_id}`);
        if (cachedCommunity) {
          const community = JSON.parse(cachedCommunity);
          community.members = community.members.filter(
            (member: any) => member.id.toString() !== user_id.toString()
          );
          await setItem(`community_${community_id}`, JSON.stringify(community));
        }
      }
    },
    [userId, getItem, setItem, removeItem, unsubscribeFromCommunity]
  );

  const handleWebSocketMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'message':
            await handleNewMessage(data);
            break;
          case 'message_edit':
            await handleMessageEdit(data);
            break;
          case 'message_deleted':
            await handleMessageDelete(data);
            break;
          case 'community_updated':
            await handleCommunityUpdate(data);
            break;
          case 'member_joined':
            await handleMemberJoined(data);
            break;
          case 'member_removed':
            await handleMemberRemoved(data);
            break;
          default:
            console.warn(`Unhandled WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    [
      handleNewMessage,
      handleMessageEdit,
      handleMessageDelete,
      handleCommunityUpdate,
      handleMemberJoined,
      handleMemberRemoved,
    ]
  );

  // Core Functionality
  const fetchAndCacheMessages = useCallback(
    async (communityId: string, token: string): Promise<Message[]> => {
      const cachedMessages = await getCachedMessages(communityId);
      if (cachedMessages.length > 0) {
        return cachedMessages;
      }

      try {
        const messages = await getCommunityMessages(communityId, token, 50);
        const normalizedMessages = messages.map(normalizeMessage);
        await cacheMessages(communityId, normalizedMessages);
        return normalizedMessages;
      } catch (error) {
        console.error(`Error fetching messages for community ${communityId}:`, error);
        return [];
      }
    },
    [getCachedMessages, cacheMessages]
  );

  const removeMemberFromCommunity = useCallback(
    (communityId: string, memberId: string) => {
      if (!isConnected || !socket) return;
      sendMessage({
        type: 'remove_member',
        community_id: communityId,
        member_id: memberId,
      });
    },
    [isConnected, socket, sendMessage]
  );

  

  const fetchAndCacheCommunities = useCallback(async () => {
    if (!token) return;

    try {
      const keys = await getAllKeys();
      if (keys.some((key) => key.startsWith('community_'))) return;

      const communities = await getUserCommunities(token);
      await Promise.all(
        communities.map((community) =>
          setItem(`community_${community.id}`, JSON.stringify(community))
        )
      );
    } catch (error) {
      console.error('Error fetching and caching communities:', error);
    }
  }, [token, getAllKeys, setItem]);

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string) => {
      if (!socket || !token) {
        messageQueue.set(communityId, { type: 'join_community', community_id: communityId });
        return;
      }

      sendMessage({ type: 'join_community', community_id: communityId });

      try {
        const communityDetails = await getCommunityDetails(communityId, token);
        await setItem(`community_${communityId}`, JSON.stringify(communityDetails));
      } catch (error) {
        console.error(`Error fetching community details for ${communityId}:`, error);
      }
    },
    [socket, token, sendMessage, setItem]
  );

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (!token || !isConnected || !socket) return;

    try {
      const keys = await getAllKeys();
      if (keys.some((key) => key.startsWith('community_'))) return;

      const userCommunities = await getUserCommunities(token);
      await Promise.all(
        userCommunities.map((community) =>
          setItem(`community_${community.id}`, JSON.stringify(community))
        )
      );
    } catch (error) {
      console.error('Error subscribing to user communities:', error);
    }
  }, [token, isConnected, socket, getAllKeys, setItem]);

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token) return;

    try {
      const lastMessages = await getLastMessages(token);

      await Promise.all(
        lastMessages.map(async (message) => {
          if (!message?.community) return;
          const normalizedMessage = normalizeMessage(message);
          const communityId = message.community.toString();

          await setItem(`last_message_${communityId}`, JSON.stringify(normalizedMessage));
          setLastMessages((prev) => ({ ...prev, [communityId]: normalizedMessage }));

          if (message.sender !== userName && normalizedMessage.status !== 'read') {
            setUnreadMessages((prev) => ({
              ...prev,
              [communityId]: (prev[communityId] || 0) + 1,
            }));
            setUnreadCommunityMessages((prev) => ({
              ...prev,
              [communityId]: normalizedMessage,
            }));
          }
        })
      );
    } catch (error) {
      console.error('Error fetching initial last messages:', error);
    }
  }, [token, userName, setItem]);

  const markMessageAsRead = useCallback(
    async (communityId: string) => {
      try {
        const lastMessage = await getItem(`last_message_${communityId}`);
        if (!lastMessage) return;

        const parsedMessage = JSON.parse(lastMessage);
        if (parsedMessage.sender_id !== userId && parsedMessage.status !== 'read') {
          socket?.send(
            JSON.stringify({
              type: 'message_status_update',
              message_id: parsedMessage.id,
              status: 'read',
            })
          );
          parsedMessage.status = 'read';
          await setItem(`last_message_${communityId}`, JSON.stringify(parsedMessage));
          setLastMessages((prev) => ({ ...prev, [communityId]: parsedMessage }));
          setUnreadMessages((prev) => {
            const newUnread = { ...prev };
            delete newUnread[communityId];
            return newUnread;
          });
          setUnreadCommunityMessages((prev) => {
            const newUnread = { ...prev };
            delete newUnread[communityId];
            return newUnread;
          });
        }
      } catch (error) {
        console.error(`Error marking message as read for community ${communityId}:`, error);
      }
    },
    [userId, socket, getItem, setItem]
  );

  // Effects
  useEffect(() => {
    addMessageListener(handleWebSocketMessage);
    return () => removeMessageListener(handleWebSocketMessage);
  }, [addMessageListener, removeMessageListener, handleWebSocketMessage]);

  useEffect(() => {
    if (isConnected && socket) {
      messageQueue.forEach((message, key) => {
        console.log(`Sending queued message: ${message.type}`);
        sendMessage(message);
        messageQueue.delete(key);
      });
    }
  }, [isConnected, socket, sendMessage]);

  useEffect(() => {
    const initializeCommunityData = async () => {
      if (!isConnected || !token) return;

      try {
        await subscribeToExistingUserCommunities();
        await fetchInitialLastMessages();

        const updateMissedMessages = async () => {
          const allKeys = await getAllKeys();
          const messageKeys = allKeys.filter((key) => key.startsWith('messages_'));

          await Promise.all(
            messageKeys.map(async (key) => {
              const communityId = key.split('_')[1];
              const messages = await getCachedMessages(communityId);
              const latestMessage = messages[0];

              if (latestMessage) {
                const newMessages = await getCommunityMessages(
                  communityId,
                  token,
                  50,
                  undefined,
                  undefined,
                  latestMessage.id
                );
                const normalizedNew = newMessages.map(normalizeMessage);
                if (normalizedNew.length) {
                  await cacheMessages(communityId, [...normalizedNew, ...messages]);
                }
              }
            })
          );
        };

        await updateMissedMessages();
      } catch (error) {
        console.error('Error initializing community data:', error);
      }
    };

    initializeCommunityData();
  }, [
    token,
    isConnected,
    subscribeToExistingUserCommunities,
    fetchInitialLastMessages,
    getAllKeys,
    getCachedMessages,
    cacheMessages,
  ]);

  // Context Value
  const contextValue = useMemo(
    () => ({
      lastMessages,
      unreadCommunitiesCount: Object.keys(unreadMessages).length,
      unreadMessages,
      joinAndSubscribeToCommunity,
      unsubscribeFromCommunity,
      subscribeToExistingUserCommunities,
      fetchAndCacheCommunities,
      markMessageAsRead,
      setCurrentCommunityId,
      fetchInitialLastMessages,
      fetchAndCacheMessages,
      removeMemberFromCommunity,
    }),
    [
      lastMessages,
      unreadMessages,
      joinAndSubscribeToCommunity,
      unsubscribeFromCommunity,
      subscribeToExistingUserCommunities,
      fetchAndCacheCommunities,
      markMessageAsRead,
      fetchInitialLastMessages,
      fetchAndCacheMessages,
      removeMemberFromCommunity,
    ]
  );

  return <CommunityContext.Provider value={contextValue}>{children}</CommunityContext.Provider>;
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};