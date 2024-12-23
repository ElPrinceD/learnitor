import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  TextInput,
  ImageBackground,
  useColorScheme,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import { Message } from "../../../components/types";
import {
  GiftedChat,
  Bubble,
  Send,
  SystemMessage,
  IMessage,
  InputToolbar,
} from "react-native-gifted-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Video from "react-native-video";

type RouteParams = {
  communityId: string;
};

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const ws = useRef<WebSocket | null>(null);
  const insets = useSafeAreaInsets();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);

  const backgroundImage =
    colorScheme === "dark"
      ? require("../../../assets/images/dark-bg.jpg")
      : require("../../../assets/images/light-bg.jpg");

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

      if (response.data.is_member) {
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

      const transformedMessages = response.data.map((message) => ({
        _id: message.id,
        text: message.message,
        createdAt: new Date(message.sent_at),
        user: {
          _id: message.sender === user?.first_name ? 2 : 1,
          name: message.sender,
        },
      }));

      setMessages(transformedMessages);
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
            _id: data.id || Math.random().toString(),
            text: data.message,
            createdAt: new Date(data.sent_at),
            user: {
              _id: data.sender || "Bot",
              name: data.sender ? "You" : "Bot",
            },
          };
          setMessages((prevMessages) =>
            GiftedChat.append(prevMessages, [newMessage])
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setError("Error parsing message");
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  }, [communityId, userToken, isMember]);

  useEffect(() => {
    checkMembershipStatus();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  const pickImage = async () => {
    const result: ImagePicker.ImagePickerResult =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;

      onSend([
        {
          _id: Math.random().toString(),
          text: "",
          createdAt: new Date(),
          user: { _id: user?.id || 1, name: user?.first_name || "User" },
          image: imageUri,
        },
      ]);
    }
  };

  const renderBubble = (props) => {
    const isFirstMessageOfBlock =
      props.previousMessage?.user?._id !== props.currentMessage.user._id;

    const isOtherUser = props.currentMessage.user._id !== user?.id;

    const isNewDay =
      !props.previousMessage ||
      (props.currentMessage?.createdAt &&
        props.previousMessage?.createdAt &&
        props.currentMessage.createdAt.toDateString() !==
          props.previousMessage.createdAt.toDateString());

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: { backgroundColor: themeColors.background },
          right: { backgroundColor: themeColors.tint },
        }}
        containerStyle={{
          marginVertical: isFirstMessageOfBlock ? 5 : 0,
        }}
        renderCustomView={() =>
          (isOtherUser && isFirstMessageOfBlock) ||
          (isOtherUser && isNewDay) ? (
            <Text style={styles.username}>
              {props.currentMessage.user.name}
            </Text>
          ) : null
        }
        textStyle={{
          right: { color: "#ffff" },
          left: { color: themeColors.text },
        }}
      />
    );
  };

  const renderDay = (props) => {
    const { currentMessage, previousMessage } = props;

    // Check if this is the first message of a new day
    const isNewDay =
      !previousMessage ||
      (currentMessage?.createdAt &&
        previousMessage?.createdAt &&
        currentMessage.createdAt.toDateString() !==
          previousMessage.createdAt.toDateString());

    // Only render the day separator if it's a new day
    if (!isNewDay) return null;

    return (
      <View
        style={[
          styles.dateContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={styles.dateText}>
          {currentMessage.createdAt.toDateString()}
        </Text>
      </View>
    );
  };
  const onImagePress = (uri) => {
    setMediaUri(uri);
    setIsImageViewerVisible(true);
  };

  const onVideoPress = (uri) => {
    setMediaUri(uri);
    setIsVideoViewerVisible(true);
  };
  const renderMessageImage = (props) => (
    <TouchableOpacity onPress={() => onImagePress(props.currentMessage.image)}>
      <Image
        source={{ uri: props.currentMessage.image }}
        style={styles.messageImage}
      />
    </TouchableOpacity>
  );

  const renderMessageVideo = (props) => (
    <TouchableOpacity onPress={() => onVideoPress(props.currentMessage.video)}>
      <Video
        source={{ uri: props.currentMessage.video }}
        style={styles.messageVideo}
        resizeMode="contain"
        paused
      />
    </TouchableOpacity>
  );

  const renderSend = (props) => (
    <View style={styles.sendContainer}>
      <Send {...props} containerStyle={styles.sendButton} alwaysShowSend>
        <Ionicons name="send" color="#ffffff" size={20} />
      </Send>
    </View>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={{ alignItems: "center", flexDirection: "row" }}
      renderComposer={() => (
        <View style={styles.inputField}>
          <TextInput
            style={styles.textInput}
            placeholder="Message"
            placeholderTextColor={themeColors.textSecondary}
            value={props.text}
            onChangeText={props.onTextChanged}
          />
          <Ionicons
            name="attach-outline"
            color={themeColors.tint}
            size={24}
            onPress={pickImage}
            style={styles.attachIcon}
          />
        </View>
      )}
    />
  );

  const renderAvatar = (props: any) => {
    const avatarUrl = props.currentMessage.user.avatar || user?.profile_picture;

    if (avatarUrl) {
      return (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </View>
      );
    } else {
      return (
        <View style={styles.avatarContainer}>
          <Text style={styles.initials}>
            {props.currentMessage.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 2,
    },
    username: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
      fontWeight: "bold",
      marginLeft: 10,
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: "#ccc",
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
    initials: {
      color: "#fff",
      fontSize: 18,
    },
    dateContainer: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignSelf: "center",
      marginVertical: 10,
    },
    dateText: {
      color: themeColors.textSecondary,
      fontSize: 12,
      fontWeight: "bold",
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: 10,
      margin: 5,
    },
    sendContainer: {
      height: 44,
      width: 55,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingHorizontal: 4,
      backgroundColor: themeColors.tint,
      borderRadius: 20,
      marginHorizontal: 1,
    },
    sendButton: {
      justifyContent: "center",
    },
    inputContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 10,
      color: themeColors.text,
    },
    inputToolbar: {
      backgroundColor: "transparent",
      borderTopWidth: 0,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    inputField: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.background,
      borderRadius: 20,
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 10,
    },
    attachIcon: {
      marginLeft: 8,
    },
    textInput: {
      flex: 1,
      color: themeColors.text,
      fontSize: 16,
    },
    messageVideo: {
      width: 200,
      height: 200,
      borderRadius: 10,
      margin: 5,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    fullScreenImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    fullScreenVideo: {
      width: "100%",
      height: "100%",
    },
  });

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1, paddingTop: 10 }}
    >
      <GiftedChat
        messages={messages}
        onSend={(messages) =>
          setMessages((prevMessages) =>
            GiftedChat.append(prevMessages, messages)
          )
        }
        user={{ _id: user?.id || 1 }}
        text={messageInput}
        onInputTextChanged={(text) => setMessageInput(text)}
        renderSystemMessage={(props) => (
          <SystemMessage
            {...props}
            textStyle={{ color: themeColors.textSecondary }}
          />
        )}
        renderAvatar={renderAvatar}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        renderMessageImage={renderMessageImage}
        renderDay={renderDay}
        isTyping={false}
        inverted={false}
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={isImageViewerVisible && mediaUri !== null}
        transparent={true}
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setIsImageViewerVisible(false)}>
            {mediaUri && (
              <Image
                source={{ uri: mediaUri }}
                style={styles.fullScreenImage}
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Video Viewer Modal */}
      <Modal
        visible={isVideoViewerVisible && mediaUri !== null}
        transparent={true}
        onRequestClose={() => setIsVideoViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setIsVideoViewerVisible(false)}>
            {mediaUri && (
              <Video
                source={{ uri: mediaUri }}
                style={styles.fullScreenVideo}
                resizeMode="contain"
                controls
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default CommunityChatScreen;
