// CommunityProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  const { setItem, getItem, removeItem, getAllKeys } = useCache();
  const { userInfo } = useAuth();
  const userId = userInfo?.user?.id;
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [unreadCommunityMessages, setUnreadCommunityMessages] = useState<Record<string, any>>({});
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const messageQueue: any[] = [];

  const normalizeMessage = useCallback((data: any) => ({
    id: data.id?.toString() || data._id?.toString() || data.temp_id || undefined,
    community_id: (data.community_id || data.community)?.toString(),
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
    temp_id: data.temp_id || data.tempId || undefined,
    is_edited: data.is_edited || data.isEdited || false,
  }), []);

  const fetchAndCacheMessages = useCallback(async (communityId: string, token: string) => {
    try {
      const cached = await getItem(`messages_${communityId}`);
      if (cached) return JSON.parse(cached);

      const messages = await getCommunityMessages(communityId, token, 50);
      const normalized = messages.map(normalizeMessage);
      await setItem(`messages_${communityId}`, JSON.stringify(normalized));
      return normalized;
    } catch (err) {
      console.error('fetchAndCacheMessages error:', err);
      return [];
    }
  }, [getItem, setItem, normalizeMessage]);

  const handleMessage = useCallback(async (data: any) => {
    switch (data.type) {
      case 'message': {
        const key = `messages_${data.community_id}`;
        const cached = await getItem(key);
        const messages = cached ? JSON.parse(cached) : [];
        const newMessage = normalizeMessage(data);

        const exists = messages.some((m: any) => m.id === newMessage.id || m.temp_id === newMessage.temp_id);
        let updatedMessages = exists
          ? messages.map((m: any) => m.temp_id === newMessage.temp_id ? newMessage : m)
          : [newMessage, ...messages];

        await setItem(key, JSON.stringify(updatedMessages));
        await setItem(`last_message_${data.community_id}`, JSON.stringify(newMessage));

        if (userId && data.sender_id !== userId) {
          if (data.community_id === currentCommunityId) {
            socket?.send(JSON.stringify({ type: 'message_status_update', message_id: data.id, status: 'read' }));
            newMessage.status = 'read';
            await setItem(`last_message_${data.community_id}`, JSON.stringify(newMessage));
          } else {
            setUnreadCommunityMessages(prev => ({ ...prev, [data.community_id]: newMessage }));
            setUnreadMessages(prev => ({ ...prev, [data.community_id]: (prev[data.community_id] || 0) + 1 }));
          }
        }
        break;
      }

      case 'message_edit': {
        const { message_id, new_content, community_id } = data;
        const key = `messages_${community_id}`;
        const cached = await getItem(key);
        if (cached) {
          const messages = JSON.parse(cached);
          const updated = messages.map((msg: any) =>
            msg.id === message_id
              ? { ...msg, message: new_content, text: new_content, is_edited: true }
              : msg
          );
          await setItem(key, JSON.stringify(updated));
        }

        const last = await getItem(`last_message_${community_id}`);
        if (last) {
          const parsed = JSON.parse(last);
          if (parsed.id === message_id) {
            parsed.message = new_content;
            parsed.is_edited = true;
            await setItem(`last_message_${community_id}`, JSON.stringify(parsed));
            if (parsed.sender_id !== userId) {
              setUnreadCommunityMessages(prev => ({ ...prev, [community_id]: parsed }));
            }
          }
        }
        break;
      }

      case 'message_deleted': {
        const { message_id, community_id } = data;
        const key = `messages_${community_id}`;
        const cached = await getItem(key);
        if (cached) {
          const messages = JSON.parse(cached).filter((msg: any) => msg.id !== message_id);
          await setItem(key, JSON.stringify(messages));
        }

        const last = await getItem(`last_message_${community_id}`);
        if (last && JSON.parse(last).id === message_id) {
          const fallback = await getItem(key);
          const msgs = fallback ? JSON.parse(fallback) : [];
          if (msgs.length) {
            const newLast = msgs[msgs.length - 1];
            await setItem(`last_message_${community_id}`, JSON.stringify(newLast));
          } else {
            await removeItem(`last_message_${community_id}`);
          }
        }
        break;
      }

      case 'community_updated': {
        const updated = data.community;
        const id = updated.id.toString();
        await setItem(`community_${id}`, JSON.stringify(updated));
        const list = await getItem('communities');
        const communities = list ? JSON.parse(list) : [];
        const index = communities.findIndex((c: any) => c.id.toString() === id);
        if (index !== -1) communities[index] = updated;
        else communities.push(updated);
        await setItem('communities', JSON.stringify(communities));
        break;
      }
    }
  }, [getItem, setItem, removeItem, normalizeMessage, userId, currentCommunityId, socket]);

  const fetchInitialLastMessages = useCallback(async () => {
    if (!token) return;
    const communities = await getUserCommunities(token);
    const lastMessages = await getLastMessages(token);

    for (const c of communities) {
      await setItem(`community_${c.id}`, JSON.stringify(c));
    }

    for (const m of lastMessages) {
      if (!(m?.community_id || m?.community)) continue;
      const normalized = normalizeMessage(m);
      const id = (m.community_id || m.community).toString();
      await setItem(`last_message_${id}`, JSON.stringify(normalized));

      if (m.sender_id !== userId && m.status !== 'read') {
        setUnreadMessages(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        setUnreadCommunityMessages(prev => ({ ...prev, [id]: normalized }));
      }
    }
  }, [token, userId, setItem, normalizeMessage]);

  const markMessageAsRead = useCallback(async (communityId: string) => {
    const str = await getItem(`last_message_${communityId}`);
    if (str) {
      const msg = JSON.parse(str);
      if (msg.sender_id !== userId && msg.status !== 'read') {
        socket?.send(JSON.stringify({ type: 'message_status_update', message_id: msg.id, status: 'read' }));
        msg.status = 'read';
        await setItem(`last_message_${communityId}`, JSON.stringify(msg));
        setUnreadMessages(prev => {
          const copy = { ...prev };
          delete copy[communityId];
          return copy;
        });
        setUnreadCommunityMessages(prev => {
          const copy = { ...prev };
          delete copy[communityId];
          return copy;
        });
      }
    }
  }, [getItem, setItem, socket, userId]);

  const joinAndSubscribeToCommunity = useCallback(async (communityId: string | number) => {
    if (!socket || !token) {
      messageQueue.push({ type: 'join_community', community_id: communityId });
      return;
    }
    sendMessage({ type: 'join_community', community_id: communityId.toString() });
    try {
      const details = await getCommunityDetails(communityId, token);
      await setItem(`community_${communityId}`, JSON.stringify(details));
    } catch (err) {
      console.error('joinAndSubscribeToCommunity fetch failed:', err);
    }
  }, [socket, token, sendMessage, setItem]);

  const unsubscribeFromCommunity = useCallback((communityId: string | number) => {
    if (!isConnected || !socket) return;
    sendMessage({ type: 'unsubscribe', community_id: communityId.toString() });
    removeItem(`community_${communityId}`);
  }, [isConnected, socket, sendMessage, removeItem]);

  const subscribeToExistingUserCommunities = useCallback(async () => {
    if (!token || !isConnected || !socket) return;
    const list = await getUserCommunities(token);
    for (const c of list) {
      await setItem(`community_${c.id}`, JSON.stringify(c));
    }
  }, [token, isConnected, socket, setItem]);

  const fetchAndCacheCommunities = useCallback(async () => {
    if (!token) return;
    const list = await getUserCommunities(token);
    await setItem('communities', JSON.stringify(list));
    for (const c of list) {
      await setItem(`community_${c.id}`, JSON.stringify(c));
    }
  }, [token, setItem]);

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleMessage(data);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };
    addMessageListener(listener);
    return () => removeMessageListener(listener);
  }, [addMessageListener, removeMessageListener, handleMessage]);

  useEffect(() => {
    if (isConnected && socket) {
      while (messageQueue.length) {
        const msg = messageQueue.shift();
        msg && sendMessage(msg);
      }
    }
  }, [isConnected, socket, sendMessage]);

  useEffect(() => {
    if (isConnected) {
      subscribeToExistingUserCommunities();
      fetchInitialLastMessages();
      fetchAndCacheCommunities();

      const updateMissedMessages = async () => {
        const keys = await getAllKeys();
        const messageKeys = keys.filter(k => k.startsWith('messages_'));

        for (const key of messageKeys) {
          const communityId = key.split('_')[1];
          const stored = await getItem(key);
          if (stored) {
            const msgs = JSON.parse(stored);
            const last = msgs[0];
            if (last) {
              const newOnes = await getCommunityMessages(communityId, token!, 50, undefined, undefined, last.id);
              const normalized = newOnes.map(normalizeMessage);
              if (normalized.length) {
                await setItem(key, JSON.stringify([...normalized, ...msgs]));
              }
            }
          }
        }
      };

      updateMissedMessages();
    }
  }, [token, isConnected, subscribeToExistingUserCommunities, fetchInitialLastMessages, fetchAndCacheCommunities]);

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
  if (!context) throw new Error('useCommunity must be used within a CommunityProvider');
  return context;
};
