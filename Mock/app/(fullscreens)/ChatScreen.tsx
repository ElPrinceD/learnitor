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
  KeyboardAvoidingView,
  Keyboard,
  ToastAndroid,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import FastImage from 'react-native-fast-image';
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import axios from "axios";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ImageViewing from 'react-native-image-viewing';
import { useAuth } from "../../components/AuthContext";
import { Message } from "../../components/types";
import {
  GiftedChat,
  Bubble,
  Send,
  SystemMessage,
  IMessage,
  InputToolbar,
} from "react-native-gifted-chat";
import PreloadImage from "../../components/PreloadImage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import { useWebSocket } from "../../webSocketProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { FONT } from "../../constants";
import { router } from "expo-router";

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as { communityId: string };
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { socket, isConnected, sendMessage, markMessageAsRead } = useWebSocket();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { width } = Dimensions.get('window');
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<IMessage[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ type: 'image' | 'document' | null, uri: string | null }>({ type: null, uri: null });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);
  const [isDocumentViewerVisible, setIsDocumentViewerVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);

  const normalizeMessage = (data) => {
    if ("message" in data && "sent_at" in data) {
      return {
        _id: data.id,
        text: data.message,
        createdAt: new Date(data.sent_at),
        user: {
          _id: data.sender_id,
          name: data.sender,
          avatar: data.sender_image,
        },
        status: data.status || "sent",
        replyTo: data.reply_to
          ? {
              _id: data.reply_to.id || null,
              text: data.reply_to.snippet || null,
              user: {
                _id: data.reply_to.sender_id || null,
                name: data.reply_to.sender_name || null,
              },
            }
          : null,
        image: data.image || null,
        document: data.document || null,
      };
    } else if ("_id" in data && "createdAt" in data) {
      return {
        _id: data._id,
        text: data.text,
        createdAt: new Date(data.createdAt),
        user: data.user,
        status: data.status || "sent",
        replyTo: data.replyTo
          ? {
              _id: data.replyTo._id,
              text: data.replyTo.text,
              user: data.replyTo.user,
            }
          : null,
        image: data.image || null,
        document: data.document || null,
      };
    } else {
      console.warn("Unknown message format received:", data);
      return null;
    }
  };

  const backgroundImage =
    colorScheme === "dark"
      ? "https://images.pexels.com/photos/9665185/pexels-photo-9665185.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      : "https://images.pexels.com/photos/7599590/pexels-photo-7599590.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  const fetchMessageHistory = useCallback(async () => {
    try {
      setLoading(true);
      const cachedMessages = await AsyncStorage.getItem(
        `messages_${communityId}`
      );

      if (cachedMessages) {
        let parsedMessages = JSON.parse(cachedMessages).map(normalizeMessage);

        const validMessages = parsedMessages
          .filter((msg): msg is IMessage => msg !== null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setMessages(validMessages);
      } else {
        await sendMessage({ type: "fetch_history", community_id: communityId });
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
      return () => {};
    }, [fetchMessageHistory])
  );

  useEffect(() => {
    let socketCleanup = () => {};
  
    if (socket) {
      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
  
          if (data.type === "history" && data.community_id === communityId) {
            const transformedMessages = data.messages
              .map(normalizeMessage)
              .filter((msg): msg is IMessage => msg !== null)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
            setMessages(transformedMessages);
            AsyncStorage.setItem(
              `messages_${communityId}`,
              JSON.stringify(transformedMessages)
            );
          } else if (data.type === "message" && data.community_id === communityId) {
            const newMessage = normalizeMessage(data);
            if (newMessage) {
              setMessages((prevMessages) => {
                if (data.temp_id) {
                  const foundIndex = prevMessages.findIndex(
                    (msg) => msg._id === data.temp_id
                  );
                  if (foundIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[foundIndex] = newMessage;
                    if (user?.id === newMessage.user._id) {
                      updatedMessages[foundIndex].status = "read";
                    }
                    
                    AsyncStorage.setItem(
                      `messages_${communityId}`,
                      JSON.stringify(updatedMessages)
                    );
                    return updatedMessages;
                  }
                }
                const updatedMessages = [newMessage, ...prevMessages].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );
                if (user?.id === newMessage.user._id) {
                  updatedMessages[0].status = "read";
                }
                AsyncStorage.setItem(
                  `messages_${communityId}`,
                  JSON.stringify(updatedMessages)
                );
                return updatedMessages;
              });
            }
          } else if (data.type === "message_delete") {
            setMessages((prevMessages) => {
              const updatedMessages = prevMessages.filter(
                (m) => m._id !== data.message_id
              );
              AsyncStorage.setItem(
                `messages_${communityId}`,
                JSON.stringify(updatedMessages)
              );
              return updatedMessages;
            });
          } else if (data.type === "message_edit") {
            setMessages((prevMessages) => {
              const updatedMessages = prevMessages.map((m) =>
                m._id === data.message_id
                  ? { ...m, text: data.new_content, isEdited: true }
                  : m
              );
              AsyncStorage.setItem(
                `messages_${communityId}`,
                JSON.stringify(updatedMessages)
              );
              return updatedMessages;
            });
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
  
      socket.addEventListener("message", onMessage);
      socketCleanup = () => {
        socket.removeEventListener("message", onMessage);
      };
    }
  
    return socketCleanup;
  }, [socket, communityId, user]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const sendMediaMessage = useCallback(async (fileUri: string, type: 'image' | 'document') => {
    const tempId = Math.random().toString();
    const message = {
      _id: tempId,
      text: "",
      createdAt: new Date(),
      user: {
        _id: user?.id || 1,
        name: user?.first_name + " " + user?.last_name || "Unknown User",
      },
      [type]: fileUri,
      status: isConnected ? "sending" : "pending",
    };
  
    setMessages((prevMessages) => {
      if (!prevMessages.some(msg => msg._id === tempId)) {
        return [message, ...prevMessages];
      }
      return prevMessages;
    });
  
    if (!communityId) {
      console.error('Community ID missing before sending message');
      return;
    }
    
    if (!isConnected) {
      const messageToStore = {
        ...message,
        communityId: communityId,
        content: {
          [type]: fileUri
        },
      };
      AsyncStorage.setItem(`unsent_message_${tempId}`, JSON.stringify(messageToStore));
    } else {
      sendMessage({
        type: "send_message",
        community_id: communityId,
        message: "", 
        sender: user?.first_name + " " + user?.last_name || "Unknown User",
        sender_id: user?.id || 1,
        temp_id: tempId,
        [type]: fileUri
      });
    }
  }, [communityId, sendMessage, user, isConnected]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      for (let message of newMessages) {
        const tempId = Math.random().toString();
        const tempMessage: IMessage = {
          _id: tempId,
          text: message.text,
          createdAt: new Date(),
          user: {
            _id: user?.id || 1,
            name: user?.first_name + " " + user?.last_name || "Unknown User",
          },
          image: mediaPreview.uri && mediaPreview.type === "image" ? mediaPreview.uri : undefined,
          document: mediaPreview.uri && mediaPreview.type === "document" ? mediaPreview.uri : undefined,
          status: isConnected ? "sending" : "pending",
          ...(replyToMessage && { replyTo: replyToMessage._id }),
        };
  
        setReplyToMessage(null);
        setMediaPreview({ type: null, uri: null });
  
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === tempId)) {
            return [tempMessage, ...prevMessages];
          }
          return prevMessages;
        });
  
        if (!isConnected) {
          const messageToStore = {
            ...tempMessage,
            communityId: communityId,
            content: {
              text: message.text,
              image: tempMessage.image ? tempMessage.image : undefined,
              document: tempMessage.document ? tempMessage.document : undefined,
            },
            replyTo: replyToMessage?._id,
          };
          AsyncStorage.setItem(`unsent_message_${tempId}`, JSON.stringify(messageToStore));
        } else {
          sendMessage({
            type: "send_message",
            community_id: communityId,
            message: message.text || "",
            sender: user?.first_name + " " + user?.last_name || "Unknown User",
            sender_id: user?.id || 1,
            temp_id: tempId,
            ...(replyToMessage && { reply_to: replyToMessage._id }),
            image: tempMessage.image ? tempMessage.image : undefined,
            document: tempMessage.document ? tempMessage.document : undefined,
          });
        }
      }
    },
    [communityId, sendMessage, user, replyToMessage, isConnected, mediaPreview]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const file = await fetch(asset.uri);
      const blob = await file.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        const imageBase64 = `data:${blob.type};base64,${base64data.split(',')[1]}`;
        await sendMediaMessage(imageBase64, 'image');
      };
      reader.readAsDataURL(blob);
    }
  };

  const pickDocument = async () => {
    try {
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: '*/*', 
      //   copyToCacheDirectory: true
      // });
 
      if (result.type === 'success') {
        await sendMediaMessage(result.uri, 'document');
      }
    } catch (error) {
      console.error("Document picker error:", error);
    }
  };

  const handleForwardSelected = useCallback(() => {
    // TODO: Implement the logic for forwarding messages
  }, [selectedMessages]);

  const handleCopySelected = useCallback(async () => {
    let textToCopy = selectedMessages.map((msg) => msg.text).join("\n\n");
    await Clipboard.setStringAsync(textToCopy);
    ToastAndroid.show("Messages copied to clipboard", ToastAndroid.SHORT);
  }, [selectedMessages]);

  const handleLongPress = useCallback(
    (message: IMessage) => {
      const isSelected = selectedMessages.some((m) => m._id === message._id);
      setSelectedMessages((prevSelectedMessages) => {
        const isSelected = prevSelectedMessages.some((m) => m._id === message._id);
        return isSelected
          ? prevSelectedMessages.filter((m) => m._id !== message._id)
          : [...prevSelectedMessages, message];
      });

      const updatedMessages = messages.map((m) =>
        m._id === message._id ? { ...m, isChecked: !isSelected } : m
      );
      setMessages(updatedMessages);
    },
    [selectedMessages, messages]
  );

  const handleDeselectAll = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  const canEditDeleteOrReply = useCallback(() => {
    const userMessages = selectedMessages.filter(
      (msg) => msg.user._id === user?.id
    );
    return {
      canEdit: selectedMessages.length === 1 && userMessages.length === 1,
      canDelete:
        userMessages.length === selectedMessages.length &&
        userMessages.length > 0,
      canReply: selectedMessages.length === 1,
    };
  }, [selectedMessages, user]);

  const handleEditMessage = useCallback(() => {
    if (canEditDeleteOrReply().canEdit) {
      setEditingMessage(selectedMessages[0]);
      setMessageInput(selectedMessages[0].text || "");
    }
  }, [canEditDeleteOrReply, selectedMessages]);

  const onEditMessage = useCallback(() => {
    if (editingMessage) {
      sendMessage({
        type: "edit_message",
        message_id: editingMessage._id,
        new_content: messageInput,
      });
      setMessages((prevMessages) => prevMessages.map(m => 
        m._id === editingMessage._id ? { ...m, text: messageInput, isEdited: true } : m
      ));
      AsyncStorage.setItem(
        `messages_${communityId}`,
        JSON.stringify(messages)
      );
      setEditingMessage(null);
      setMessageInput("");
    }
  }, [editingMessage, messageInput, sendMessage, messages, communityId]);

  const handleDeleteMessage = useCallback(() => {
    const { canDelete } = canEditDeleteOrReply();
    if (canDelete) {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete these messages?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: () => {
              selectedMessages.forEach((message) => {
                sendMessage({
                  type: "delete_message",
                  message_id: message._id,
                });
              });
              setMessages((prevMessages) =>
                prevMessages.filter(
                  (m) =>
                    !selectedMessages.some((selMsg) => selMsg._id === m._id)
                )
              );
              AsyncStorage.setItem(
                `messages_${communityId}`,
                JSON.stringify(messages)
              );
              setSelectedMessages([]);
            },
          },
        ]
      );
    }
  }, [selectedMessages, sendMessage, canEditDeleteOrReply, messages, communityId]);

  const updateHeader = useCallback(() => {
    const { canDelete, canEdit, canReply } = canEditDeleteOrReply();

    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          {selectedMessages.length > 0 && (
            <>
              {canDelete && (
                <TouchableOpacity onPressIn={handleDeleteMessage}>
                  <MaterialCommunityIcons
                    name="delete"
                    size={SIZES.large}
                    color={themeColors.text}
                    style={{ marginRight: SIZES.small, fontSize: rMS(SIZES.large) }}
                  />
                </TouchableOpacity>
              )}
              {canEdit && (
                <TouchableOpacity onPressIn={handleEditMessage}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={SIZES.large}
                    color={themeColors.text}
                    style={{ marginRight: SIZES.small, fontSize: rMS(SIZES.large) }}
                  />
                </TouchableOpacity>
              )}
              {canReply && (
                <TouchableOpacity
                  onPressIn={() => {
                    console.log("Reply button pressed");
                    setReplyToMessage(selectedMessages[0]);
                  }}
                >
                  <MaterialCommunityIcons
                    name="reply"
                    size={SIZES.large}
                    color={themeColors.text}
                    style={{ marginRight: SIZES.small, fontSize: rMS(SIZES.large) }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPressIn={handleCopySelected}>
                <MaterialCommunityIcons
                  name="content-copy"
                  size={SIZES.large}
                  color={themeColors.text}
                  style={{ marginRight: SIZES.small, fontSize: rMS(SIZES.large) }}
                />
              </TouchableOpacity>
              <TouchableOpacity onPressIn={handleDeselectAll}>
                <Text style={{ color: themeColors.text, fontSize: rMS(SIZES.large) }}>
                  {" "}
                  Deselect ({selectedMessages.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
      headerTitle: () => (
        <TouchableOpacity
          onPressIn={() =>
            navigation.navigate("CommunityDetailScreen", { id: communityId })
          }
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text style={{ color: themeColors.text, fontSize: rMS(SIZES.large) }}></Text>
        </TouchableOpacity>
      ),
    });
  }, [
    selectedMessages,
    navigation,
    communityId,
    themeColors,
    handleCopySelected,
    handleDeleteMessage,
    handleEditMessage,
    canEditDeleteOrReply,
  ]);

  const handlePress = useCallback(
    (message: IMessage) => {
      setSelectedMessages((prevSelectedMessages) => {
        const isSelected = prevSelectedMessages.some(
          (m) => m._id === message._id
        );
        const currentLength = prevSelectedMessages.length;

        if (currentLength > 0 || isSelected) {
          return isSelected
            ? prevSelectedMessages.filter((m) => m._id !== message._id)
            : [...prevSelectedMessages, message];
        }

        return prevSelectedMessages;
      });
    },
    [selectedMessages, navigation, communityId, themeColors, handleCopySelected]
  );

  useEffect(() => {
    if (selectedMessages.length === 0) {
      navigation.setOptions({
        headerRight: () => null,
        headerLeft: () => (
          <TouchableOpacity
            onPressIn={() => navigation.goBack()}
            style={{ marginLeft: SIZES.xSmall }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={SIZES.large}
              color={themeColors.text}
            />
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "CommunityDetailScreen",
                params: { id: communityId },
              });
            }}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Image
              source={{ uri: route.params?.image }}
              style={{
                width: rS(40),
                height: rS(40),
                marginRight: SIZES.small,
                borderRadius: rMS(SIZES.xLarge),
              }}
            />
            <Text style={{ color: themeColors.text, fontSize: rMS(SIZES.large) }}>
              {route.params?.name ?? "Chat"}
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      updateHeader();
    }
  }, [
    selectedMessages,
    navigation,
    communityId,
    route.params?.name,
    themeColors,
    updateHeader,
  ]);

  const renderBubble = useCallback(
    (props) => {
      const isSelected = selectedMessages.some(
        (m) => m._id === props.currentMessage._id
      );

      return (
        <TouchableOpacity
          onPressIn={() => handlePress(props.currentMessage)}
          onLongPress={() => handleLongPress(props.currentMessage)}
          style={
            isSelected
              ? [props.containerStyle, styles.blurBackground]
              : props.containerStyle
          }
        >
          <Bubble
            {...props}
            wrapperStyle={{
              ...props.wrapperStyle,
              ...(isSelected && styles.blurBackground),
            }}
            onPressIn={() => handlePress(props.currentMessage)}
            onLongPress={() => handleLongPress(props.currentMessage)}
            renderCustomView={() => (
              <>
                {props.currentMessage.replyTo && props.currentMessage.replyTo._id !== null && (
                  <View style={styles.replyContainer}>
                    <Text style={styles.replyName}>
                      Replying to {props.currentMessage.replyTo.user.name}
                    </Text>
                    <Text style={styles.replyText}>
                      {props.currentMessage.replyTo.text}
                    </Text>
                  </View>
                )}
                {props.currentMessage.user._id === user?.id && (
                  <Text style={styles.statusText}>
                    {props.currentMessage.status === 'pending' ? 'Pending' : 
                     props.currentMessage.status === 'sending' ? 'Sending' : 
                     props.currentMessage.status === 'sent' ? 'Sent' : 
                     props.currentMessage.status === 'read' ? 'Read' : ''}
                  </Text>
                )}
              </>
            )}
          />
          {props.currentMessage.isEdited && (
            <Text
              style={[
                styles.editedText,
                {
                  alignSelf:
                    props.position === "left" ? "flex-start" : "flex-end",
                },
              ]}
            >
              Edited
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [selectedMessages, user?.id, handlePress, handleLongPress, messages]
  );

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
          {currentMessage.createdAt
            ? currentMessage.createdAt.toDateString()
            : "Unknown Date"}
        </Text>
      </View>
    );
  };

  const onImagePress = (uri: string) => {
    setMediaUri(uri);
    setIsImageViewerVisible(true);
  };

  const onDocumentPress = (uri: string) => {
    setMediaUri(uri);
    setIsDocumentViewerVisible(true);
  };

  const renderMessageImage = (props) => (
    <TouchableOpacity 
      key={props.currentMessage._id} 
      onPress={() => onImagePress(props.currentMessage.image)}
      style={styles.messageImageContainer}
    >
      <Image 
        source={{ uri: props.currentMessage.image }}
        style={{
          width: rS(320),
          height: rV(200),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );

  const renderMessageDocument = (props) => (
    <TouchableOpacity onPress={() => onDocumentPress(props.currentMessage.document)}>
      <Text style={styles.documentText}>Document: {props.currentMessage.document.split('/').pop()}</Text>
    </TouchableOpacity>
  );

  const renderSend = (props) => (
    <View style={styles.sendContainer}>
      <Send {...props} containerStyle={styles.sendButton} alwaysShowSend>
        <Ionicons name="send" color="#ffffff" size={SIZES.large} />
      </Send>
    </View>
  );

  const renderMediaPreview = () => {
    if (mediaPreview.uri) {
      return (
        <View style={styles.replyContainer}>
          {mediaPreview.type === 'image' ? (
            <Image source={{ uri: mediaPreview.uri }} style={[styles.previewImage, { width: '100%', height: rV(150) }]} />
          ) : (
            <Text style={styles.previewDocument}>{mediaPreview.uri.split('/').pop()}</Text>
          )}
          <TouchableOpacity 
            style={styles.closeReplyButton} 
            onPress={() => setMediaPreview({ type: null, uri: null })}
          >
            <Ionicons name="close" color={themeColors.text} size={SIZES.medium} />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderInputToolbar = (props) => {
    return (
      <View>
        {renderMediaPreview()}
        {editingMessage && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyName}>
              Editing Message by {editingMessage.user.name}
            </Text>
            <TouchableOpacity
              onPress={() => setEditingMessage(null)}
              style={styles.closeReplyButton}
            >
              <Ionicons name="close" color={themeColors.text} size={SIZES.medium} />
            </TouchableOpacity>
          </View>
        )}
        {replyToMessage && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyName}>
              Replying to {replyToMessage.user.name}
            </Text>
            <Text style={styles.replyText}>{replyToMessage.text}</Text>
            <TouchableOpacity
              onPress={() => setReplyToMessage(null)}
              style={styles.closeReplyButton}
            >
              <Ionicons name="close" color={themeColors.text} size={SIZES.medium} />
            </TouchableOpacity>
          </View>
        )}
        <InputToolbar
          {...props}
          containerStyle={[
            styles.inputToolbar,
            (editingMessage || replyToMessage || mediaPreview.uri) && { marginTop: rV(0) },
          ]}
          primaryStyle={{ alignItems: "center", flexDirection: "row" }}
          renderComposer={() => (
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  editingMessage
                    ? "Edit message"
                    : replyToMessage
                    ? "Reply to message"
                    : "Message"
                }
                placeholderTextColor={themeColors.textSecondary}
                value={props.text}
                onChangeText={props.onTextChanged}
              />
              {editingMessage ? (
                <TouchableOpacity onPress={onEditMessage}>
                  <Ionicons
                    name="checkmark"
                    color={themeColors.text}
                    size={SIZES.large}
                    style={styles.attachIcon}
                  />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={pickImage}>
                    <Ionicons
                      name="image-outline"
                      color={themeColors.text}
                      size={SIZES.large}
                      style={styles.attachIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickDocument}>
                    <Ionicons
                      name="document-outline"
                      color={themeColors.text}
                      size={SIZES.large}
                      style={styles.attachIcon}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        />
      </View>
    );
  };

  const renderAvatar = (props) => {
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
      padding: SIZES.small,
    },
    messageImageContainer: {
      borderRadius: rMS(SIZES.small),
      padding: SIZES.small,
      marginVertical: SIZES.small,
    },
    statusText: {
      fontSize: SIZES.xSmall,
      color: themeColors.textSecondary,
      textAlign: 'right',
      paddingRight: SIZES.xSmall,
    },
    blurBackground: {
      opacity: 0.7,
      backgroundColor: themeColors.tint,
      width: "100%",
    },
    username: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginBottom: SIZES.xSmall,
      fontWeight: "bold",
      marginLeft: SIZES.small,
      paddingRight: SIZES.medium,
    },
    avatarContainer: {
      width: rS(36),
      height: rS(36),
      borderRadius: rMS(18),
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
      fontSize: SIZES.medium,
    },
    dateContainer: {
      paddingVertical: rV(4),
      paddingHorizontal: rS(8),
      borderRadius: rMS(10),
      alignSelf: "center",
      marginVertical: rV(10),
    },
    dateText: {
      color: themeColors.textSecondary,
      fontSize: SIZES.small,
      fontWeight: "bold",
    },
    messageImage: {
      width: rS(300),
      height: rV(200),
      borderRadius: rMS(10),
      margin: SIZES.small,
    },
    messageVideo: {
      width: rS(200),
      height: rV(200),
      borderRadius: rMS(10),
      margin: SIZES.small,
    },
    sendContainer: {
      height: rV(44),
      width: rS(55),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SIZES.medium,
      paddingHorizontal: SIZES.xSmall,
      backgroundColor: themeColors.tint,
      borderRadius: rMS(20),
      marginHorizontal: SIZES.xSmall,
    },
    sendButton: {
      justifyContent: "center",
    },
    inputToolbar: {
      backgroundColor: themeColors.background,
      borderTopWidth: 0,
      paddingHorizontal: SIZES.small,
      paddingBottom: insets.bottom + rV(35),
      paddingTop: rV(10),
      opacity: 0.9,
    },
    inputField: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.normalGrey,
      borderRadius: rMS(20),
      flex: 1,
      paddingVertical: rV(6),
      paddingHorizontal: SIZES.small,
      marginRight: SIZES.small,
    },
    editedText: {
      fontSize: SIZES.xSmall,
      color: themeColors.textSecondary,
      padding: SIZES.xSmall,
    },
    attachIcon: {
      marginLeft: SIZES.medium,
    },
    textInput: {
      flex: 1,
      color: themeColors.text,
      fontSize: SIZES.small,
      fontFamily: FONT.regular,
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
    replyContainer: {
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      backgroundColor: "#E6E6E6",
      padding: SIZES.small,
      borderRadius: rMS(5),
      borderLeftWidth: rS(4),
      borderLeftColor: "#007AFF",
      marginRight: SIZES.small,
      width: "100%",
    },
    replyText: {
      color: "#000",
      fontSize: SIZES.small,
      marginBottom: SIZES.xSmall,
    },
    replyName: {
      color: "#007AFF",
      fontSize: SIZES.small,
      fontWeight: "bold",
    },
    closeReplyButton: {
      position: "absolute",
      right: rS(10),
      top: rV(10),
    },
    documentText: {
      color: themeColors.text,
      fontSize: SIZES.small,
      padding: SIZES.small,
      borderWidth: rS(1),
      borderColor: themeColors.textSecondary,
      borderRadius: rMS(5),
      marginVertical: SIZES.small,
    },
    previewImage: {
      width: '100%',
      height: rV(200),
      marginBottom: SIZES.small,
    },
    previewDocument: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      marginBottom: SIZES.small,
    },
  });

  return (
    <ImageBackground
      source={{ uri: backgroundImage }}
      style={{ flex: 1, paddingTop: rV(1) }}
    >
      {loading ? (
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
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
          renderMessageDocument={renderMessageDocument}
          renderDay={renderDay}
          minInputToolbarHeight={insets.bottom + rV(50)}
          scrollToBottom={true}
          isTyping={false}
          inverted={true}
        />
      )}
      
      <ImageViewing
        images={[{ uri: mediaUri }]}
        imageIndex={0}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />

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

      <Modal
        visible={isDocumentViewerVisible && mediaUri !== null}
        transparent={true}
        onRequestClose={() => setIsDocumentViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setIsDocumentViewerVisible(false)}>
            {mediaUri && (
              <Text style={styles.documentText}>View Document: {mediaUri.split('/').pop()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default CommunityChatScreen;