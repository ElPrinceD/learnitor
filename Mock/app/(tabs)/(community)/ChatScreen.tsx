import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Button,
  Image,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import { Message } from "../../../components/types";

const generateSenderColor = (name: string): string => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Dummy image URL from Freepik
const DUMMY_IMAGE_URL =
  "https://image.freepik.com/free-photo/portrait-beautiful-young-woman_1150-14455.jpg";

type RouteParams = {
  communityId: string;
};

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const ws = useRef<WebSocket | null>(null);

  const checkMembershipStatus = async () => {
    try {
      const response = await axios.get(
        `https://learnitor.onrender.com/api/communities/${communityId}/is_member/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setIsMember(response.data.is_member);
      if (response.data) {
        fetchMessageHistory();
        connectWebSocket();
      }
    } catch (error) {
      console.error("Error checking membership status:", error);
      setError("Failed to check membership status");
    }
  };
  console.log("HAHA", isMember);
  const fetchMessageHistory = async () => {
    try {
      const response = await axios.get<Message[]>(
        `https://learnitor.onrender.com/api/messages/${communityId}/get_messages/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      const sortedMessages = response.data.sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
    }
  };

  const connectWebSocket = useCallback(() => {
    if (communityId && userToken?.token) {
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket(
        `wss://learnitor.onrender.com/community/${communityId}/?token=${userToken.token}`
      );

      ws.current.onopen = () => {
        console.log(`WebSocket connection opened for community ${communityId}`);
        setIsConnected(true);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error");
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!Array.isArray(data)) {
            const newMessage = {
              ...data,
              sender: data.sender || user?.first_name,
              sent_at: formatTime(new Date().toISOString()),
            };
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages, newMessage].sort(
                (a, b) =>
                  new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
              return updatedMessages;
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          setError("Error parsing message");
        }
      };

      ws.current.onclose = () => {
        console.log(`WebSocket connection closed for community ${communityId}`);
        setIsConnected(false);
      };
    }
  }, [communityId, userToken]);

  useEffect(() => {
    checkMembershipStatus();

    return () => {
      if (ws.current) {
        console.log("WebSocket connection closing");
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  const joinCommunity = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post(
        `https://learnitor.onrender.com/api/community/${communityId}/join/`,
        {},
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setIsMember(true);
      fetchMessageHistory();
      connectWebSocket();
    } catch (error) {
      console.error("Error joining community:", error);
      setError("Failed to join community");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && ws.current && isConnected) {
      const messageData = {
        type: "send_message",
        message: messageInput,
      };
      ws.current.send(JSON.stringify(messageData));
      setMessageInput("");
    } else {
      console.error("Cannot send message: WebSocket is not connected");
      setError("Cannot send message: WebSocket is not connected");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender === user?.first_name;
    const backgroundColor = isCurrentUser ? themeColors.tint : "white";
    const textColor = isCurrentUser ? themeColors.background : themeColors.text;
    const senderColor = generateSenderColor(item.sender);

    return (
      <View
        style={[
          styles.messageContainer,
          { alignSelf: isCurrentUser ? "flex-end" : "flex-start" },
        ]}
      >
        {!isCurrentUser && (
          <Image source={{ uri: DUMMY_IMAGE_URL }} style={styles.senderImage} />
        )}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor,
              borderBottomLeftRadius: isCurrentUser ? 0 : 10,
              borderBottomRightRadius: isCurrentUser ? 10 : 0,
            },
          ]}
        >
          {!isCurrentUser && (
            <Text style={[styles.sender, { color: senderColor }]}>
              {item.sender}
            </Text>
          )}
          <Text style={[styles.message, { color: textColor }]}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, { color: textColor }]}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isLoading ? (
        <ActivityIndicator size="large" color={themeColors.tint} />
      ) : isMember ? (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.sent_at}
            contentContainerStyle={styles.messagesContainer}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: themeColors.background },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={themeColors.textSecondary}
              value={messageInput}
              onChangeText={setMessageInput}
            />
            <Button
              title="Send"
              onPress={sendMessage}
              color={themeColors.tint}
            />
          </View>
        </>
      ) : (
        <View style={styles.joinContainer}>
          <Button
            title="Join Community"
            onPress={joinCommunity}
            color={themeColors.tint}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 5,
    marginVertical: 5,
  },
  senderImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circle shape
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    position: "relative",
    elevation: 1, // Shadow effect
    borderBottomRightRadius: 10, // Rounded bottom-right corner
  },
  sender: {
    fontWeight: "bold",
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    marginVertical: 2,
  },
  timestamp: {
    fontSize: 12,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  joinContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CommunityChatScreen;
