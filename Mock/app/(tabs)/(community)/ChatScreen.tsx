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
import {
  format,
  isToday,
  isYesterday,
  subDays,
  parseISO,
} from "date-fns";

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
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

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
      const membershipStatus = response.data.is_member;
      setIsMember(membershipStatus);

      if (membershipStatus) {
        fetchMessageHistory();
        connectWebSocket();
      }
    } catch (error) {
      console.error("Error checking membership status:", error);
      setError("Failed to check membership status");
    } finally {
      setIsCheckingMembership(false);
    }
  };

  const fetchMessageHistory = async () => {
    if (!isMember) return;

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

      // Scroll to the latest message once messages are fetched
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
    }
  };

  const connectWebSocket = useCallback(() => {
    if (!isMember || !communityId || !userToken?.token) return;

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
            sender:  user?.first_name,
            sent_at: new Date().toISOString(),
          };
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, newMessage].sort(
              (a, b) =>
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );
            return updatedMessages;
          });

          // Scroll to the latest message after a new message is received
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
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
  }, [communityId, userToken, isMember]);

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
        `https://learnitor.onrender.com/api/communities/${communityId}/join/`,
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

  const groupMessagesByDate = (messages: Message[]) => {
    const groupedMessages: { title: string; data: Message[] }[] = [];
    let currentGroup: { title: string; data: Message[] } | null = null;

    messages.forEach((message) => {
      const date = parseISO(message.sent_at);
      let title = "";

      if (isToday(date)) {
        title = "Today";
      } else if (isYesterday(date)) {
        title = "Yesterday";
      } else if (isToday(subDays(date, 2))) {
        title = "2 Days Ago";
      } else {
        title = format(date, "MMMM d, yyyy");
      }

      if (!currentGroup || currentGroup.title !== title) {
        currentGroup = { title, data: [message] };
        groupedMessages.push(currentGroup);
      } else {
        currentGroup.data.push(message);
      }
    });

    return groupedMessages;
  };

  const renderMessage = ({ item }: { item: Message }) => {
   
    const isCurrentUser = item.sender === user?.first_name;
    const backgroundColor = isCurrentUser ? themeColors.tint : themeColors.reverseText;
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
          <View style={styles.messageRow}>
            <Text style={[styles.message, { color: textColor }]}>
              {item.message}
            </Text>
            <Text style={[styles.timestamp, { color: textColor }]}>
              {formatTime(item.sent_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGroupedMessages = () => {
    const groupedMessages = groupMessagesByDate(messages);

    return (
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.dateHeader}>{item.title}</Text>
            {item.data.map((message) => (
              <View key={message.sent_at}>{renderMessage({ item: message })}</View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isCheckingMembership ? (
        <ActivityIndicator size="large" color={themeColors.tint} />
      ) : isLoading ? (
        <ActivityIndicator size="large" color={themeColors.tint} />
      ) : isMember ? (
        <>
          {renderGroupedMessages()}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: themeColors.background, color: themeColors.text },
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
    padding: 2,
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
    borderRadius: 25,
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    position: "relative",
    elevation: 1,
  },
  sender: {
    fontWeight: "bold",
    fontSize: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    fontSize: 16,
    marginVertical: 2,
  },
  timestamp: {
    fontSize: 12,
    textAlign: "right",
    marginLeft: 8,
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "gray",
    marginVertical: 10,
    textAlign: "center",
  },
});

export default CommunityChatScreen;
