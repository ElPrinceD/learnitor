import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
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
import { useWebSocket } from "../../../webSocketProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RouteParams = {
  communityId: string;
};

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { socket, isConnected, sendMessage } = useWebSocket();

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);

  const backgroundImage =
    colorScheme === "dark"
      ? require("../../../assets/images/dark-bg.jpg")
      : require("../../../assets/images/light-bg.jpg");

  const fetchMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      const cachedMessages = await AsyncStorage.getItem(`messages_${communityId}`);
     
      if (cachedMessages && JSON.parse(cachedMessages).length > 0) {
        const parsedMessages = JSON.parse(cachedMessages).map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)  // Changed from sent_at to createdAt for consistency
        }));
        setMessages(parsedMessages);
      } else {
        await sendMessage({ type: 'fetch_history', community_id: communityId });
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      setError("Failed to load message history");
    } finally {
      setLoading(false);
    }
  }, [communityId, sendMessage]);

  useFocusEffect(
    useCallback(() => {
      fetchMessageHistory();
      return () => {
        // Optional cleanup if needed
      };
    }, [fetchMessageHistory])
  );

  useEffect(() => {
    let socketCleanup = () => {};
  
    if (socket) {
      console.log("Socket exists", socket);
      const onMessage = (event) => {
        console.log("WebSocket message event:", event);
        console.log("WebSocket data:", event.data);
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        if (data.type === 'history') {
          const transformedMessages = data.messages.map((message) => ({
            _id: message.id,
            text: message.message,
            createdAt: new Date(message.sent_at),
            user: {
              _id: message.sender_id,
              name: message.sender,
            },
          }));
          console.log("Transform: ", transformedMessages);
          setMessages(transformedMessages);
          AsyncStorage.setItem(`messages_${communityId}`, JSON.stringify(transformedMessages));
        } else if (data.type === 'message') {
          const newMessage = {
            _id: data.id || Math.random().toString(),
            text: data.message,
            createdAt: new Date(),
            user: {
              _id: data.sender_id,
              name: data.sender,
            },
          };
  
          // Check if this message is not already in the state to avoid duplicates
          if (!messages.some(msg => msg._id === newMessage._id)) {
            setMessages((prevMessages) => {
              const updatedMessages = GiftedChat.append(prevMessages, [newMessage]);
              AsyncStorage.setItem(`messages_${communityId}`, JSON.stringify(updatedMessages));
              return updatedMessages;
            });
          }
        }
      };
  
      socket.addEventListener('message', onMessage);
      socketCleanup = () => {
        socket.removeEventListener('message', onMessage);
      };
    }
  
    return socketCleanup;
  }, [socket, messages, user, communityId]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    // Update UI immediately
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    
    for (let message of newMessages) {
      sendMessage({
        type: 'send_message',
        community_id: communityId,
        message: message.text,
        sender: user?.first_name + ' ' + user?.last_name || "Unknown User",
        sender_id: user?.id || 1
      });
    }
  }, [communityId, sendMessage, user]);

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
          createdAt: new Date(), // Changed from sent_at to createdAt
          user: { _id: user?.id || 1, name: user?.first_name || "User" },
          image: imageUri,
        },
      ]);
    }
  };

  const renderBubble = (props) => {
    const isFirstMessageOfBlock = props.previousMessage?.user?._id !== props.currentMessage.user._id;
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
          (isOtherUser && (isFirstMessageOfBlock || isNewDay)) ? (
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
    const isNewDay = 
      !previousMessage ||
      (currentMessage?.createdAt && 
       previousMessage?.createdAt && 
       currentMessage.createdAt.toDateString() !== 
       previousMessage.createdAt.toDateString());

   

    if (!isNewDay) return null;
    

  
    return (
      <View
        style={[
          styles.dateContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={styles.dateText}>
          {currentMessage.createdAt ? currentMessage.createdAt.toDateString() : "Unknown Date"}
        </Text>
      </View>
    );
  };

  // ... (rest of the component remains unchanged)
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
      {loading ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <GiftedChat
          messages={messages}
          onSend={onSend}
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
          inverted={true}
        />
      )}

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