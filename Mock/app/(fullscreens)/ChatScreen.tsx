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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import axios from "axios";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import Colors from "../../constants/Colors";
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

import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import { useWebSocket } from "../../webSocketProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rMS, rV } from "../../constants";
import { router } from "expo-router";

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as { communityId: string };

  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { socket, isConnected, sendMessage, markMessageAsRead } = useWebSocket();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<IMessage[]>([]);
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

  const chatRef = useRef<GiftedChat>(null);

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
        status: data.user.status || "sent",
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
      const onMessage = (event) => {
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
          } else if (
            data.type === "message" &&
            data.community_id === communityId
          ) {
            const newMessage = normalizeMessage(data);
            if (newMessage) {
              setMessages((prevMessages) => {
                const updatedMessages = [newMessage, ...prevMessages].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );

                if (user?.id !== newMessage.user._id) {
                  socket.send(
                    JSON.stringify({
                      type: "message_status_update",
                      message_id: newMessage._id,
                      status: "read",
                    })
                  );
                  updatedMessages[0].status = "read";
                }

                AsyncStorage.setItem(
                  `messages_${communityId}`,
                  JSON.stringify(updatedMessages)
                );
                AsyncStorage.setItem(
                  `last_message_${communityId}`,
                  JSON.stringify({
                    ...newMessage,
                    status: "read",
                  })
                );
                markMessageAsRead(communityId);
                setTimeout(() => {
                  chatRef.current?.scrollToBottom();
                }, 100);
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
              if (prevMessages[0]?._id === data.message_id) {
                AsyncStorage.setItem(
                  `last_message_${communityId}`,
                  JSON.stringify(updatedMessages[0] || {})
                );
              }
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
              if (prevMessages[0]?._id === data.message_id) {
                AsyncStorage.setItem(
                  `last_message_${communityId}`,
                  JSON.stringify({ ...updatedMessages[0], status: "read" })
                );
              }
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
  }, [socket, communityId, messages, user]);

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
    };

    // Add this message to UI before sending to server
    setMessages((prevMessages) => [message, ...prevMessages]);

    // Send to server
    sendMessage({
      type: "send_message",
      community_id: communityId,
      message: "", // Text can be empty for media messages
      sender: user?.first_name + " " + user?.last_name || "Unknown User",
      sender_id: user?.id || 1,
      temp_id: tempId,
      [type]: fileUri
    });
  }, [communityId, sendMessage, user]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      for (let message of newMessages) {
        const tempId = Math.random().toString();
        const tempMessage = {
          _id: tempId,
          text: message.text,
          createdAt: new Date(),
          user: {
            _id: user?.id || 1,
            name: user?.first_name + " " + user?.last_name || "Unknown User",
          },
          image: mediaPreview.uri && mediaPreview.type === 'image' ? mediaPreview.uri : undefined,
          document: mediaPreview.uri && mediaPreview.type === 'document' ? mediaPreview.uri : undefined,
          ...(replyToMessage && { replyTo: replyToMessage._id }),
        };
        setReplyToMessage(null); // Clear reply after message is sent
        setMediaPreview({ type: null, uri: null }); // Clear media preview after sending

        sendMessage({
          type: "send_message",
          community_id: communityId,
          message: message.text || "", 
          sender: user?.first_name + " " + user?.last_name || "Unknown User",
          sender_id: user?.id || 1,
          temp_id: tempId,
          ...(replyToMessage && { reply_to: replyToMessage._id }),
          image: tempMessage.image ? tempMessage.image : undefined, // Ensure image is sent if present
          document: tempMessage.document ? tempMessage.document : undefined, // Ensure document is sent if present
        });
      }
    },
    [communityId, sendMessage, user, replyToMessage, mediaPreview]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      await sendMediaMessage(imageUri, 'image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', 
        copyToCacheDirectory: true
      });
 
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
        const isSelected = prevSelectedMessages.some(
          (m) => m._id === message._id
        );
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
      setEditingMessage(null);
      setMessageInput("");
    }
  }, [editingMessage, messageInput, sendMessage]);

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
              setSelectedMessages([]);
            },
          },
        ]
      );
    }
  }, [selectedMessages, sendMessage, canEditDeleteOrReply]);

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
                    size={25}
                    color={themeColors.text}
                    style={{ marginRight: 10, fontSize: rMS(25) }}
                  />
                </TouchableOpacity>
              )}
              {canEdit && (
                <TouchableOpacity onPressIn={handleEditMessage}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={25}
                    color={themeColors.text}
                    style={{ marginRight: 10, fontSize: rMS(25) }}
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
                    size={25}
                    color={themeColors.text}
                    style={{ marginRight: 10, fontSize: rMS(25) }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPressIn={handleCopySelected}>
                <MaterialCommunityIcons
                  name="content-copy"
                  size={25}
                  color={themeColors.text}
                  style={{ marginRight: 10, fontSize: rMS(25) }}
                />
              </TouchableOpacity>
              <TouchableOpacity onPressIn={handleDeselectAll}>
                <Text style={{ color: themeColors.text, fontSize: rMS(19) }}>
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
          <Text style={{ color: themeColors.text, fontSize: rMS(19) }}></Text>
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

        // Only toggle selection if there are already selected messages
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
            style={{ marginLeft: 0 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
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
                width: 40,
                height: 40,
                marginRight: 10,
                borderRadius: rMS(30),
              }}
            />
            <Text style={{ color: themeColors.text, fontSize: rMS(19) }}>
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
            renderCustomView={() => {
              if (
                props.currentMessage.replyTo &&
                props.currentMessage.replyTo._id !== null
              ) {
                return (
                  <View style={styles.replyContainer}>
                    <Text style={styles.replyName}>
                      Replying to {props.currentMessage.replyTo.user.name}
                    </Text>
                    <Text style={styles.replyText}>
                      {props.currentMessage.replyTo.text}
                    </Text>
                  </View>
                );
              }

              if (
                props.currentMessage.user._id !== user?.id &&
                (props.previousMessage?.user?._id !==
                  props.currentMessage.user._id ||
                  props.isFirst)
              ) {
                return (
                  <Text style={styles.username}>
                    {props.currentMessage.user.name}
                  </Text>
                );
              }

              return null;
            }}
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
    <TouchableOpacity onPress={() => onImagePress(props.currentMessage.image)}>
      <Image
        source={{ uri: props.currentMessage.image }}
        style={styles.messageImage}
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
        <Ionicons name="send" color="#ffffff" size={20} />
      </Send>
    </View>
  );

  const renderMediaPreview = () => {
    if (mediaPreview.uri) {
      return (
        <View style={styles.replyContainer}>
          {mediaPreview.type === 'image' ? (
            <Image source={{ uri: mediaPreview.uri }} style={[styles.previewImage, { width: '100%', height: 150 }]} />
          ) : (
            <Text style={styles.previewDocument}>{mediaPreview.uri.split('/').pop()}</Text>
          )}
          <TouchableOpacity 
            style={styles.closeReplyButton} 
            onPress={() => setMediaPreview({ type: null, uri: null })}
          >
            <Ionicons name="close" color={themeColors.text} size={20} />
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
                            <Ionicons name="close" color={themeColors.text} size={20} />
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
                            <Ionicons name="close" color={themeColors.text} size={20} />
                          </TouchableOpacity>
                        </View>
                      )}
                      <InputToolbar
                        {...props}
                        containerStyle={[
                          styles.inputToolbar,
                          (editingMessage || replyToMessage || mediaPreview.uri) && { marginTop: 0 },
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
                                  size={24}
                                  style={styles.attachIcon}
                                />
                              </TouchableOpacity>
                            ) : (
                              <>
                                <TouchableOpacity onPress={pickImage}>
                                  <Ionicons
                                    name="image-outline"
                                    color={themeColors.text}
                                    size={24}
                                    style={styles.attachIcon}
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={pickDocument}>
                                  <Ionicons
                                    name="document-outline"
                                    color={themeColors.text}
                                    size={24}
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
                    padding: 2,
                  },
                  blurBackground: {
                    opacity: 0.7,
                    backgroundColor: themeColors.tint,
                    width: "100%",
                  },
                  username: {
                    fontSize: 12,
                    color: themeColors.textSecondary,
                    marginBottom: 2,
                    fontWeight: "bold",
                    marginLeft: 10,
                    paddingRight: 20,
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
                  messageVideo: {
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
                  inputToolbar: {
                    backgroundColor: themeColors.background,
                    borderTopWidth: 0,
                    paddingHorizontal: 10,
                    paddingBottom: 35,
                    paddingTop: 10,
                    opacity: 0.9,
                  },
                  inputField: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: themeColors.normalGrey,
                    borderRadius: 20,
                    flex: 1,
                    paddingVertical: rV(6),
                    paddingHorizontal: 12,
                    marginRight: 10,
                  },
                  editedText: {
                    fontSize: 10,
                    color: themeColors.textSecondary,
                    padding: 2,
                  },
                  attachIcon: {
                    marginLeft: 8,
                  },
                  textInput: {
                    flex: 1,
                    color: themeColors.text,
                    fontSize: 16,
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
                    padding: 8,
                    borderRadius: 5,
                    borderLeftWidth: 4,
                    borderLeftColor: "#007AFF",
                    marginRight: 5,
                    width: "100%",
                  },
                  replyText: {
                    color: "#000",
                    fontSize: 12,
                    marginBottom: 4,
                  },
                  replyName: {
                    color: "#007AFF",
                    fontSize: 12,
                    fontWeight: "bold",
                  },
                  closeReplyButton: {
                    position: "absolute",
                    right: 10,
                    top: 10,
                  },
                  documentText: {
                    color: themeColors.text,
                    fontSize: 14,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: themeColors.textSecondary,
                    borderRadius: 5,
                    marginVertical: 5,
                  },
                  previewImage: {
                    width: '100%',
                    height: 200,
                    marginBottom: 10,
                  },
                  previewDocument: {
                    color: themeColors.text,
                    fontSize: 16,
                    marginBottom: 10,
                  },
                });
              
                return (
                  <ImageBackground
                    source={{ uri: backgroundImage }}
                    style={{ flex: 1, paddingTop: 1 }}
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
                     
                        renderMessageDocument={renderMessageDocument}
                        renderDay={renderDay}
                        minInputToolbarHeight={insets.bottom + 50}
                        scrollToBottom={true}
                        isTyping={false}
                        inverted={true}
                      />
                    )}
              
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