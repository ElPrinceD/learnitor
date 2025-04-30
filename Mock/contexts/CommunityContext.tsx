import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

interface CommunityContextType {
  unreadCommunitiesCount: number;
  unreadMessages: Record<string, number>;
  joinAndSubscribeToCommunity: (communityId: string | number) => Promise<void>;
  unsubscribeFromCommunity: (communityId: string | number) => void;
  subscribeToExistingUserCommunities: () => Promise<void>;
  fetchAndCacheCommunities: () => Promise<void>;
  markMessageAsRead: (communityId: string) => void;
  setCurrentCommunityId: (communityId: string | null) => void;
  fetchInitialLastMessages: () => Promise<void>;
  fetchAndCacheMessages: (communityId: string, token: string) => Promise<any[]>;
}

const CommunityContext = createContext<CommunityContextType | null>(null);

interface CommunityProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ token, children }) => {
  const { socket, isConnected, sendMessage, addMessageListener, removeMessageListener } = useWebSocket();
  const { setItem, getItem, removeItem, getAllKeys, multiGet } = useCache();
  const { userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, any>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const messageQueue: any[] = [];

  const normalizeMessage = useCallback((data: any) => ({
    id: data.id?.toString() || data._id?.toString() || data.temp_id || undefined,
    community_id: (data.community_id || data.community)?.toString(), // Handle both community_id and community
    message: data.message || data.text || '',
    sender_id: data.sender_id || data.user?._id || null, // Allow null if sender_id is missing
    sender: data.sender || data.user?.name || 'Unknown User',
    sender_image: data.sender_image || data.user?.avatar || null,
    sent_at: new Date(data.sent_at || data.createdAt || Date.now()).toISOString(), // Fallback to now if sent_at is missing
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
    temp_id: data.temp_id || data.tempId || undefined,
    is_edited: data.is_edited || data.isEdited || false,
  }), []);

  const getCommunityIdFromMessage = useCallback(
    async (messageId: string) => {
      const allKeys = await getAllKeys();
      const messageKeys = allKeys.filter((key) => key.startsWith('messages_'));
      const multi = await multiGet(messageKeys);
      for (const [key, messages] of multi) {
        if (messages) {
          const parsedMessages = JSON.parse(messages);
          if (parsedMessages.some((msg: any) => msg.id === messageId)) {
            return key.split('_')[1];
          }
        }
      }
      return null;
    },
    [getAllKeys, multiGet]
  );

  const fetchAndCacheMessages = useCallback(
    async (communityId: string, token: string) => {
      try {
        // Check cache first
        const cachedMessages = await getItem(`messages_${communityId}`);
        if (cachedMessages) {
          const parsedMessages = JSON.parse(cachedMessages);
          return parsedMessages;
        }

        // Fetch from API if cache is empty
        const messages = await getCommunityMessages(communityId, token, 50);
        const normalizedMessages = messages.map(normalizeMessage);
        await setItem(`messages_${communityId}`, JSON.stringify(normalizedMessages));
        return normalizedMessages;
      } catch (error) {
        console.error('Error fetching and caching messages:', error);
        return [];
      }
    },
    [getItem, setItem, normalizeMessage]
  );

  const handleMessage = useCallback(
    async (data: any) => {
      switch (data.type) {
        case 'message': {
          const keyMessages = `messages_${data.community_id}`;
          const cachedMessages = await getItem(keyMessages);
          const existingMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
          
          // Normalize the new message
          const normalizedMessage = normalizeMessage(data);
          
          // Check if message already exists to avoid duplicates
          if (!existingMessages.some((msg: any) => msg.id === normalizedMessage.id || msg.temp_id === normalizedMessage.temp_id)) {
            const updatedMessages = [normalizedMessage, ...existingMessages];
            await setItem(keyMessages, JSON.stringify(updatedMessages));
          } else if (normalizedMessage.temp_id) {
            // Update message if it was a pending message (temp_id exists)
            const updatedMessages = existingMessages.map((msg: any) =>
              msg.temp_id === normalizedMessage.temp_id ? normalizedMessage : msg
            );
            await setItem(keyMessages, JSON.stringify(updatedMessages));
          }

          const newLastMessage = {
            ...normalizedMessage,
            replyTo: normalizedMessage.reply_to,
          };
          await setItem(`last_message_${data.community_id}`, JSON.stringify(newLastMessage));

          if (userId && data.sender_id !== userId) {
            if (data.community_id === currentCommunityId) {
              if (socket) {
                socket.send(
                  JSON.stringify({
                    type: 'message_status_update',
                    message_id: data.id,
                    status: 'read',
                  })
                );
              }
              newLastMessage.status = 'read';
              await setItem(`last_message_${data.community_id}`, JSON.stringify(newLastMessage));
            } else {
              setUnreadCommunityMessages((prev) => ({
                ...prev,
                [data.community_id]: newLastMessage,
              }));
              setUnreadMessages((prev) => ({
                ...prev,
                [data.community_id]: (prev[data.community_id] || 0) + 1,
              }));
            }
          }
          break;
        }
        case 'history': {
          const normalizedMessages = data.messages.map(normalizeMessage);
          await setItem(`messages_${data.community_id}`, JSON.stringify(normalizedMessages));
          if (data.messages.length > 0) {
            const lastMessage = normalizeMessage(data.messages[0]);
            await setItem(`last_message_${data.community_id}`, JSON.stringify(lastMessage));
          }
          break;
        }
        case "message_edit": {
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            const messagesStr = await getItem(`messages_${communityId}`);
            if (messagesStr) {
              let parsedMessages = JSON.parse(messagesStr);
              const messageIndex = parsedMessages.findIndex((msg: any) => msg._id === messageId.toString());
              if (messageIndex !== -1) {
                parsedMessages[messageIndex] = {
                  ...parsedMessages[messageIndex],
                  text: data.new_content,
                  is_edited: true,
                };
                await setItem(`messages_${communityId}`, JSON.stringify(parsedMessages));
              }
            }
            const lastMessageStr = await getItem(`last_message_${communityId}`);
            if (lastMessageStr) {
              let parsedLastMessage = JSON.parse(lastMessageStr);
              if (parsedLastMessage.id === messageId) {
                parsedLastMessage.message = data.new_content;
                parsedLastMessage.is_edited = true;
                await setItem(`last_message_${communityId}`, JSON.stringify(parsedLastMessage));
                if (userId && parsedLastMessage.sender_id !== userId) {
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
        case "message_delete": {
          const messageId = data.message_id;
          const communityId = await getCommunityIdFromMessage(messageId);
          if (communityId) {
            const messagesStr = await getItem(`messages_${communityId}`);
            if (messagesStr) {
              let parsedMessages = JSON.parse(messagesStr);
              parsedMessages = parsedMessages.filter((msg: any) => msg._id !== messageId.toString());
              await setItem(`messages_${communityId}`, JSON.stringify(parsedMessages));
            }
            const lastMessageStr = await getItem(`last_message_${communityId}`);
            if (lastMessageStr) {
              let parsedLastMessage = JSON.parse(lastMessageStr);
              if (parsedLastMessage.id === messageId) {
                // Find the next most recent message
                const messagesStr = await getItem(`messages_${communityId}`);
                if (messagesStr) {
                  const parsedMessages = JSON.parse(messagesStr);
                  if (parsedMessages.length > 0) {
                    const newLastMessage = parsedMessages[parsedMessages.length - 1];
                    await setItem(
                      `last_message_${communityId}`,
                      JSON.stringify({
                        ...newLastMessage,
                        sent_at: new Date(newLastMessage.createdAt).toISOString(),
                        status: newLastMessage.status || "sent",
                        replyTo: newLastMessage.replyTo || null,
                      })
                    );
                    if (userId && newLastMessage.user._id !== userId) {
                      setUnreadCommunityMessages((prev) => ({
                        ...prev,
                        [communityId]: {
                          ...newLastMessage,
                          sent_at: new Date(newLastMessage.createdAt).toISOString(),
                          status: newLastMessage.status || "sent",
                          replyTo: newLastMessage.replyTo || null,
                        },
                      }));
                    }
                  } else {
                    // No messages left, clear last message
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
          }
          break;
        }
      }
    },
    [getItem, setItem, normalizeMessage, userId, currentCommunityId, socket, setUnreadCommunityMessages, setUnreadMessages]
  );

  const fetchAndCacheCommunities = useCallback(async () => {
    try {
      if (!token) return;
      const communities = await getUserCommunities(token);
      if(communities){
        await setItem('communities', JSON.stringify(communities));
      }

      for (const community of communities) {
        await setItem(`community_${community.id}`, JSON.stringify(community));
      }
      
    } catch (error) {
      console.error('Error fetching and caching communities:', error);
    }
  }, [token, setItem]);

  const joinAndSubscribeToCommunity = useCallback(
    async (communityId: string | number) => {
      if (!isConnected || !socket || !token) {
        messageQueue.push({ type: 'subscribe', community_id: communityId });
        return;
      }
      try {
        const communityDetails = await getCommunityDetails(communityId, token);
        await setItem(`community_${communityId}`, JSON.stringify(communityDetails));
        sendMessage({
          type: 'subscribe',
          community_id: communityId.toString(),
        });
      } catch (error) {
        console.error('Error joining community:', error);
      }
    },
    [isConnected, socket, token, sendMessage, setItem]
  );

  const unsubscribeFromCommunity = useCallback(
    (communityId: string | number) => {
      if (!isConnected || !socket) return;
      sendMessage({
        type: 'unsubscribe',
        community_id: communityId.toString(),
      });
      removeItem(`community_${communityId}`);
    },
    [isConnected, socket, sendMessage, removeItem]
  );

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (!token || !isConnected || !socket) return;
    try {
      const userCommunities = await getUserCommunities(token);
      for (const community of userCommunities) {
        sendMessage({
          type: 'subscribe',
          community_id: community.id.toString(),
        });
        await setItem(`community_${community.id}`, JSON.stringify(community));
      }
    } catch (error) {
      console.error('Error subscribing to user communities:', error);
    }
  }, [token, isConnected, socket, sendMessage, setItem]);

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token) {
      console.log("No token, skipping fetchInitialLastMessages");
      return;
    }
    try {
      const communities = await getUserCommunities(token);
      const lastMessages = await getLastMessages(token);
   
  
      // Cache communities
      for (const community of communities) {
        await setItem(`community_${community.id}`, JSON.stringify(community));
      }
  
      // Cache last messages
      for (const message of lastMessages) {
        if (!message || !(message.community_id || message.community)) {
          console.warn("Invalid message data:", message);
          continue;
        }
        const normalizedMessage = normalizeMessage(message);
        const communityId = (message.community_id || message.community).toString();
      
        await setItem(`last_message_${communityId}`, JSON.stringify(normalizedMessage));
  
        // Update unread messages if applicable
        if (message.sender_id !== userId && message.status !== 'read') {
          setUnreadMessages((prev) => ({
            ...prev,
            [communityId]: (prev[communityId] || 0) + 1,
          }));
          setUnreadCommunityMessages((prev) => ({
            ...prev,
            [communityId]: normalizedMessage,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching last messages:', error);
    }
  }, [token, userId, setItem, normalizeMessage]);

  const markMessageAsRead = useCallback(
    async (communityId: string) => {
      try {
        const lastMessageStr = await getItem(`last_message_${communityId}`);
        if (lastMessageStr) {
          const lastMessage = JSON.parse(lastMessageStr);
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
        console.log('Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error processing WebSocket message context:', error);
      }
    };

    addMessageListener(onMessage);
    return () => removeMessageListener(onMessage);
  }, [addMessageListener, removeMessageListener, handleMessage]);

  useEffect(() => {
    if (isConnected && socket) {
      while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        if (message) {
          sendMessage(message);
        }
      }
    }
  }, [isConnected, socket, sendMessage]);
  useEffect(() => {
   
    if (isConnected) {
      subscribeToExistingUserCommunities();
      fetchInitialLastMessages();
      fetchAndCacheCommunities();
    }
  }, [token, isConnected, subscribeToExistingUserCommunities, fetchInitialLastMessages, setItem]);


  const unreadCommunitiesCount = Object.keys(unreadMessages).length;

  return (
    <CommunityContext.Provider
      value={{
        unreadCommunitiesCount,
        unreadMessages,
        joinAndSubscribeToCommunity,
        unsubscribeFromCommunity,
        subscribeToExistingUserCommunities,
        fetchAndCacheCommunities,
        markMessageAsRead,
        setCurrentCommunityId,
        fetchInitialLastMessages,
        fetchAndCacheMessages,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};