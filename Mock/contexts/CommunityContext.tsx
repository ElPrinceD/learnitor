import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

// Define TypeScript interfaces for better type safety
interface Message {
  id: string;
  community_id: string;
  message: string;
  sender_id: string | null;
  sender: string;
  sender_image: string | null;
  sent_at: string;
  status: 'sent' | 'read';
  reply_to: { id: string; snippet: string; sender_id: string; sender_name: string } | null;
  image: string | null;
  document: string | null;
  temp_id?: string;
  is_edited: boolean;
}

interface Community {
  id: string;
  name: string;
  members: { id: string; first_name: string; last_name: string; email: string; profile_picture: string | null }[];
  // Add other community properties as needed
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

const CommunityContext = createContext<CommunityContextType | null>(null);

interface CommunityProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ token, children }) => {
  const { socket, isConnected, sendMessage, addMessageListener, removeMessageListener } = useWebSocket();
  const { setItem, getItem, removeItem, getAllKeys } = useCache();
  const { userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const userName = `${userInfo?.user.first_name} ${userInfo?.user.last_name}`;
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, Message>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const messageQueue: any[] = [];

  const normalizeMessage = useCallback((data: any): Message => ({
    id: data.id?.toString() || data._id?.toString() || data.temp_id || '',
    community_id: (data.community_id || data.community)?.toString() || '',
    message: data.message || data.text || '',
    sender_id: data.sender_id || data.user?._id || null,
    sender: data.sender || data.user?.name || 'Unknown User',
    sender_image: data.sender_image || data.user?.avatar || null,
    sent_at: new Date(data.sent_at || data.createdAt || Date.now()).toISOString(),
    status: data.status || 'sent',
    reply_to: data.reply_to || data.replyTo
      ? {
          id: data.reply_to?.id?.toString() || data.replyTo?._id?.toString() || '',
          snippet: data.reply_to?.snippet || data.replyTo?.text || '',
          sender_id: data.reply_to?.sender_id || data.replyTo?.user?._id || '',
          sender_name: data.reply_to?.sender_name || data.replyTo?.user?.name || '',
        }
      : null,
    image: data.image || null,
    document: data.document || null,
    temp_id: data.temp_id || data.tempId,
    is_edited: data.is_edited || data.isEdited || false,
  }), []);

  const fetchAndCacheMessages = useCallback(
    async (communityId: string, token: string) => {
      try {
        const key = `messages_${communityId}`;
        const cachedMessages = await getItem(key);
        if (cachedMessages) {
          return JSON.parse(cachedMessages) as Message[];
        }

        const messages = await getCommunityMessages(communityId, token, 50);
        const normalizedMessages = messages.map(normalizeMessage);
        await setItem(key, JSON.stringify(normalizedMessages));
        return normalizedMessages;
      } catch (error) {
        console.error('Error fetching and caching messages:', error);
        return [];
      }
    },
    [getItem, setItem, normalizeMessage]
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

  const unsubscribeFromCommunity = useCallback(
    async (communityId: string, removed: boolean) => {
      if (!isConnected || !socket) return;

      if (!removed) {
        sendMessage({
          type: 'leave_community',
          community_id: communityId,
        });
      }

      try {
        await Promise.all([
          removeItem(`community_${communityId}`),
          removeItem(`messages_${communityId}`),
          removeItem(`last_message_${communityId}`),
        ]);
      } catch (error) {
        console.error('Error removing cached data for community:', communityId, error);
      }
    },
    [isConnected, socket, sendMessage, removeItem]
  );

  // Split handleMessage into smaller functions for readability and maintainability
  const handleNewMessage = useCallback(
    async (data: any) => {
      const communityId = data.community_id.toString();
      const keyMessages = `messages_${communityId}`;
      const cachedMessages = await getItem(keyMessages);
      const existingMessages: Message[] = cachedMessages ? JSON.parse(cachedMessages) : [];
      const normalizedMessage = normalizeMessage(data);

      if (!existingMessages.some((msg) => msg.id === normalizedMessage.id || msg.temp_id === normalizedMessage.temp_id)) {
        const updatedMessages = [normalizedMessage, ...existingMessages];
        await setItem(keyMessages, JSON.stringify(updatedMessages));
      } else if (normalizedMessage.temp_id) {
        const updatedMessages = existingMessages.map((msg) =>
          msg.temp_id === normalizedMessage.temp_id ? normalizedMessage : msg
        );
        await setItem(keyMessages, JSON.stringify(updatedMessages));
      }

      const newLastMessage = { ...normalizedMessage };
      await setItem(`last_message_${communityId}`, JSON.stringify(newLastMessage));

      if (userId && data.sender_id !== userId) {
        if (communityId === currentCommunityId) {
          if (socket) {
            socket.send(JSON.stringify({ type: 'message_status_update', message_id: data.id, status: 'read' }));
          }
          newLastMessage.status = 'read';
          await setItem(`last_message_${communityId}`, JSON.stringify(newLastMessage));
        } else {
          setUnreadCommunityMessages((prev) => ({ ...prev, [communityId]: newLastMessage }));
          setUnreadMessages((prev) => ({ ...prev, [communityId]: (prev[communityId] || 0) + 1 }));
        }
      }
    },
    [getItem, setItem, normalizeMessage, userId, currentCommunityId, socket]
  );

  const handleMessageEdit = useCallback(
    async (data: any) => {
      const communityId = data.community_id.toString();
      const messageId = data.message_id.toString();
      const messagesStr = await getItem(`messages_${communityId}`);
      if (messagesStr) {
        const messages: Message[] = JSON.parse(messagesStr);
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], message: data.new_content, is_edited: true };
          await setItem(`messages_${communityId}`, JSON.stringify(messages));
        }
      }

      const lastMessageStr = await getItem(`last_message_${communityId}`);
      if (lastMessageStr) {
        const lastMessage: Message = JSON.parse(lastMessageStr);
        if (lastMessage.id === messageId) {
          lastMessage.message = data.new_content;
          lastMessage.is_edited = true;
          await setItem(`last_message_${communityId}`, JSON.stringify(lastMessage));
          if (userId && lastMessage.sender_id !== userId) {
            setUnreadCommunityMessages((prev) => ({ ...prev, [communityId]: lastMessage }));
          }
        }
      }
    },
    [getItem, setItem, userId]
  );

  const handleMessageDelete = useCallback(
    async (data: any) => {
      const communityId = data.community_id.toString();
      const messageId = data.message_id.toString();
      const messagesStr = await getItem(`messages_${communityId}`);
      if (messagesStr) {
        const messages: Message[] = JSON.parse(messagesStr).filter((msg: Message) => msg.id !== messageId);
        await setItem(`messages_${communityId}`, JSON.stringify(messages));
      }

      const lastMessageStr = await getItem(`last_message_${communityId}`);
      if (lastMessageStr) {
        const lastMessage: Message = JSON.parse(lastMessageStr);
        if (lastMessage.id === messageId) {
          const messagesStr = await getItem(`messages_${communityId}`);
          if (messagesStr) {
            const messages: Message[] = JSON.parse(messagesStr);
            if (messages.length > 0) {
              const newLastMessage = messages[0];
              await setItem(`last_message_${communityId}`, JSON.stringify(newLastMessage));
              if (userId && newLastMessage.sender_id !== userId) {
                setUnreadCommunityMessages((prev) => ({ ...prev, [communityId]: newLastMessage }));
              }
            } else {
              await removeItem(`last_message_${communityId}`);
              setUnreadCommunityMessages((prev) => {
                const newUnread = { ...prev };
                delete newUnread[communityId];
                return newUnread;
              });
            }
          }
        }
      }
    },
    [getItem, setItem, removeItem, userId]
  );

  const handleCommunityUpdated = useCallback(
    async (data: any) => {
      const communityId = data.community.id.toString();
      const existingCommunityStr = await getItem(`community_${communityId}`);
      const updatedCommunity = existingCommunityStr
        ? { ...JSON.parse(existingCommunityStr), ...data.community }
        : data.community;
      await setItem(`community_${communityId}`, JSON.stringify(updatedCommunity));
    },
    [getItem, setItem]
  );

  const handleMemberJoined = useCallback(
    async (data: any) => {
      const communityId = data.community_id.toString();
      const cachedCommunity = await getItem(`community_${communityId}`);
      if (cachedCommunity) {
        const community: Community = JSON.parse(cachedCommunity);
        if (!community.members.some((m) => m.id === data.user_details.id.toString())) {
          community.members.push({
            id: data.user_details.id,
            first_name: data.user_details.first_name,
            last_name: data.user_details.last_name,
            email: data.user_details.email,
            profile_picture: data.user_details.profile_picture,
          });
          await setItem(`community_${communityId}`, JSON.stringify(community));
        }
      }
    },
    [getItem, setItem]
  );

  const handleMemberRemoved = useCallback(
    async (data: any) => {
      const communityId = data.community_id.toString();
      const removedMemberId = data.user_id.toString();
      if (removedMemberId === userId) {
        await unsubscribeFromCommunity(communityId, true);
        setUnreadMessages((prev) => {
          const updated = { ...prev };
          delete updated[communityId];
          return updated;
        });
        setUnreadCommunityMessages((prev) => {
          const updated = { ...prev };
          delete updated[communityId];
          return updated;
        });
      } else {
        const cachedCommunity = await getItem(`community_${communityId}`);
        if (cachedCommunity) {
          const community: Community = JSON.parse(cachedCommunity);
          community.members = community.members.filter((m) => m.id !== removedMemberId);
          await setItem(`community_${communityId}`, JSON.stringify(community));
        }
      }
    },
    [getItem, setItem, userId, unsubscribeFromCommunity]
  );

  const handleMessage = useCallback(
    async (data: any) => {
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
          await handleCommunityUpdated(data);
          break;
        case 'member_joined':
          await handleMemberJoined(data);
          break;
        case 'member_removed':
          await handleMemberRemoved(data);
          break;
      }
    },
    [
      handleNewMessage,
      handleMessageEdit,
      handleMessageDelete,
      handleCommunityUpdated,
      handleMemberJoined,
      handleMemberRemoved,
    ]
  );

  const fetchAndCacheCommunities = useCallback(
    async () => {
      if (!token) return;
      try {
        const keys = await getAllKeys();
        const cachedCommunityKeys = keys.filter((key) => key.startsWith('community_'));
        if (cachedCommunityKeys.length === 0) {
          const communities = await getUserCommunities(token);
          await Promise.all(
            communities.map((community) =>
              setItem(`community_${community.id}`, JSON.stringify(community))
            )
          );
        }
      } catch (error) {
        console.error('Error fetching and caching communities:', error);
      }
    },
    [token, getAllKeys, setItem]
  );

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string) => {
      if (!socket || !token) {
        messageQueue.push({ type: 'join_community', community_id: communityId });
        return;
      }
      sendMessage({ type: 'join_community', community_id: communityId });
      try {
        const communityDetails = await getCommunityDetails(communityId, token);
        await setItem(`community_${communityId}`, JSON.stringify(communityDetails));
      } catch (error) {
        console.error('Error fetching community details:', error);
      }
    },
    [socket, token, sendMessage, setItem]
  );

  const subscribeToExistingUserCommunities = useCallback(
    async () => {
      if (!token || !isConnected || !socket) return;
      try {
        const keys = await getAllKeys();
        const cachedCommunityKeys = keys.filter((key) => key.startsWith('community_'));
        if (cachedCommunityKeys.length === 0) {
          const userCommunities = await getUserCommunities(token);
          await Promise.all(
            userCommunities.map((community) =>
              setItem(`community_${community.id}`, JSON.stringify(community))
            )
          );
        }
      } catch (error) {
        console.error('Error subscribing to user communities:', error);
      }
    },
    [token, isConnected, socket, getAllKeys, setItem]
  );

  const fetchInitialLastMessages = useCallback(
    async () => {
      if (!token) return;
      try {
        const lastMessagesData = await getLastMessages(token);
        await Promise.all(
          lastMessagesData
            .filter((msg) => msg && msg.community)
            .map(async (message) => {
              const normalizedMessage = normalizeMessage(message);
              const communityId = message.community.toString();
              await setItem(`last_message_${communityId}`, JSON.stringify(normalizedMessage));
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
    },
    [token, userName, setItem, normalizeMessage]
  );

  const markMessageAsRead = useCallback(
    async (communityId: string) => {
      try {
        const lastMessageStr = await getItem(`last_message_${communityId}`);
        if (lastMessageStr) {
          const lastMessage: Message = JSON.parse(lastMessageStr);
          if (lastMessage.sender_id !== userId && lastMessage.status !== 'read') {
            if (socket && isConnected) {
              socket.send(
                JSON.stringify({
                  type: 'message_status_update',
                  message_id: lastMessage.id,
                  status: 'read',
                })
              );
            }
            lastMessage.status = 'read';
            await setItem(`last_message_${communityId}`, JSON.stringify(lastMessage));
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
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },
    [getItem, setItem, socket, isConnected, userId]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    addMessageListener(onMessage);
    return () => removeMessageListener(onMessage);
  }, [addMessageListener, removeMessageListener, handleMessage]);

  useEffect(() => {
    if (isConnected && socket) {
      while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        if (message) sendMessage(message);
      }
    }
  }, [isConnected, socket, sendMessage]);

  useEffect(() => {
    const initializeCommunityData = async () => {
      if (!isConnected || !token) return;
      await subscribeToExistingUserCommunities();
      await fetchInitialLastMessages();

      const updateMissedMessages = async () => {
        const allKeys = await getAllKeys();
        const messageKeys = allKeys.filter((key) => key.startsWith('messages_'));
        await Promise.all(
          messageKeys.map(async (key) => {
            const communityId = key.split('_')[1];
            const messagesStr = await getItem(key);
            if (messagesStr) {
              const messages: Message[] = JSON.parse(messagesStr);
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
                  await setItem(key, JSON.stringify([...normalizedNew, ...messages]));
                }
              }
            }
          })
        );
      };
      await updateMissedMessages();
    };

    initializeCommunityData().catch((error) =>
      console.error('Error initializing community data:', error)
    );
  }, [
    token,
    isConnected,
    subscribeToExistingUserCommunities,
    fetchInitialLastMessages,
    getAllKeys,
    getItem,
    setItem,
    normalizeMessage,
  ]);

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

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within a CommunityProvider');
  return context;
};