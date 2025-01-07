import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Video from "react-native-video";
import { useWebSocket } from "../../../webSocketProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rMS } from "../../../constants";

type RouteParams = {
  communityId: string;
};

const CommunityChatScreen: React.FC = ({ navigation }) => {
  const route = useRoute();
  const { communityId } = route.params as RouteParams;

  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { socket, isConnected, sendMessage } = useWebSocket();

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<IMessage[]>([]);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);
  
  const chatRef = useRef<GiftedChat>(null);

  const normalizeMessage = (data) => {
    if ('message' in data && 'sent_at' in data) {
      // Format 1: {id, message, sender, sender_id, sent_at}
      return {
        _id: data.id,
        text: data.message,
        createdAt: new Date(data.sent_at),
        user: {
          _id: data.sender_id,
          name: data.sender,
          avatar: data.sender_image,
        },
        status: data.status || 'sent', // Default to 'sent' if status isn't provided
      };
    } else if ('_id' in data && 'createdAt' in data) {
      // Format 2: {_id, text, createdAt, user: {_id, name}}
      return {
        _id: data._id,
        text: data.text,
        createdAt: new Date(data.createdAt),
        user: data.user,
        status: data.user.status || 'sent', // Default to 'sent' if status isn't provided
      };
    } else {
      console.warn("Unknown message format received:", data);
      return null; // Skip processing if the format is unrecognized
    }
  };

  const backgroundImage =
    colorScheme === "dark"
      ? require("../../../assets/images/dark-bg.jpg")
      : require("../../../assets/images/light-bg.jpg");

  const fetchMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      const cachedMessages = await AsyncStorage.getItem(`messages_${communityId}`);
      
      if (cachedMessages) {
        let parsedMessages = JSON.parse(cachedMessages).map(normalizeMessage);
        
        // Filter out null values and sort messages from newest to oldest
        const validMessages = parsedMessages
          .filter((msg): msg is IMessage => msg !== null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by date descending
  
        setMessages(validMessages);
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
      const onMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);
          if (data.type === 'history') {
            if (data.community_id === communityId) { // Only update if it's the current community
              const transformedMessages = data.messages
                .map((message) => ({
                  _id: message.id.toString(),
                  text: message.message,
                  createdAt: new Date(message.sent_at),
                  user: {
                    _id: message.sender_id,
                    name: message.sender,
                    avatar: message.sender_image,
                  },
                  status: message.status || 'sent', // Default to 'sent' if status isn't provided
                }))
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

              setMessages(transformedMessages);
              AsyncStorage.setItem(`messages_${communityId}`, JSON.stringify(transformedMessages));
            }
          } else if (data.type === 'message') {
            if (data.community_id === communityId) { // Only update if it's the current community
              const newMessage = {
                _id: data.id.toString(),
                text: data.message,
                createdAt: new Date(data.sent_at),
                user: {
                  _id: data.sender_id,
                  name: data.sender,
                  avatar: data.sender_image,
                },
                status: 'sent', // New messages are 'sent' by default
              };

              setMessages((prevMessages) => {
                const updatedMessages = [newMessage, ...prevMessages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                
                // If the user is viewing this community, mark the message as read
                if (user?.id !== newMessage.user._id) { // Ensure it's not the user's own message
                  socket.send(JSON.stringify({
                    type: 'message_status_update',
                    message_id: newMessage._id,
                    status: 'read',
                  }));
                  
                  updatedMessages[0].status = 'read'; // Optimistically update status
                }
                
                setTimeout(() => {
                  chatRef.current?.scrollToBottom(); // Scroll to top due to inversion
                }, 100); // Small delay for state update
                return updatedMessages;
              });

              // Update cache
              AsyncStorage.setItem(`messages_${communityId}`, JSON.stringify([newMessage, ...messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())));
              
              // Update last message status in the community list
              AsyncStorage.setItem(`last_message_${communityId}`, JSON.stringify({
                ...newMessage,
                status: 'read',
              }));
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.addEventListener('message', onMessage);
      socketCleanup = () => {
        socket.removeEventListener('message', onMessage);
      };
    }
    
    return socketCleanup;
  }, [socket, communityId, messages, user]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    for (let message of newMessages) {
      const tempId = Math.random().toString(); // Generate a temporary ID for immediate UI update
      const tempMessage = {
        _id: tempId,
        text: message.text,
        createdAt: new Date(),
        user: {
          _id: user?.id || 1,
          name: user?.first_name + ' ' + user?.last_name || "Unknown User",
        },
        ...(message.image && { image: message.image }),
      };
  
      // Update UI with temporary message
      
      // Send message to server
      sendMessage({
        type: 'send_message',
        community_id: communityId,
        message: message.text,
        sender: user?.first_name + ' ' + user?.last_name || "Unknown User",
        sender_id: user?.id || 1,
        temp_id: tempId
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
          createdAt: new Date(),
          user: { _id: user?.id || 1, name: user?.first_name || "User" },
          image: imageUri,
        },
      ]);
    }
  };

  const updateHeader = useCallback(() => {
    navigation.setOptions({
      
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
           
          <TouchableOpacity onPress={() => console.log("Delete Selected")}>
          <MaterialCommunityIcons
      name="delete"
      size={25}
      color={themeColors.text}
      style={{   marginRight: 10, fontSize: rMS(25)}}
    />

          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Forward Selected")}>
          <MaterialCommunityIcons
      name="share-circle"
      size={25}
      color={themeColors.text}
      style={{   marginRight: 10, fontSize: rMS(25)}}
      />
      </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log("Reply Selected")}>
          <MaterialCommunityIcons
      name="reply"
      size={25}
      color={themeColors.text}
      style={{   marginRight: 10, fontSize: rMS(25)}}
      />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log("Reply Selected")}>
          <MaterialCommunityIcons
      name="content-copy"
      size={25}
      color={themeColors.text}
      style={{   marginRight: 10, fontSize: rMS(25)}}
      />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelectedMessages([])}>
            <Text style={{ color: themeColors.text, fontSize: rMS(19) }}> Deselect ({selectedMessages.length})</Text>
          </TouchableOpacity>
        
        </View>
      ),
      headerTitle: () => (
        <Text style={{ color: themeColors.text, fontSize: rMS(19) }}>
         
        </Text>
      )
      
    });
  }, [selectedMessages, navigation, themeColors, route.params?.name]);

  const handleLongPress = useCallback((message: IMessage) => {
    const isSelected = selectedMessages.some((m) => m._id === message._id);
  
    const updatedSelectedMessages = isSelected
      ? selectedMessages.filter((m) => m._id !== message._id)
      : [...selectedMessages, message];
  
    setSelectedMessages(updatedSelectedMessages);
  
    const updatedMessages = messages.map((m) =>
      m._id === message._id ? { ...m, isChecked: !isSelected } : m
    );
  
    setMessages(updatedMessages);
    updateHeader();
  }, [selectedMessages, messages, updateHeader]);
  
  
 
  
  // In your useEffect for updating the header when no messages are selected
  useEffect(() => {
    if (selectedMessages.length === 0) {
      navigation.setOptions({
        headerRight: () => null,
        headerTitle: () => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CommunityDetailScreen", {
                id: communityId,
              })
            }
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ color: themeColors.tint, fontSize: rMS(19) }}>
              {route.params?.name ?? "Chat"}
            </Text>
          </TouchableOpacity>
        )
      });
    } else {
      updateHeader();
    }
  }, [selectedMessages, navigation, communityId, route.params?.name, themeColors, updateHeader]);
  
  // Update your renderBubble function to use the isChecked property for visual feedback
