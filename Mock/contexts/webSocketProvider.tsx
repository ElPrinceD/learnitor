import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InteractionManager } from "react-native";
import WsUrl from "../configWs";
import { useAuth } from "../components/AuthContext";

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
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<MessageListener[]>([]);
  const isConnectingRef = useRef(false);
  const { userInfo, userToken } = useAuth();

  const connectWebSocket = useCallback(() => {
    const token = userToken?.token || userInfo?.user.token;

    if (
      !token ||
      isConnectingRef.current ||
      socket?.readyState === WebSocket.OPEN
    ) {
      console.log(
        "connectWebSocket: Not connecting - no token or already connecting/connected"
      );
      return;
    }

    isConnectingRef.current = true;

    const ws = new WebSocket(`${WsUrl}/ws/chat/?token=${token}`);
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      isConnectingRef.current = false;
    };

    ws.onmessage = (event) => {
      listenersRef.current.forEach((listener) => listener(event));
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      isConnectingRef.current = false;
      reconnectWebSocket();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.close(); // Ensure proper closure on error
    };
  }, [userToken?.token, userInfo?.user.token, socket, userInfo]);

  const reconnectWebSocket = useCallback(() => {
    const token = userToken?.token || userInfo?.user.token;
    if (reconnectTimeout.current || !token) return;

    const attempt = reconnectAttemptsRef.current;
    const baseDelay = 1000;
    const maxDelay = 30000;
    const backoff =
      Math.min(baseDelay * Math.pow(2, attempt), maxDelay) +
      Math.random() * 1000;

    console.log(
      `Reconnecting in ${Math.round(backoff / 1000)}s (attempt ${attempt + 1})`
    );
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      reconnectTimeout.current = null;
      connectWebSocket();
    }, backoff);
  }, [connectWebSocket, userToken?.token, userInfo?.user.token]);

  useEffect(() => {
    const token = userToken?.token || userInfo?.user.token;

    if (!token) {
      // If no token, close existing connection and reset state
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const manager = InteractionManager.runAfterInteractions(() => {
      connectWebSocket();
    });

    return () => {
      manager.cancel();
    };
  }, [userToken?.token, userInfo?.user.token, connectWebSocket, socket]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not connected.");
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
    [
      socket,
      isConnected,
      sendMessage,
      addMessageListener,
      removeMessageListener,
    ]
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
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
