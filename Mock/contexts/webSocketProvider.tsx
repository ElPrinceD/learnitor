import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { InteractionManager } from 'react-native';
import WsUrl from '../configWs';

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
  const listenersRef = useRef<MessageListener[]>([]);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const ws = new WebSocket(`${WsUrl}/ws/chat/?token=${token}`);
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      console.log('WebSocket received (raw):', event)
  listenersRef.current.forEach(listener => listener(event))
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket disconnected:', event.reason || event.code);
      reconnectWebSocket();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reconnectWebSocket();
    };
  }, [token]);

  const reconnectWebSocket = useCallback(() => {
    if (reconnectTimeout.current) return; // already waiting to reconnect

    const attempt = reconnectAttemptsRef.current;
    const initialBackoff = 1000;
    const maxBackoff = 300000;
    const backoff = Math.min(initialBackoff * Math.pow(1.5, attempt), maxBackoff) + Math.random() * 1000;

    console.log(`Reconnect attempt ${attempt + 1} in ${Math.round(backoff / 1000)}s`);
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connectWebSocket();
      reconnectTimeout.current = null;
    }, backoff);
  }, [connectWebSocket]);

  useEffect(() => {
    if (!token) return;

    const manager = InteractionManager.runAfterInteractions(() => {
      connectWebSocket();
    });

    return () => {
      manager.cancel();
      socket?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };
  }, [token, connectWebSocket]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not connected.');
      }
    },
    [socket]
  );

  const addMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current.push(listener);
  }, []);

  const removeMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current = listenersRef.current.filter((l) => l !== listener);
  }, []);

  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
      sendMessage,
      addMessageListener,
      removeMessageListener,
    }),
    [socket, isConnected, sendMessage, addMessageListener, removeMessageListener]
  );

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