const renderBubble = (props) => {
  const isSelected = selectedMessages.some(m => m._id === props.currentMessage._id);
  const isFirstMessageOfBlock = props.previousMessage?.user?._id !== props.currentMessage.user._id;
  const isOtherUser = props.currentMessage.user._id !== user?.id;
  const isNewDay = 
    !props.previousMessage ||
    (props.currentMessage?.createdAt && 
     props.previousMessage?.createdAt && 
     props.currentMessage.createdAt.toDateString() !== 
     props.previousMessage.createdAt.toDateString());

  return (
    <TouchableOpacity 
    onPress={() => {
      if (selectedMessages.length > 0) {
        handleLongPress(props.currentMessage);
      }
    }
  }
  onLongPress={() => handleLongPress(props.currentMessage)}  
  style={isSelected ? styles.blurBackground : {}}
  >
    <Bubble
      {...props}
      wrapperStyle={{
        ...props.wrapperStyle,
        ...(isSelected && {
          padding: 2,
          borderWidth: 1,
          borderColor: 'rgba(0, 123, 255, 0.5)',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderRadius: 5 
        })
      }}
      renderCustomView={() =>
        (isOtherUser && (isFirstMessageOfBlock || isNewDay)) ? (
          <Text style={styles.username}>
            {props.currentMessage.user.name}
          </Text>
        ) : null
      }
      onPress={() => {
        if (selectedMessages.length > 0) {
          handleLongPress(props.currentMessage);
        }
      }}
      onLongPress={() => handleLongPress(props.currentMessage)}
    />
    </TouchableOpacity>
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

  const onImagePress = (uri: string) => {
    setMediaUri(uri);
    setIsImageViewerVisible(true);
  };

  const onVideoPress = (uri: string) => {
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
    blurBackground: {
      // Simulates blur by reducing opacity
      opacity: 0.7,
      backgroundColor: themeColors.tint,
      width: "100%"
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
          minInputToolbarHeight={insets.bottom + 50}
          scrollToBottom={true}
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