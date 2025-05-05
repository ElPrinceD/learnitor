import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import WsUrl from '../configWs';
import { useAuth } from '../components/AuthContext';

type MessageListener = (message: any) => void;

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  addMessageListener: (listener: MessageListener) => void;
  removeMessageListener: (listener: MessageListener) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ token, children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<MessageListener[]>([]);
  const hasConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const { userInfo } = useAuth();

  const connectWebSocket = useCallback(() => {
    if (!token || isConnectingRef.current || socket?.readyState === WebSocket.OPEN) return;

    isConnectingRef.current = true;

    const ws = new WebSocket(`${WsUrl}/ws/chat/?token=${token}`);
    setSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      isConnectingRef.current = false;
    };

    ws.onmessage = (event) => {
      console.log(`Message from server (${userInfo?.user.first_name}):`, event);
      listenersRef.current.forEach(listener => listener(event));
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason || event.code);
      setIsConnected(false);
      isConnectingRef.current = false;
      reconnectWebSocket();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close(); // Ensure proper closure on error
    };
  }, [token, socket, userInfo]);

  const reconnectWebSocket = useCallback(() => {
    if (reconnectTimeout.current || !token) return;

    const attempt = reconnectAttemptsRef.current;
    const baseDelay = 1000;
    const maxDelay = 30000;
    const backoff = Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + Math.random() * 1000;

    console.log(`Reconnecting in ${Math.round(backoff / 1000)}s (attempt ${attempt + 1})`);
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      reconnectTimeout.current = null;
      connectWebSocket();
    }, backoff);
  }, [connectWebSocket, token]);

  useEffect(() => {
    if (!token || hasConnectedRef.current) return;

    hasConnectedRef.current = true;

    const manager = InteractionManager.runAfterInteractions(() => {
      connectWebSocket();
    });

    return () => {
      manager.cancel();
      hasConnectedRef.current = false;
      socket?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };
  }, [token, connectWebSocket]);

  const sendMessage = useCallback((message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      console.log('WebSocket sent:', message);
    } else {
      console.warn('WebSocket is not connected.');
    }
  }, [socket]);

  const addMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current.push(listener);
  }, []);

  const removeMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current = listenersRef.current.filter((l) => l !== listener);
  }, []);

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    sendMessage,
    addMessageListener,
    removeMessageListener,
  }), [socket, isConnected, sendMessage, addMessageListener, removeMessageListener]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
