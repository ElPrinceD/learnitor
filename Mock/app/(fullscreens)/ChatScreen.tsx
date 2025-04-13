import "react-native-get-random-values";
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
  memo,
} from "react";
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
  Linking,
  FlatList,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import axios from "axios";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
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
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import { useWebSocket } from "../../webSocketProvider";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { FONT } from "../../constants";
import { router } from "expo-router";
import AppImage from "../../components/AppImage";
import FullScreenImageViewer from "../../components/FullScreenImageViewer";
import FileViewer from "react-native-file-viewer";
import ImagePreviewModal from "../../components/ImagePreviewModal";

// Memoize GiftedChat to prevent unnecessary re-renders
const MemoizedGiftedChat = memo(GiftedChat, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.text === nextProps.text &&
    prevProps.user === nextProps.user &&
    prevProps.loadEarlier === nextProps.loadEarlier &&
    prevProps.isLoadingEarlier === nextProps.isLoadingEarlier
  );
});

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
  const [loadEarlier, setLoadEarlier] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<
    number | null
  >(null);
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
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [isVideoViewerVisible, setIsVideoViewerVisible] = useState(false);
  const [isDocumentViewerVisible, setIsDocumentViewerVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string>>(
    {}
  );
  const [selectedImagesForPreview, setSelectedImagesForPreview] = useState<
    { uri: string; type: string; id: string }[]
  >([]);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);

  const normalizeMessage = useCallback((data) => {
    console.log("Normalizing message:", data);
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
  }, []);

  const backgroundImage =
    colorScheme === "dark"
      ? "https://images.pexels.com/photos/9665185/pexels-photo-9665185.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      : "https://images.pexels.com/photos/7599590/pexels-photo-7599590.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  const fetchInitialMessages = useCallback(async () => {
    try {
      setLoading(true);
      const cachedMessages = await sqliteGetItem(`messages_${communityId}`);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages).map(normalizeMessage);
        const validMessages = parsedMessages
          .filter((msg): msg is IMessage => msg !== null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMessages(validMessages);
        if (validMessages.length > 0) {
          setLastMessageTimestamp(
            validMessages[validMessages.length - 1].createdAt.getTime()
          );
        }
        const imageUris = validMessages
          .filter((msg) => msg.image)
          .map((msg) => msg.image);
        setImageViewerImages(imageUris);
      }

      if (isConnected) {
        await sendMessage({
          type: "fetch_history",
          community_id: communityId,
          limit: 20, // Initial batch size
        });
      }
    } catch (error) {
      console.error("Error fetching initial messages:", error);
      setError("Failed to load message history");
    } finally {
      setLoading(false);
    }
  }, [communityId, sendMessage, isConnected, sqliteGetItem, normalizeMessage]);

  const handleLoadEarlier = useCallback(async () => {
    if (!loadEarlier || isLoadingEarlier) return;

    setIsLoadingEarlier(true);
    try {
      if (isConnected && lastMessageTimestamp) {
        await sendMessage({
          type: "fetch_history",
          community_id: communityId,
          limit: 20,
          before: lastMessageTimestamp, // Use timestamp for pagination
        });
      }
    } catch (error) {
      console.error("Error loading earlier messages:", error);
      setError("Failed to load earlier messages");
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [
    loadEarlier,
    isLoadingEarlier,
    isConnected,
    communityId,
    lastMessageTimestamp,
    sendMessage,
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchInitialMessages();
      return () => {};
    }, [fetchInitialMessages])
  );

  useEffect(() => {
    let socketCleanup = () => {};

    if (socket) {
      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket received message:", data);

          if (data.type === "history" && data.community_id === communityId) {
            const transformedMessages = data.messages
              .map(normalizeMessage)
              .filter((msg): msg is IMessage => msg !== null)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setMessages((prevMessages) => {
              const newMessages = transformedMessages.filter(
                (newMsg) =>
                  !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id)
              );
              const pendingMessages = prevMessages.filter(
                (m) => m.status === "pending" || m.tempId
              );
              const updatedMessages = data.before
                ? [...prevMessages, ...newMessages] // Append for earlier messages
                : [...pendingMessages, ...transformedMessages]; // Replace for initial fetch
              const sortedMessages = updatedMessages.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
              );
              sqliteSetItem(
                `messages_${communityId}`,
                JSON.stringify(sortedMessages)
              );
              if (newMessages.length > 0 && data.before) {
                setLastMessageTimestamp(
                  sortedMessages[sortedMessages.length - 1].createdAt.getTime()
                );
              } else if (!data.before && sortedMessages.length > 0) {
                setLastMessageTimestamp(
                  sortedMessages[sortedMessages.length - 1].createdAt.getTime()
                );
              }
              setLoadEarlier(newMessages.length === 20);
              const imageUris = transformedMessages
                .filter((msg) => msg.image)
                .map((msg) => msg.image);
              setImageViewerImages(imageUris);
              return sortedMessages;
            });
          } else if (
            data.type === "message" &&
            data.community_id === communityId
          ) {
            const newMessage = normalizeMessage(data);
            console.log("New message processed:", newMessage);
            if (newMessage) {
              setMessages((prevMessages) => {
                const index = prevMessages.findIndex(
                  (m) => m.tempId && m.tempId === data.temp_id
                );
                let updatedMessages;
                if (index !== -1) {
                  updatedMessages = [...prevMessages];
                  updatedMessages[index] = { ...newMessage, tempId: undefined };
                } else {
                  updatedMessages = [newMessage, ...prevMessages];
                }
                sqliteSetItem(
                  `messages_${communityId}`,
                  JSON.stringify(updatedMessages)
                );
                const imageUris = updatedMessages
                  .filter((msg) => msg.image)
                  .map((msg) => msg.image);
                setImageViewerImages(imageUris);
                return updatedMessages;
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
              const imageUris = updatedMessages
                .filter((msg) => msg.image)
                .map((msg) => msg.image);
              setImageViewerImages(imageUris);
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
  }, [socket, communityId, sqliteSetItem, normalizeMessage]);

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
              console.warn(
                "storage_keys is not an array, resetting:",
                allKeysRaw
              );
              keys = [];
            }
          } catch (e) {
            console.error(
              "Failed to parse storage_keys in sendUnsent:",
              e,
              "Raw value:",
              allKeysRaw
            );
            keys = [];
          }
          const unsentKeys = keys.filter((key: string) =>
            key.startsWith("unsent_message_")
          );
          for (const key of unsentKeys) {
            const messageStr = await sqliteGetItem(key);
            if (messageStr) {
              const message = JSON.parse(messageStr);
              console.log("Sending unsent message:", message);
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
              await sqliteSetItem(key, "");
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
      try {
        console.log("sendMediaMessage called with:", { fileUri, type });
        console.log("WebSocket isConnected:", isConnected);

        let mediaData = fileUri;
        let payloadUri = fileUri;

        // Convert to base64 based on type
        if (type === "image") {
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          mediaData = `data:image/jpeg;base64,${base64}`;
          payloadUri = mediaData;
          console.log("Image converted to base64, length:", mediaData.length);
        } else if (type === "document") {
          try {
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const extension = fileUri.split(".").pop()?.toLowerCase();
            let mimeType = "application/octet-stream";
            if (extension === "pdf") mimeType = "application/pdf";
            else if (["doc", "docx"].includes(extension || ""))
              mimeType = "application/msword";
            else if (extension === "txt") mimeType = "text/plain";

            payloadUri = `data:${mimeType};base64,${fileContent}`;
          } catch (error) {
            console.error("Error encoding document to base64:", error);
            ToastAndroid.show("Failed to send document", ToastAndroid.SHORT);
            return;
          }
        }

        const tempId =
          Date.now().toString() + Math.random().toString(36).substr(2, 5);

        const message = {
          _id: tempId,
          tempId,
          text: "",
          createdAt: new Date(),
          user: {
            _id: user?.id || 1,
            name: user?.first_name + " " + user?.last_name || "Unknown User",
          },
          [type]: mediaData,
          status: isConnected ? "sending" : "pending",
        };

        // Avoid duplicates
        if (!messageIds.has(tempId)) {
          setMessages((prev) => [message, ...prev]);
          setMessageIds((prev) => new Set([...prev, tempId]));

          if (type === "image") {
            // Use original URI for viewer
            setImageViewerImages((prev) => [fileUri, ...prev]);
          }
        }

        if (!isConnected) {
          const offlineMessage = {
            ...message,
            communityId,
            content: {
              text: "",
              [type]: payloadUri,
            },
          };

          await sqliteSetItem(
            `unsent_message_${tempId}`,
            JSON.stringify(offlineMessage)
          );
          await sqliteSetItem(
            `messages_${communityId}`,
            JSON.stringify([message, ...messages])
          );

          const allKeysRaw = (await sqliteGetItem("storage_keys")) || "[]";
          const keys = JSON.parse(allKeysRaw) || [];

          if (!keys.includes(`unsent_message_${tempId}`)) {
            keys.push(`unsent_message_${tempId}`);
            await sqliteSetItem("storage_keys", JSON.stringify(keys));
          }

          console.log("Message saved locally for later send.");
        } else {
          sendMessage({
            type: "send_message",
            community_id: communityId,
            message: "",
            sender: user?.first_name + " " + user?.last_name || "Unknown User",
            sender_id: user?.id || 1,
            temp_id: tempId,
            [type]: payloadUri,
          });

          console.log("Message sent via WebSocket.");
        }
      } catch (error) {
        console.error("Failed to send media message:", error);
        ToastAndroid.show("Error sending media", ToastAndroid.SHORT);
      }
    },
    [
      communityId,
      sendMessage,
      user,
      isConnected,
      messageIds,
      messages,
      sqliteSetItem,
      sqliteGetItem,
    ]
  );

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        await sendMediaMessage(asset.uri, "document");
      } else {
        console.log("Document picking canceled");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      ToastAndroid.show("Failed to pick document", ToastAndroid.SHORT);
    }
  }, [sendMediaMessage]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      for (let message of newMessages) {
        const tempId =
          Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const tempMessage: IMessage = {
          _id: tempId,
          tempId,
          text: message.text,
          createdAt: new Date(),
          user: {
            _id: user?.id || 1,
            name: user?.first_name + " " + user?.last_name || "Unknown User",
          },
          image:
            mediaPreview.uri && mediaPreview.type === "image"
              ? mediaPreview.uri
              : undefined,
          document:
            mediaPreview.uri && mediaPreview.type === "document"
              ? mediaPreview.uri
              : undefined,
          status: isConnected ? "sending" : "pending",
          ...(replyToMessage && {
            replyTo: {
              _id: replyToMessage._id,
              text:
                replyToMessage.text ||
                (replyToMessage.image
                  ? "Photo"
                  : replyToMessage.document
                  ? "Document"
                  : ""),
              user: replyToMessage.user,
            },
          }),
        };

        setReplyToMessage(null);
        setMediaPreview({ type: null, uri: null });

        if (!messageIds.has(tempId)) {
          setMessages((prevMessages) => [tempMessage, ...prevMessages]);
          setMessageIds((prev) => new Set([...prev, tempId]));
          if (tempMessage.image) {
            setImageViewerImages((prev) => [tempMessage.image, ...prev]);
          }
        }

        if (!isConnected) {
          const messageToStore = {
            ...message,
            communityId,
            content: {
              text: tempMessage.text || "",
              image: tempMessage.image || undefined,
              document: tempMessage.document || undefined,
            },
          };
          await sqliteSetItem(
            `unsent_message_${tempId}`,
            JSON.stringify(messageToStore)
          );
          await sqliteSetItem(
            `messages_${communityId}`,
            JSON.stringify([tempMessage, ...messages])
          );
          const allKeysRaw = (await sqliteGetItem("storage_keys")) || "[]";
          let keys = JSON.parse(allKeysRaw) || [];
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
    [
      communityId,
      sendMessage,
      user,
      replyToMessage,
      isConnected,
      mediaPreview,
      messageIds,
      sqliteSetItem,
      sqliteGetItem,
      messages,
    ]
  );

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImages = result.assets;
      const newImages = selectedImages.map((asset) => ({
        uri: asset.uri,
        type: "image",
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      }));
      console.log("Selected images:", newImages);
      setSelectedImagesForPreview(newImages);
      setIsImagePreviewVisible(true);
    } else {
      console.log("Image picker canceled or no assets:", result);
    }
  }, []);

  const handleSendImage = useCallback(
    async (uri: string) => {
      console.log("handleSendImage called with URI:", uri);
      try {
        await sendMediaMessage(uri, "image");
        setSelectedImagesForPreview([]);
        // Toast moved to ImagePreviewModal
      } catch (error) {
        console.error("handleSendImage error:", error);
        throw error;
      }
    },
    [sendMediaMessage]
  );

  const handleCopySelected = useCallback(async () => {
    const textToCopy = selectedMessages
      .map((msg) => msg.text)
      .filter((text) => text)
      .join("\n\n");
    await Clipboard.setStringAsync(textToCopy);
    ToastAndroid.show("Messages copied to clipboard", ToastAndroid.SHORT);
  }, [selectedMessages]);

  const handleLongPress = useCallback((message: IMessage) => {
    setSelectedMessages((prevSelected) => {
      if (!prevSelected.some((m) => m._id === message._id)) {
        return [...prevSelected, message];
      }
      return prevSelected;
    });
    setMessages((prevMessages) =>
      prevMessages.map((m) =>
        m._id === message._id ? { ...m, isSelected: true } : m
      )
    );
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedMessages([]);
    setMessages((prevMessages) =>
      prevMessages.map((m) => ({ ...m, isSelected: false }))
    );
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
    if (selectedMessages.length > 0) {
      const { canDelete, canEdit, canReply } = canEditDeleteOrReply();
      navigation.setOptions({
        headerTitle: `${selectedMessages.length} Selected`,
        headerLeft: () => (
          <TouchableOpacity
            onPress={handleDeselectAll}
            style={{ marginLeft: SIZES.xSmall }}
          >
            <MaterialCommunityIcons
              name="close"
              size={SIZES.large}
              color={themeColors.text}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: "row", marginRight: SIZES.xSmall }}>
            {canReply && (
              <TouchableOpacity
                onPressIn={() => {
                  setReplyToMessage(selectedMessages[0]);
                  handleDeselectAll();
                }}
              >
                <MaterialCommunityIcons
                  name="reply"
                  size={rS(24)}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity
                onPressIn={() => {
                  handleEditMessage();
                  handleDeselectAll();
                }}
                style={{ marginHorizontal: rS(8) }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={rS(24)}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                onPressIn={() => {
                  handleDeleteMessage();
                  handleDeselectAll();
                }}
                style={{ marginHorizontal: rS(8) }}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={rS(24)}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPressIn={() => {
                handleCopySelected();
                handleDeselectAll();
              }}
              style={{ marginHorizontal: rS(8) }}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={rS(24)}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        ),
      });
    } else {
      navigation.setOptions({
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
        headerRight: () => null,
      });
    }
  }, [
    selectedMessages,
    navigation,
    communityId,
    themeColors,
    handleCopySelected,
    handleDeleteMessage,
    handleEditMessage,
    canEditDeleteOrReply,
    handleDeselectAll,
    router,
    route,
    rS,
    rMS,
  ]);

  const handlePress = useCallback((message: IMessage) => {
    setSelectedMessages((prevSelected) => {
      if (prevSelected.length > 0) {
        const isSelected = prevSelected.some((m) => m._id === message._id);
        if (isSelected) {
          return prevSelected.filter((m) => m._id !== message._id);
        } else {
          return [...prevSelected, message];
        }
      }
      return prevSelected;
    });
    setMessages((prevMessages) =>
      prevMessages.map((m) =>
        m._id === message._id ? { ...m, isSelected: !m.isSelected } : m
      )
    );
  }, []);

  useLayoutEffect(() => {
    updateHeader();
  }, [selectedMessages, updateHeader]);

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

      const messageText = props.currentMessage.text
        ? props.currentMessage.text
        : props.currentMessage.image
        ? "Photo"
        : props.currentMessage.document
        ? "Document"
        : "";

      // Create a custom view for reply messages and document cards.
      const renderCustomContent = () => {
        return (
          <>
            {/* Render reply preview if exists */}
            {props.currentMessage.replyTo &&
              props.currentMessage.replyTo._id !== null && (
                <TouchableOpacity>
                  <View style={styles.replyContainer}>
                    <Text style={styles.replyName}>
                      {`Replying to ${
                        props.currentMessage.replyTo.user?.name ||
                        "Unknown User"
                      }`}
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {props.currentMessage.replyTo.text == null ? (
                        <>
                          <MaterialCommunityIcons
                            name={
                              props.currentMessage.replyTo.image
                                ? "image"
                                : "file-document-outline"
                            }
                            size={SIZES.medium}
                            color={themeColors.textSecondary}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.replyText}>
                            {props.currentMessage.replyTo.image
                              ? "Photo"
                              : "Document"}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.replyText}>
                          {props.currentMessage.replyTo.text || ""}
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

            {/* Render document preview if there is a document */}
            {props.currentMessage.document && (
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(props.currentMessage.document);
                }}
                style={[
                  styles.documentContainer,
                  {
                    backgroundColor:
                      props.position === "right"
                        ? themeColors.tint
                        : themeColors.secondaryBackground,
                    borderRadius: rMS(10),
                    padding: rS(10),
                    marginVertical: rV(4),
                    maxWidth: rS(250),
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={SIZES.large}
                    color={props.position === "right" ? "#fff" : "#007aff"}
                    style={{ marginRight: rS(8) }}
                  />
                  <View>
                    <Text
                      style={{
                        color:
                          props.position === "right"
                            ? "#fff"
                            : themeColors.text,
                        fontSize: SIZES.medium,
                        fontWeight: "600",
                        maxWidth: rS(180),
                      }}
                      numberOfLines={1}
                    >
                      {decodeURIComponent(
                        props.currentMessage.document.split("/").pop() ||
                          "Document"
                      )}
                    </Text>
                    <Text
                      style={{
                        color:
                          props.position === "right"
                            ? "rgba(255,255,255,0.7)"
                            : themeColors.textSecondary,
                        fontSize: SIZES.small,
                      }}
                    >
                      Document
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </>
        );
      };

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
              left: { backgroundColor: themeColors.secondaryBackground },
              right: { backgroundColor: themeColors.tint },
              ...(isSelected && styles.blurBackground),
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
            renderCustomView={renderCustomContent}
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
    [selectedMessages, handlePress, handleLongPress, themeColors, user?.id]
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

  const openImageViewer = useCallback(
    (uri: string) => {
      const index = imageViewerImages.findIndex((img) => img === uri);
      if (index >= 0) {
        setCurrentImageIndex(index);
        setIsImageViewerVisible(true);
      } else {
        console.warn("Image not found in imageViewerImages:", uri);
      }
    },
    [imageViewerImages]
  );

  const renderMessageImage = useCallback(
    (props: any) => {
      return (
        <TouchableOpacity
          onPress={() => handlePress(props.currentMessage)}
          onLongPress={() => handleLongPress(props.currentMessage)}
        >
          <AppImage
            uri={props.currentMessage.image}
            style={{ width: rS(200), height: rV(200), borderRadius: rMS(10) }}
            onPress={() => openImageViewer(props.currentMessage.image)}
          />
        </TouchableOpacity>
      );
    },
    [openImageViewer]
  );

  const renderDay = useCallback(
    (props) => {
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
    },
    [themeColors]
  );

  const renderSend = useCallback(
    (props) => {
      const hasText = props.text && props.text.trim().length > 0;

      return (
        <View style={styles.attachButtonContainer}>
          {!hasText && !editingMessage ? (
            <>
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
                <MaterialCommunityIcons
                  name="paperclip"
                  color={themeColors.text}
                  size={SIZES.xLarge}
                />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.sendContainer}>
              <Send
                {...props}
                containerStyle={styles.sendButton}
                alwaysShowSend
                onSend={() => {
                  if (editingMessage) {
                    onEditMessage();
                  } else {
                    props.onSend({ text: props.text.trim() }, true);
                  }
                }}
              >
                <Ionicons
                  name={editingMessage ? "checkmark" : "send"}
                  color="#ffffff"
                  size={SIZES.large}
                />
              </Send>
            </View>
          )}
        </View>
      );
    },
    [pickImage, pickDocument, themeColors, editingMessage, onEditMessage]
  );

  const renderMediaPreview = useCallback(() => {
    if (mediaPreview.uri) {
      return (
        <View style={styles.replyContainer}>
          {mediaPreview.type === "image" ? (
            <Image
              source={{ uri: mediaPreview.uri }}
              style={[styles.previewImage, { width: "100%", height: rV(150) }]}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={SIZES.medium}
                color={themeColors.text}
                style={{ marginRight: rS(8) }}
              />
              <Text style={styles.previewDocument}>
                {decodeURIComponent(
                  mediaPreview.uri.split("/").pop() || "Document"
                )}
              </Text>
            </View>
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
  }, [mediaPreview, themeColors]);

  const renderInputToolbar = useCallback(
    (props) => {
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
                {replyToMessage.text ||
                  (replyToMessage.image
                    ? "Photo"
                    : replyToMessage.document
                    ? "Document"
                    : "")}
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
              </View>
            )}
          />
        </View>
      );
    },
    [
      renderMediaPreview,
      editingMessage,
      replyToMessage,
      mediaPreview.uri,
      themeColors,
    ]
  );

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
    documentContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: rS(10),
      borderRadius: rMS(8),
      maxWidth: rS(250),
      marginVertical: rV(4),
    },
    documentTextContainer: {
      flexDirection: "column",
      flexShrink: 1,
    },
    documentName: {
      fontWeight: "600",
      fontSize: SIZES.medium,
      marginBottom: rV(2),
      color: themeColors.text,
    },
    documentLabel: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
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
    previewModalContainer: {
      flex: 142,
      backgroundColor: themeColors.background,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: rS(10),
      backgroundColor: themeColors.secondaryBackground,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.textSecondary + "33",
    },
    previewModalTitle: {
      fontSize: rMS(18),
      fontWeight: "600",
      marginLeft: rS(10),
      color: themeColors.text,
    },
    previewImageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: rS(10),
    },
    previewImage: {
      width: width - rS(20),
      height: (width - rS(20)) * 1.5,
      maxHeight: Dimensions.get("window").height * 0.6,
    },
    previewButtonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      padding: rS(10),
      backgroundColor: themeColors.secondaryBackground,
      borderTopWidth: 1,
      borderTopColor: themeColors.textSecondary + "33",
    },
    previewButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.tint,
      paddingVertical: rV(8),
      paddingHorizontal: rS(12),
      borderRadius: rMS(8),
      marginHorizontal: rS(10),
    },
    previewButtonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "500",
      marginLeft: rS(6),
    },
    previewActionContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: rS(10),
      backgroundColor: themeColors.secondaryBackground,
      borderTopWidth: 1,
      borderTopColor: themeColors.textSecondary + "33",
    },
    previewActionButton: {
      paddingVertical: rV(12),
      borderRadius: rMS(10),
      flex: 1,
      marginHorizontal: rS(5),
      alignItems: "center",
    },
    previewActionText: {
      color: "#fff",
      fontSize: rMS(16),
      fontWeight: "600",
    },
    noImagesText: {
      color: themeColors.textSecondary,
      fontSize: rMS(16),
      textAlign: "center",
      marginTop: rV(20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: rV(10),
      color: themeColors.text,
      fontSize: rMS(16),
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
        <MemoizedGiftedChat
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
          loadEarlier={loadEarlier}
          onLoadEarlier={handleLoadEarlier}
          isLoadingEarlier={isLoadingEarlier}
          listViewProps={{
            scrollEventThrottle: 400,
            onScroll: ({ nativeEvent }) => {
              const isCloseToTop = nativeEvent.contentOffset.y <= 100;
              if (isCloseToTop && loadEarlier && !isLoadingEarlier) {
                handleLoadEarlier();
              }
            },
          }}
        />
      )}
      <FullScreenImageViewer
        visible={isImageViewerVisible}
        images={imageViewerImages}
        currentIndex={currentImageIndex}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
      <ImagePreviewModal
        visible={isImagePreviewVisible}
        images={selectedImagesForPreview}
        onClose={() => setIsImagePreviewVisible(false)}
        onSend={handleSendImage}
      />
    </View>
  );
};

export default CommunityChatScreen;
