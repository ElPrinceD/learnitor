import "react-native-get-random-values";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ImageBackground,
  useColorScheme,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  ToastAndroid,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import axios from "axios";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ImageView from "react-native-image-viewing";
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
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import { useWebSocket } from "../../webSocketProvider";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { FONT } from "../../constants";
import { router } from "expo-router";
import AppImage from "../../components/AppImage";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as { communityId: string };
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const {
    socket,
    isConnected,
    sendMessage,
    markMessageAsRead,
    sqliteGetItem,
    sqliteSetItem,
  } = useWebSocket();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageIds, setMessageIds] = useState(new Set<string>());
  const { width } = Dimensions.get("window");
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<IMessage[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    type: "image" | "document" | null;
    uri: string | null;
  }>({
    type: null,
    uri: null,
  });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>(
    []
  );
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);
  const [isDocumentViewerVisible, setIsDocumentViewerVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string>>(
    {}
  );

  const normalizeMessage = (data) => {
    if ("message" in data && "sent_at" in data) {
      return {
        _id: data.id || data.temp_id || Date.now().toString(),
        text: data.message,
        createdAt: new Date(data.sent_at),
        user: {
          _id: data.sender_id,
          name: data.sender || "Unknown User",
          avatar: data.sender_image,
        },
        status: data.status || "sent",
        replyTo: data.reply_to
          ? {
              _id: data.reply_to.id || null,
              text: data.reply_to.snippet || null,
              user: {
                _id: data.reply_to.sender_id || null,
                name: data.reply_to.sender_name || "Unknown User",
              },
            }
          : null,
        image: data.image || null,
        document: data.document || null,
        isEdited: data.is_edited || false,
        tempId: data.temp_id || undefined,
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
        isEdited: data.isEdited || false,
        tempId: data.tempId || undefined,
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
      const cachedMessages = await sqliteGetItem(`messages_${communityId}`);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages).map(normalizeMessage);
        const validMessages = parsedMessages
          .filter((msg): msg is IMessage => msg !== null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMessages(validMessages);
      }

      if (isConnected) {
        await sendMessage({ type: "fetch_history", community_id: communityId });
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      setError("Failed to load message history");
    } finally {
      setLoading(false);
    }
  }, [communityId, sendMessage, isConnected, sqliteGetItem]);

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

            setMessages((prevMessages) => {
              const pendingMessages = prevMessages.filter(
                (m) => m.status === "pending" || m.tempId
              );
              const updatedMessages = [
                ...pendingMessages,
                ...transformedMessages,
              ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
              sqliteSetItem(
                `messages_${communityId}`,
                JSON.stringify(updatedMessages)
              );
              return updatedMessages;
            });
          } else if (
            data.type === "message" &&
            data.community_id === communityId
          ) {
            const newMessage = normalizeMessage(data);
            if (newMessage) {
              setMessages((prevMessages) => {
                const index = prevMessages.findIndex(
                  (m) => m.tempId && m.tempId === data.temp_id
                );
                if (index !== -1) {
                  const updatedMessages = [...prevMessages];
                  updatedMessages[index] = { ...newMessage, tempId: undefined };
                  sqliteSetItem(
                    `messages_${communityId}`,
                    JSON.stringify(updatedMessages)
                  );
                  return updatedMessages;
                } else {
                  const updatedMessages = [newMessage, ...prevMessages];
                  sqliteSetItem(
                    `messages_${communityId}`,
                    JSON.stringify(updatedMessages)
                  );
                  return updatedMessages;
                }
              });
            }
          } else if (data.type === "message_delete") {
            setMessages((prevMessages) => {
              const updatedMessages = prevMessages.filter(
                (m) => m._id !== data.message_id
              );
              sqliteSetItem(
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
              sqliteSetItem(
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
  }, [socket, communityId, sqliteSetItem]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
        const { status: mediaStatus } =
          await MediaLibrary.requestPermissionsAsync();
        if (mediaStatus !== "granted") {
          alert("Sorry, we need media library permissions to save images.");
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (isConnected) {
      const sendUnsentMessages = async () => {
        try {
          const allKeysRaw = (await sqliteGetItem("storage_keys")) || "[]";
          let keys = [];
          try {
            keys = JSON.parse(allKeysRaw);
            if (!Array.isArray(keys)) {
              console.warn("storage_keys is not an array, resetting:", allKeysRaw);
              keys = [];
            }
          } catch (e) {
            console.error("Failed to parse storage_keys in sendUnsent:", e, "Raw value:", allKeysRaw);
            keys = [];
          }
          const unsentKeys = keys.filter((key: string) =>
            key.startsWith("unsent_message_")
          );
          for (const key of unsentKeys) {
            const messageStr = await sqliteGetItem(key);
            if (messageStr) {
              const message = JSON.parse(messageStr);
              sendMessage({
                type: "send_message",
                community_id: message.communityId,
                message: message.content.text || "",
                sender:
                  user?.first_name + " " + user?.last_name || "Unknown User",
                sender_id: user?.id || 1,
                temp_id: message.tempId,
                image: message.content.image || undefined,
                document: message.content.document || undefined,
                ...(message.replyTo && { reply_to: message.replyTo }),
              });
              await sqliteSetItem(key, ""); // Clear the unsent message
              const updatedKeys = keys.filter((k: string) => k !== key);
              await sqliteSetItem("storage_keys", JSON.stringify(updatedKeys));
            }
          }
        } catch (error) {
          console.error("Error sending unsent messages:", error);
        }
      };
      sendUnsentMessages();
    }
  }, [isConnected, sendMessage, user, sqliteGetItem, sqliteSetItem]);

  const sendMediaMessage = useCallback(
    async (fileUri: string, type: "image" | "document") => {
      const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const message = {
        _id: tempId,
        tempId,
        text: "",
        createdAt: new Date(),
        user: {
          _id: user?.id || 1,
          name: user?.first_name + " " + user?.last_name || "Unknown User",
        },
        [type]: fileUri,
        status: isConnected ? "sending" : "pending",
      };

      if (!messageIds.has(tempId)) {
        setMessages((prevMessages) => [message, ...prevMessages]);
        setMessageIds(new Set([...messageIds, tempId]));
      }

      if (!isConnected) {
        const messageToStore = {
          ...message,
          communityId,
          content: {
            text: "",
            [type]: fileUri,
          },
        };
        await sqliteSetItem(`unsent_message_${tempId}`, JSON.stringify(messageToStore));
        await sqliteSetItem(
          `messages_${communityId}`,
          JSON.stringify([message, ...messages])
        ); // Persist to message cache
        const allKeysRaw = await sqliteGetItem("storage_keys") || "[]";
        let keys = [];
        try {
          keys = JSON.parse(allKeysRaw);
          if (!Array.isArray(keys)) {
            console.warn("storage_keys is not an array, resetting:", allKeysRaw);
            keys = [];
          }
        } catch (e) {
          console.error("Failed to parse storage_keys in sendMediaMessage:", e, "Raw value:", allKeysRaw);
          keys = [];
        }
        if (!keys.includes(`unsent_message_${tempId}`)) {
          keys.push(`unsent_message_${tempId}`);
          await sqliteSetItem("storage_keys", JSON.stringify(keys));
        }
      } else {
        sendMessage({
          type: "send_message",
          community_id: communityId,
          message: "",
          sender: user?.first_name + " " + user?.last_name || "Unknown User",
          sender_id: user?.id || 1,
          temp_id: tempId,
          [type]: fileUri,
        });
      }
    },
    [communityId, sendMessage, user, isConnected, messageIds, sqliteSetItem, sqliteGetItem, messages]
  );

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      for (let message of newMessages) {
        const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const tempMessage: IMessage = {
          _id: tempId,
          tempId,
          text: message.text,
          createdAt: new Date(),
          user: {
            _id: user?.id || 1,
            name: user?.first_name + " " + user?.last_name || "Unknown User",
          },
          image: mediaPreview.uri && mediaPreview.type === "image" ? mediaPreview.uri : undefined,
          document: mediaPreview.uri && mediaPreview.type === "document" ? mediaPreview.uri : undefined,
          status: isConnected ? "sending" : "pending",
          ...(replyToMessage && {
            replyTo: {
              _id: replyToMessage._id,
              text: replyToMessage.text || (replyToMessage.image ? "Photo" : replyToMessage.document ? "Document" : ""),
              user: replyToMessage.user,
            },
          }),
        };

        setReplyToMessage(null);
        setMediaPreview({ type: null, uri: null });

        if (!messageIds.has(tempId)) {
          setMessages((prevMessages) => [tempMessage, ...prevMessages]);
          setMessageIds(new Set([...messageIds, tempId]));
        }

        if (!isConnected) {
          const messageToStore = {
            ...tempMessage,
            communityId,
            content: {
              text: tempMessage.text || "",
              image: tempMessage.image || undefined,
              document: tempMessage.document || undefined,
            },
          };
          await sqliteSetItem(`unsent_message_${tempId}`, JSON.stringify(messageToStore));
          await sqliteSetItem(
            `messages_${communityId}`,
            JSON.stringify([tempMessage, ...messages])
          ); // Persist to message cache
          const allKeysRaw = await sqliteGetItem("storage_keys") || "[]";
          let keys = [];
          try {
            keys = JSON.parse(allKeysRaw);
            if (!Array.isArray(keys)) {
              console.warn("storage_keys is not an array, resetting:", allKeysRaw);
              keys = [];
            }
          } catch (e) {
            console.error("Failed to parse storage_keys in onSend:", e, "Raw value:", allKeysRaw);
            keys = [];
          }
          if (!keys.includes(`unsent_message_${tempId}`)) {
            keys.push(`unsent_message_${tempId}`);
            await sqliteSetItem("storage_keys", JSON.stringify(keys));
          }
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

        if (replyToMessage) {
          setSelectedMessages([]);
        }
      }
    },
    [communityId, sendMessage, user, replyToMessage, isConnected, mediaPreview, messageIds, sqliteSetItem, sqliteGetItem, messages]
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
        const imageBase64 = `data:${blob.type};base64,${
          base64data.split(",")[1]
        }`;
        await sendMediaMessage(imageBase64, "image");
      };
      reader.readAsDataURL(blob);
    }
  };

  const pickDocument = async () => {
    try {
      // Assuming DocumentPicker is implemented elsewhere if needed
    } catch (error) {
      console.error("Document picker error:", error);
    }
  };

  const handleForwardSelected = useCallback(() => {
    // TODO: Implement forwarding logic
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
        const updated = isSelected
          ? prevSelectedMessages.filter((m) => m._id !== message._id)
          : [...prevSelectedMessages, message];
        return updated;
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
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((m) =>
          m._id === editingMessage._id
            ? { ...m, text: messageInput, isEdited: true }
            : m
        );
        sqliteSetItem(
          `messages_${communityId}`,
          JSON.stringify(updatedMessages)
        );
        return updatedMessages;
      });
      setEditingMessage(null);
      setMessageInput("");
      setSelectedMessages([]);
    }
  }, [editingMessage, messageInput, sendMessage, communityId, sqliteSetItem]);

  const handleDeleteMessage = useCallback(() => {
    const { canDelete } = canEditDeleteOrReply();
    if (canDelete) {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete these messages?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "OK",
            onPress: () => {
              selectedMessages.forEach((message) => {
                sendMessage({
                  type: "delete_message",
                  message_id: message._id,
                });
              });
              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.filter(
                  (m) =>
                    !selectedMessages.some((selMsg) => selMsg._id === m._id)
                );
                sqliteSetItem(
                  `messages_${communityId}`,
                  JSON.stringify(updatedMessages)
                );
                return updatedMessages;
              });
              setSelectedMessages([]);
            },
          },
        ]
      );
    }
  }, [
    selectedMessages,
    sendMessage,
    canEditDeleteOrReply,
    communityId,
    sqliteSetItem,
  ]);

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
                    style={{
                      marginRight: SIZES.small,
                      fontSize: rMS(SIZES.large),
                    }}
                  />
                </TouchableOpacity>
              )}
              {canEdit && (
                <TouchableOpacity onPressIn={handleEditMessage}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={SIZES.large}
                    color={themeColors.text}
                    style={{
                      marginRight: SIZES.small,
                      fontSize: rMS(SIZES.large),
                    }}
                  />
                </TouchableOpacity>
              )}
              {canReply && (
                <TouchableOpacity
                  onPressIn={() => {
                    setReplyToMessage(selectedMessages[0]);
                  }}
                >
                  <MaterialCommunityIcons
                    name="reply"
                    size={SIZES.large}
                    color={themeColors.text}
                    style={{
                      marginRight: SIZES.medium,
                      fontSize: rMS(SIZES.large),
                    }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPressIn={handleCopySelected}>
                <MaterialCommunityIcons
                  name="content-copy"
                  size={SIZES.large}
                  color={themeColors.text}
                    style={{
                      marginRight: SIZES.medium,
                      fontSize: rMS(SIZES.large),
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPressIn={handleDeselectAll}>
                  <Text
                    style={{
                      color: themeColors.text,
                      fontSize: rMS(SIZES.large),
                    }}
                  >
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
            <Text
              style={{ color: themeColors.text, fontSize: rMS(SIZES.large) }}
            ></Text>
          </TouchableOpacity>
        ),
      });
    },
    [
      selectedMessages,
      navigation,
      communityId,
      themeColors,
      handleCopySelected,
      handleDeleteMessage,
      handleEditMessage,
      canEditDeleteOrReply,
    ]
  );

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
    [selectedMessages]
  );

  useEffect(() => {
    if (selectedMessages.length === 0) {
      navigation.setOptions({
        headerRight: () => null,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
            onPressIn={() =>
              router.push({
                pathname: "CommunityDetailScreen",
                params: { id: communityId },
              })
            }
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Image
              source={{ uri: route.params?.image }}
              style={{
                width: rS(33),
                height: rS(30),
                marginRight: rS(8),
                borderRadius: rMS(20),
              }}
            />
            <Text
              style={{ color: themeColors.text, fontSize: rMS(SIZES.large) }}
            >
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
      const isFirstMessageOfBlock =
        !props.previousMessage ||
        props.previousMessage?.user?._id !== props.currentMessage.user._id;
      const isOtherUser = props.currentMessage.user._id !== user?.id;
      const isNewDay =
        !props.previousMessage ||
        (props.currentMessage?.createdAt &&
          props.previousMessage?.createdAt &&
          props.currentMessage.createdAt.toDateString() !==
            props.previousMessage.createdAt.toDateString());
      const isLastMessage = messages[0]?._id === props.currentMessage._id;

      const messageText = props.currentMessage.text
        ? props.currentMessage.text
        : props.currentMessage.image
        ? "Photo"
        : props.currentMessage.document
        ? "Document"
        : "";

      return (
        <TouchableOpacity
          onPress={() => handlePress(props.currentMessage)}
          onLongPress={() => handleLongPress(props.currentMessage)}
          style={
            isSelected
              ? [props.containerStyle, styles.blurBackground]
              : props.containerStyle
          }
        >
          <Bubble
            {...props}
            text={messageText}
            onPress={() => handlePress(props.currentMessage)}
            onLongPress={() => handleLongPress(props.currentMessage)}
            wrapperStyle={{
              ...props.wrapperStyle,
              ...(isSelected && styles.blurBackground),
              left: { backgroundColor: themeColors.secondaryBackground },
              right: { backgroundColor: themeColors.tint },
            }}
            containerStyle={{
              marginVertical: isFirstMessageOfBlock ? 5 : 0,
            }}
            renderTime={() => (
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {props.currentMessage.createdAt?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {!isOtherUser && (
                  <View style={styles.statusIcon}>
                    {props.currentMessage.status === "pending" && (
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={SIZES.small}
                        color={themeColors.textSecondary}
                      />
                    )}
                    {props.currentMessage.status === "sending" && (
                      <MaterialCommunityIcons
                        name="sync"
                        size={SIZES.small}
                        color={themeColors.textSecondary}
                      />
                    )}
                    {props.currentMessage.status === "sent" && (
                      <MaterialCommunityIcons
                        name="check"
                        size={SIZES.small}
                        color={themeColors.textSecondary}
                      />
                    )}
                    {props.currentMessage.status === "read" && (
                      <MaterialCommunityIcons
                        name="check-all"
                        size={SIZES.small}
                        color={themeColors.textSecondary}
                      />
                    )}
                  </View>
                )}
              </View>
            )}
            renderCustomView={() => (
              <>
                {props.currentMessage.replyTo &&
                  props.currentMessage.replyTo._id !== null && (
                    <TouchableOpacity>
                      <View style={styles.replyContainer}>
                        <Text style={styles.replyName}>
                          {`Replying to ${props.currentMessage.replyTo.user?.name || "Unknown User"}`}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          {props.currentMessage.replyTo.text == null ? (
                            <>
                              <MaterialCommunityIcons
                                name="image"
                                size={SIZES.medium}
                                color={themeColors.textSecondary}
                                style={{ marginRight: 4 }}
                              />
                              <Text style={styles.replyText}>Photo</Text>
                            </>
                          ) : (
                            <Text style={styles.replyText}>
                              {props.currentMessage.replyTo.document
                                ? "Document"
                                : props.currentMessage.replyTo.text || ""}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                {((isOtherUser && isFirstMessageOfBlock) ||
                  (isOtherUser && isNewDay)) && (
                  <Text style={styles.username}>
                    {props.currentMessage.user.name}
                  </Text>
                )}
              </>
            )}
            textStyle={{
              right: { color: "white" },
              left: { color: themeColors.text },
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
    [
      selectedMessages,
      user?.id,
      handlePress,
      handleLongPress,
      messages,
      themeColors,
    ]
  );

  const renderAvatar = useCallback(
    (props) => {
      const userId = props.currentMessage.user._id;
      const avatarUrl =
        profileImages[userId] ||
        props.currentMessage.user.avatar ||
        user?.profile_picture;

      useEffect(() => {
        if (!profileImages[userId] && avatarUrl) {
          setProfileImages((prev) => ({ ...prev, [userId]: avatarUrl }));
        }
      }, [userId, avatarUrl]);

      if (avatarUrl) {
        return (
          <View style={styles.avatarContainer}>
            <AppImage uri={avatarUrl} style={styles.avatar} />
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
    },
    [profileImages, user?.profile_picture]
  );

  const renderMessageImage = useCallback(
    (props) => {
      const currentImageUri = props.currentMessage.image;
      const imageList = messages
        .filter((msg) => msg.image)
        .map((msg) => ({ uri: msg.image }));

      return (
        <TouchableOpacity
          key={props.currentMessage._id}
          onPress={() => {
            setImageViewerImages(imageList);
            setSelectedImageUri(currentImageUri);
            setTimeout(() => setIsImageViewerVisible(true), 0);
          }}
          style={styles.messageImageContainer}
        >
          <AppImage uri={currentImageUri} style={styles.whatsappImage} />
        </TouchableOpacity>
      );
    },
    [messages]
  );

  const renderImageViewer = useCallback(() => {
    const currentIndex = imageViewerImages.findIndex(
      (img) => img.uri === selectedImageUri
    );
    return (
      <ImageView
        images={imageViewerImages}
        imageIndex={currentIndex >= 0 ? currentIndex : 0}
        visible={isImageViewerVisible}
        onRequestClose={() => {
          setIsImageViewerVisible(false);
          setSelectedImageUri(null);
        }}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        FooterComponent={({ imageIndex }) => (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() =>
              saveImageToCameraRoll(imageViewerImages[imageIndex].uri)
            }
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      />
    );
  }, [imageViewerImages, selectedImageUri, isImageViewerVisible]);

  const saveImageToCameraRoll = async (uri: string) => {
    try {
      let fileUri = uri;
      if (uri.startsWith("data:image")) {
        const base64 = uri.split(",")[1];
        const fileName = `image_${Date.now()}.jpg`;
        fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("MyApp", asset, false);
      ToastAndroid.show("Image saved to camera roll", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error saving image:", error);
      ToastAndroid.show("Failed to save image", ToastAndroid.SHORT);
    }
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

    const formatDate = (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toDateString();
      }
    };

    return (
      <View
        style={[
          styles.dateContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={styles.dateText}>
          {currentMessage.createdAt
            ? formatDate(currentMessage.createdAt)
            : "Unknown Date"}
        </Text>
      </View>
    );
  };

  const onDocumentPress = (uri: string) => {
    setSelectedImageUri(uri);
    setIsDocumentViewerVisible(true);
  };

  const renderMessageDocument = (props) => (
    <TouchableOpacity
      onPress={() => onDocumentPress(props.currentMessage.document)}
    >
      <Text style={styles.documentText}>
        Document: {props.currentMessage.document.split("/").pop()}
      </Text>
    </TouchableOpacity>
  );

  const renderSend = (props) => {
    const hasText = props.text && props.text.trim().length > 0;

    return (
      <View>
        {!hasText && (
          <View style={styles.attachButtonContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
              <Ionicons
                name="image-outline"
                color={themeColors.text}
                size={SIZES.xLarge}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickDocument}
              style={styles.attachButton}
            >
              <Ionicons
                name="document-outline"
                color={themeColors.text}
                size={SIZES.xLarge}
              />
            </TouchableOpacity>
          </View>
        )}
        {hasText && (
          <View style={styles.sendContainer}>
            <Send {...props} containerStyle={styles.sendButton} alwaysShowSend>
              <Ionicons name="send" color="#ffffff" size={SIZES.large} />
            </Send>
          </View>
        )}
      </View>
    );
  };

  const renderMediaPreview = () => {
    if (mediaPreview.uri) {
      return (
        <View style={styles.replyContainer}>
          {mediaPreview.type === "image" ? (
            <Image
              source={{ uri: mediaPreview.uri }}
              style={[styles.previewImage, { width: "100%", height: rV(150) }]}
            />
          ) : (
            <Text style={styles.previewDocument}>
              {mediaPreview.uri.split("/").pop()}
            </Text>
          )}
          <TouchableOpacity
            style={styles.closeReplyButton}
            onPress={() => setMediaPreview({ type: null, uri: null })}
          >
            <Ionicons
              name="close"
              color={themeColors.text}
              size={SIZES.medium}
            />
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
              <Ionicons
                name="close"
                color={themeColors.text}
                size={SIZES.medium}
              />
            </TouchableOpacity>
          </View>
        )}
        {replyToMessage && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyName}>
              Replying to {replyToMessage.user?.name || "Unknown User"}
            </Text>
            <Text style={styles.replyText}>
              {replyToMessage.text || (replyToMessage.image ? "Photo" : replyToMessage.document ? "Document" : "")}
            </Text>
            <TouchableOpacity
              onPress={() => setReplyToMessage(null)}
              style={styles.closeReplyButton}
            >
              <Ionicons
                name="close"
                color={themeColors.text}
                size={SIZES.medium}
              />
            </TouchableOpacity>
          </View>
        )}
        <InputToolbar
          {...props}
          containerStyle={[
            styles.inputToolbar,
            (editingMessage || replyToMessage || mediaPreview.uri) && {
              marginTop: rV(0),
            },
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
              ) : null}
            </View>
          )}
        />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: rMS(10),
    },
    statusContainer: {
      alignSelf: "flex-end",
      marginTop: 5,
    },
    statusTimeContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginRight: rS(5),
    },
    messageImageContainer: {
      borderRadius: rMS(10),
      overflow: "hidden",
      marginVertical: rV(0),
      paddingHorizontal: rS(2),
      paddingVertical: rV(0),
    },
    whatsappImage: {
      width: rS(150),
      height: rV(150),
      resizeMode: "cover",
    },
    statusText: {
      fontSize: SIZES.xSmall,
      color: themeColors.textSecondary,
      textAlign: "right",
      paddingRight: rS(8),
    },
    username: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      fontWeight: "bold",
      marginBottom: rV(1),
      marginLeft: rS(10),
      paddingRight: rS(12),
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
      margin: rMS(10),
    },
    messageVideo: {
      width: rS(200),
      height: rV(200),
      borderRadius: rMS(10),
      margin: rMS(10),
    },
    inputToolbar: {
      backgroundColor: themeColors.background,
      borderTopWidth: 0,
      paddingHorizontal: rS(10),
      paddingBottom: insets.bottom + rV(5),
      paddingTop: rV(10),
      opacity: 0.9,
    },
    inputField: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.reverseText,
      borderRadius: rMS(20),
      flex: 1,
      paddingVertical: rV(8),
      paddingHorizontal: rS(10),
      marginRight: rS(10),
    },
    textInput: {
      flex: 1,
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontFamily: FONT.regular,
    },
    attachButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: rS(10),
    },
    attachButton: {
      padding: rS(5),
    },
    attachIcon: {
      color: themeColors.text,
      fontSize: SIZES.large,
    },
    sendContainer: {
      height: rV(30),
      width: rS(35),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.tint,
      borderRadius: rMS(20),
    },
    sendButton: {
      justifyContent: "center",
      alignItems: "center",
    },
    replyContainer: {
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      backgroundColor: themeColors.secondaryBackground,
      padding: rMS(10),
      borderRadius: rMS(5),
      borderLeftWidth: rS(4),
      borderLeftColor: "#007AFF",
      marginRight: rS(4),
      width: "100%",
    },
    replyText: {
      color: themeColors.text,
      fontSize: SIZES.small,
    },
    replyName: {
      color: themeColors.text,
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
      padding: rMS(10),
      borderWidth: rS(1),
      borderColor: themeColors.textSecondary,
      borderRadius: rMS(5),
      marginVertical: rV(10),
    },
    previewImage: {
      width: "100%",
      height: rV(200),
      marginBottom: rV(10),
    },
    previewDocument: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      marginBottom: rV(10),
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
    blurBackground: {
      opacity: 0.7,
      backgroundColor: themeColors.tint,
      width: "100%",
    },
    editedText: {
      fontSize: SIZES.xSmall,
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    lastMessagePreview: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(2),
      alignSelf: "center",
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginRight: rS(8),
      marginBottom: rV(4),
    },
    timeText: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginRight: rS(4),
      marginLeft: rS(9),
    },
    statusIcon: {
      marginLeft: rS(2),
    },
    downloadButton: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      padding: rS(10),
      borderRadius: rMS(20),
    },
  });

  return (
    <View style={{ flex: 1, paddingTop: rV(1) }}>
      {loading && messages.length === 0 ? (
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

          renderDay={renderDay}
          minInputToolbarHeight={insets.bottom + rV(50)}
          scrollToBottom={true}
          isTyping={false}
          inverted={true}
        />
      )}
      {renderImageViewer()}
    </View>
  );
};

export default CommunityChatScreen;