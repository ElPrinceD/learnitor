import "react-native-get-random-values";
import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  memo,
  useRef,
} from "react";
import { Animated } from "react-native";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ToastAndroid,
  Platform,
  Alert,
  Dimensions,
  Linking,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRoute } from "@react-navigation/native";

import { useAuth } from "../../components/AuthContext";
import { Message } from "../../components/types";
import {
  GiftedChat,
  Bubble,
  Send,
  SystemMessage,
  IMessage,
  InputToolbar,
  isSameDay,
  isSameUser,
} from "react-native-gifted-chat";
import { v4 as uuidv4 } from "uuid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCommunity } from "../../contexts/CommunityContext";
import { useCache } from "../../contexts/CacheContext";
import { useWebSocket } from "../../contexts/webSocketProvider";
import { rMS, rV, rS, SIZES, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { FONT } from "../../constants";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import AppImage from "../../components/AppImage";
import FullScreenImageViewer from "../../components/FullScreenImageViewer";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import { getCommunityMessages } from "../../services/CommunityApiCalls";
import * as IntentLauncher from "expo-intent-launcher";

// Add custom IMessage interface at the top of the file
interface CustomIMessage extends IMessage {
  status?: "pending" | "sending" | "sent" | "read";
  tempId?: string;
  document?: string;
  isEdited?: boolean;
  isSelected?: boolean;
  replyTo?: {
    _id: string | null;
    text: string | null;
    user: {
      _id: string | null;
      name: string;
    };
    image?: string;
  } | null;
}

const MemoizedGiftedChat = memo(GiftedChat, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.text === nextProps.text &&
    prevProps.user === nextProps.user &&
    prevProps.loadEarlier === nextProps.loadEarlier &&
    prevProps.isLoadingEarlier === nextProps.isLoadingEarlier &&
    prevProps.scrollToBottom === nextProps.scrollToBottom
  );
});

const CommunityChatScreen: React.FC = () => {
  const route = useRoute();
  const { communityId } = route.params as { communityId: string };
  const [isUpdatingMessages, setIsUpdatingMessages] = useState(false);
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { socket, isConnected, sendMessage } = useWebSocket();
  const { setCurrentCommunityId, markMessageAsRead, fetchAndCacheMessages } =
    useCommunity();
  const { getItem, setItem } = useCache();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<CustomIMessage[]>([]);
  const [messageIds, setMessageIds] = useState(new Set<string>());
  const [loadEarlier, setLoadEarlier] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<
    number | null
  >(null);
  const { width } = Dimensions.get("window");
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<CustomIMessage[]>(
    []
  );
  const [replyToMessage, setReplyToMessage] = useState<CustomIMessage | null>(
    null
  );
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
  const [editingMessage, setEditingMessage] = useState<CustomIMessage | null>(
    null
  );
  const [profileImages, setProfileImages] = useState<Record<string, string>>(
    {}
  );
  const [selectedImagesForPreview, setSelectedImagesForPreview] = useState<
    { uri: string; type: string; id: string }[]
  >([]);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [community, setCommunity] = useState<{
    id: string;
    name: string;
    image_url: string;
  } | null>(null);
  // State to track downloaded PDFs
  const [downloadedPDFs, setDownloadedPDFs] = useState<Set<string>>(new Set());
  const [downloadingPDFs, setDownloadingPDFs] = useState<Set<string>>(
    new Set()
  );
  const [inputHeight, setInputHeight] = useState(rV(40));
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const chatRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const normalizeMessage = useCallback((data: any): CustomIMessage | null => {
    if (!data) return null;

    try {
      if ("message" in data && "sent_at" in data) {
        return {
          _id: data.id || data.temp_id || uuidv4(),
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
                image: data.reply_to.image || undefined,
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
                image: data.replyTo.image || undefined,
              }
            : null,
          image: data.image || null,
          document: data.document || null,
          isEdited: data.isEdited || false,
          tempId: data.tempId || undefined,
        };
      }
    } catch (error) {
      console.error("Error normalizing message:", error);
    }
    return null;
  }, []);

  const updateMessages = useCallback((newMessages: CustomIMessage[]) => {
    setMessages((prevMessages) => {
      const messageMap = new Map(prevMessages.map((msg) => [msg._id, msg]));
      newMessages.forEach((msg) => {
        if (msg._id) {
          messageMap.set(msg._id, msg);
        }
      });
      return Array.from(messageMap.values()).sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    });
  }, []);

  const processMessageBatch = useCallback((messages: IMessage[]) => {
    const imageUris = messages
      .filter((msg) => msg.image)
      .map((msg) => msg.image)
      .filter((uri): uri is string => uri !== undefined && uri !== null);

    if (imageUris.length > 0) {
      setImageViewerImages((prev) => [...new Set([...prev, ...imageUris])]);
    }
  }, []);

  const backgroundImage =
    colorScheme === "dark"
      ? "https://images.pexels.com/photos/9665185/pexels-photo-9665185.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      : "https://images.pexels.com/photos/7599590/pexels-photo-7599590.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  // Fetch community data from cache
  const fetchCommunityData = useCallback(async () => {
    try {
      const cachedCommunity = await getItem(`community_${communityId}`);
      if (cachedCommunity) {
        setCommunity(JSON.parse(cachedCommunity));
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  }, [communityId, getItem]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const fetchInitialMessages = useCallback(async () => {
    try {
      setLoading(true);
      setIsInitialLoad(true);

      // Fetch messages using CommunityProvider
      if (userToken?.token) {
        const messages = await fetchAndCacheMessages(
          communityId,
          userToken.token
        );

        const transformedMessages = messages
          .map(normalizeMessage)
          .filter((msg): msg is CustomIMessage => msg !== null)
          .sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB =
              b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
        setMessages(transformedMessages);
        if (transformedMessages.length > 0) {
          const lastMessage =
            transformedMessages[transformedMessages.length - 1];
          if (typeof lastMessage._id === "string") {
            setLastMessageId(lastMessage._id);
          }
        }

        const imageUris = transformedMessages
          .filter((msg) => msg.image)
          .map((msg) => msg.image)
          .filter((uri): uri is string => uri !== undefined && uri !== null);
        setImageViewerImages(imageUris);
      }
    } catch (error) {
      console.error("Error fetching initial messages:", error);
      setError("Failed to load message history");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      fadeIn();
    }
  }, [
    communityId,
    userToken,
    sendMessage,
    isConnected,
    fetchAndCacheMessages,
    normalizeMessage,
    fadeIn,
  ]);

  const handleLoadEarlier = useCallback(async () => {
    if (
      !loadEarlier ||
      isLoadingEarlier ||
      !lastMessageId ||
      isUpdatingMessages
    ) {
      console.log("Skipping load earlier:", {
        loadEarlier,
        isLoadingEarlier,
        lastMessageId,
        isUpdatingMessages,
      });
      return;
    }

    setIsUpdatingMessages(true);
    setIsLoadingEarlier(true);
    setError(null);
    try {
      if (isConnected && communityId && userToken) {
        console.log(
          "Fetching older messages with lastMessageId:",
          lastMessageId
        );
        if (!userToken?.token) {
          throw new Error("No user token available");
        }

        const olderMessages = await getCommunityMessages(
          communityId,
          userToken.token,
          50,
          lastMessageId, // No beforeMessageId
          undefined, // No beforeTimestamp
          undefined // Using afterMessageId to get messages after the last message
        );

        if (olderMessages && olderMessages.length > 0) {
          const normalizedOlderMessages = olderMessages.map(normalizeMessage);
          const validOlderMessages = normalizedOlderMessages.filter(
            (msg): msg is CustomIMessage =>
              msg !== null && msg._id && !isNaN(msg.createdAt.getTime())
          );

          validOlderMessages.forEach((msg, index) => {
            console.log(`Older message ${index}:`, {
              _id: msg._id,
              createdAt: msg.createdAt.toISOString(),
              text: msg.text.slice(0, 20),
            });
          });

          if (validOlderMessages.length > 0) {
            setMessages((prevMessages) => {
              const combinedMessages = [...validOlderMessages, ...prevMessages];
              const uniqueMessages = Array.from(
                new Map(combinedMessages.map((msg) => [msg._id, msg])).values()
              ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

              console.log(
                "Combined messages (first 5):",
                uniqueMessages.slice(0, 5).map((m) => ({
                  _id: m._id,
                  createdAt: m.createdAt.toISOString(),
                }))
              );

              return uniqueMessages;
            });

            const oldestMessage =
              validOlderMessages[validOlderMessages.length - 1];
            if (oldestMessage && oldestMessage._id) {
              // Always update lastMessageId and lastMessageTimestamp to the oldest message
              setLastMessageId(oldestMessage._id);
              setLastMessageTimestamp(oldestMessage.createdAt.getTime());
            } else {
              setLoadEarlier(false);
              console.warn("Oldest message has no valid _id:", oldestMessage);
            }
          } else {
            setLoadEarlier(false);
            console.log("No valid earlier messages to load.");
          }
        } else {
          setLoadEarlier(false);
          console.log("No more earlier messages to load.");
        }
      } else {
        setError(
          isConnected ? "Invalid community or token" : "No internet connection"
        );
      }
    } catch (error) {
      console.error("Error loading earlier messages:", error);
      setError("Failed to load earlier messages");
    } finally {
      setIsLoadingEarlier(false);
      setIsUpdatingMessages(false);
    }
  }, [
    loadEarlier,
    isLoadingEarlier,
    isConnected,
    communityId,
    lastMessageId,
    userToken,
    normalizeMessage,
    isUpdatingMessages,
  ]);

  // useEffect(() => {
  //   (async () => {
  //     if (Platform.OS !== "web") {
  //       const { status: existingStatus } =
  //         await ImagePicker.getMediaLibraryPermissionsAsync();

  //       if (existingStatus !== "granted") {
  //         const { status } =
  //           await ImagePicker.requestMediaLibraryPermissionsAsync();
  //         if (status !== "granted") {
  //           alert("Sorry, we need camera roll permissions to make this work!");
  //         }
  //       }

  //       const { status: existingMediaStatus } =
  //         await MediaLibrary.getPermissionsAsync();

  //       if (existingMediaStatus !== "granted") {
  //         const { status: mediaStatus } =
  //           await MediaLibrary.requestPermissionsAsync();
  //         if (mediaStatus !== "granted") {
  //           alert("Sorry, we need media library permissions to save images.");
  //         }
  //       }
  //     }
  //   })();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      // Set the current community ID when the screen is focused
      setCurrentCommunityId(communityId);
      markMessageAsRead(communityId);
      fetchInitialMessages();

      // Cleanup function to reset the current community ID when the screen is unfocused
      return () => {
        setCurrentCommunityId(null); // Reset the current community ID
      };
    }, [
      fetchInitialMessages,
      setCurrentCommunityId,
      markMessageAsRead,
      communityId,
    ])
  );

  useEffect(() => {
    let socketCleanup = () => {};
    let messageBatch: CustomIMessage[] = [];
    let batchTimeout: NodeJS.Timeout;

    if (socket) {
      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message" && data.community_id === communityId) {
            const newMessage = normalizeMessage(data);
            if (newMessage) {
              setShouldScrollToBottom(true);

              // Check if this is a status update for an existing message
              if (newMessage.tempId) {
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.tempId === newMessage.tempId
                      ? {
                          ...msg,
                          status: newMessage.status,
                          _id: newMessage._id,
                        }
                      : msg
                  )
                );
              } else {
                messageBatch.push(newMessage);

                if (batchTimeout) {
                  clearTimeout(batchTimeout);
                }

                batchTimeout = setTimeout(() => {
                  if (messageBatch.length > 0) {
                    updateMessages(messageBatch);
                    processMessageBatch(messageBatch);
                    messageBatch = [];
                  }
                }, 100);
              }
            }
          } else if (
            data.type === "history" &&
            data.community_id === communityId
          ) {
            const transformedMessages = data.messages
              .map(normalizeMessage)
              .filter((msg): msg is CustomIMessage => msg !== null);
            updateMessages(transformedMessages);
            processMessageBatch(transformedMessages);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.addEventListener("message", onMessage);
      socketCleanup = () => {
        socket.removeEventListener("message", onMessage);
        if (batchTimeout) {
          clearTimeout(batchTimeout);
        }
      };
    }

    return socketCleanup;
  }, [
    socket,
    communityId,
    normalizeMessage,
    updateMessages,
    processMessageBatch,
  ]);

  useEffect(() => {
    if (isConnected) {
      const sendUnsentMessages = async () => {
        try {
          const allKeysRaw = (await getItem("storage_keys")) || "[]";
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
            const messageStr = await getItem(key);
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
              await setItem(key, "");
              const updatedKeys = keys.filter((k: string) => k !== key);
              await setItem("storage_keys", JSON.stringify(updatedKeys));
            }
          }
        } catch (error) {
          console.error("Error sending unsent messages:", error);
        }
      };
      sendUnsentMessages();
    }
  }, [isConnected, sendMessage, user, getItem, setItem]);

  const sendMediaMessage = useCallback(
    async (fileUri: string, type: "image" | "document") => {
      try {
        console.log("sendMediaMessage called with:", { fileUri, type });
        console.log("WebSocket isConnected:", isConnected);

        let mediaData = fileUri;
        let payloadUri = fileUri;

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
            // Only handle PDF documents
            const extension = fileUri.split(".").pop()?.toLowerCase();
            if (extension !== "pdf") {
              ToastAndroid.show(
                "Only PDF documents are supported",
                ToastAndroid.SHORT
              );
              return;
            }
            const mimeType = "application/pdf";
            payloadUri = `data:${mimeType};base64,${fileContent}`;
          } catch (error) {
            console.error("Error encoding PDF document to base64:", error);
            ToastAndroid.show(
              "Failed to send PDF document",
              ToastAndroid.SHORT
            );
            return;
          }
        }

        const tempId = uuidv4();

        const message: CustomIMessage = {
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

        if (!messageIds.has(tempId)) {
          setMessages((prev) => [message, ...prev]);
          setMessageIds((prev) => new Set([...prev, tempId]));
          if (type === "image") {
            setImageViewerImages((prev) => [...prev, fileUri]);
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
          await setItem(
            `unsent_message_${tempId}`,
            JSON.stringify(offlineMessage)
          );
          const allKeysRaw = (await getItem("storage_keys")) || "[]";
          const keys = JSON.parse(allKeysRaw) || [];
          if (!keys.includes(`unsent_message_${tempId}`)) {
            keys.push(`unsent_message_${tempId}`);
            await setItem("storage_keys", JSON.stringify(keys));
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
    [communityId, sendMessage, user, isConnected, messageIds, setItem, getItem]
  );

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
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
      ToastAndroid.show("Failed to pick PDF document", ToastAndroid.SHORT);
    }
  }, [sendMediaMessage]);

  const onSend = useCallback(
    async (newMessages: CustomIMessage[] = []) => {
      setShouldScrollToBottom(true);
      for (let message of newMessages) {
        console.log(message);
        const tempId = uuidv4();
        const tempMessage: CustomIMessage = {
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
              _id: String(replyToMessage._id),
              text:
                replyToMessage.text ||
                (replyToMessage.image
                  ? "Photo"
                  : replyToMessage.document
                  ? "Document"
                  : ""),
              user: {
                _id: String(replyToMessage.user._id),
                name: replyToMessage.user.name || "Unknown User",
              },
            },
          }),
        };

        setReplyToMessage(null);
        setMediaPreview({ type: null, uri: null });
        setInputHeight(rV(40));

        if (!messageIds.has(tempId)) {
          setMessages((prevMessages) => [tempMessage, ...prevMessages]);
          setMessageIds((prev) => new Set([...prev, tempId]));
          if (tempMessage.image) {
            setImageViewerImages((prev) => [...prev, tempMessage.image!]);
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
          await setItem(
            `unsent_message_${tempId}`,
            JSON.stringify(messageToStore)
          );
          const allKeysRaw = (await getItem("storage_keys")) || "[]";
          let keys = JSON.parse(allKeysRaw) || [];
          if (!keys.includes(`unsent_message_${tempId}`)) {
            keys.push(`unsent_message_${tempId}`);
            await setItem("storage_keys", JSON.stringify(keys));
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
      setItem,
      getItem,
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
      const selectedImages = await Promise.all(
        result.assets.map(async (asset) => {
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }], // Resize to width 800px
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );

          return {
            uri: manipulatedImage.uri,
            type: "image",
            id: uuidv4(),
          };
        })
      );

      console.log("Manipulated & selected images:", selectedImages);
      setSelectedImagesForPreview(selectedImages);
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
      } catch (error) {
        console.error("handleSendImage error:", error);
        throw error;
      }
    },
    [sendMediaMessage]
  );

  const onClose = useCallback(() => {
    setIsImagePreviewVisible(false);
    setSelectedImagesForPreview([]);
  }, []);

  const onRequestClose = useCallback(() => {
    setIsImageViewerVisible(false);
  }, []);

  const handleCopySelected = useCallback(async () => {
    const textToCopy = selectedMessages
      .map((msg) => msg.text)
      .filter((text) => text)
      .join("\n\n");
    await Clipboard.setStringAsync(textToCopy);
    ToastAndroid.show("Messages copied to clipboard", ToastAndroid.SHORT);
  }, [selectedMessages]);

  const handleLongPress = useCallback((message: CustomIMessage) => {
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
        return updatedMessages;
      });
      setEditingMessage(null);
      setMessageInput("");
      setSelectedMessages([]);
    }
  }, [editingMessage, messageInput, sendMessage]);

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
                console.log("Message deleted!", message._id);
              });

              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.filter(
                  (m) =>
                    !selectedMessages.some((selMsg) => selMsg._id === m._id)
                );
                return updatedMessages;
              });
              setSelectedMessages([]);
            },
          },
        ]
      );
    }
  }, [selectedMessages, sendMessage, canEditDeleteOrReply]);

  const updateHeader = useCallback(() => {
    console.log("updateHeader called", {
      selectedMessagesCount: selectedMessages.length,
      community: community?.name || "Unknown",
      headerState: selectedMessages.length > 0 ? "selected" : "default",
    });

    const headerOptions = {
      headerStyle: {
        backgroundColor: themeColors.reverseText,
      },
      headerTitleAlign: "center" as const, // Explicitly set to center
      headerTintColor: themeColors.text,
      headerShadowVisible: false,
      headerTitleContainerStyle: {
        maxWidth: width * 0.9, // Allow nearly full width
        flexGrow: 1,
        flexShrink: 1,
        alignItems: "center" as const, // Ensure title container is centered
      },
    };

    if (selectedMessages.length > 0) {
      console.log("Rendering selected messages header", {
        selectedMessagesCount: selectedMessages.length,
      });
      const { canDelete, canEdit, canReply } = canEditDeleteOrReply();
      navigation.setOptions({
        ...headerOptions,
        headerTitle: () => (
          <Text
            style={{
              color: themeColors.text,
              fontSize: rMS(18),
              fontWeight: "bold",
              textAlign: "center", // Ensure text is centered
            }}
          >
            {`${selectedMessages.length} Selected`}
          </Text>
        ),
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
                onPress={() => {
                  setReplyToMessage(selectedMessages[0]);
                  handleDeselectAll();
                }}
                style={{ marginHorizontal: rS(8) }}
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
                onPress={() => {
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
                onPress={() => {
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
              onPress={() => {
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
      console.log("Rendering default header", {
        communityName: community?.name || "Unknown",
        communityId,
      });
      navigation.setOptions({
        ...headerOptions,
        headerTitle: () => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "CommunityDetailScreen",
                params: { id: communityId },
              })
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center", // Center the row content
              flexGrow: 1,
              flexShrink: 1,
              paddingVertical: rV(4),
              width: "100%", // Ensure full width to center properly
            }}
          >
            <AppImage
              uri={community?.image_url || "https://via.placeholder.com/28"}
              style={{
                width: rS(28),
                height: rV(28),
                marginRight: rS(6),
                borderRadius: rS(14),
              }}
            />
            <Text
              style={{
                color: themeColors.text,
                fontSize: rMS(16),
                fontWeight: "600",
                flexShrink: 1,
                textAlign: "center", // Center the text
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {community?.name || "Chat"}
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
    community,
    width,
  ]);

  const handlePress = useCallback((message: CustomIMessage) => {
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
      const isOtherUser = props.currentMessage.user._id !== user?.id;
      const isSameUserMessage = isSameUser(
        props.currentMessage,
        props.previousMessage
      );
      const isSameDayMessage = isSameDay(
        props.currentMessage,
        props.previousMessage
      );
      const isFirstMessageOfBlock = !isSameUserMessage || !isSameDayMessage;
      const isNewDay = !props.previousMessage || !isSameDayMessage;

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
            {isOtherUser && isFirstMessageOfBlock && (
              <Text style={styles.username}>
                {props.currentMessage.user.name}
              </Text>
            )}

            {/* Render PDF document preview if there is a document */}
            {props.currentMessage.document && (
              <TouchableOpacity
                onPress={() => {
                  // Open PDF with proper handling for local files
                  if (props.currentMessage.document) {
                    openPDFDocument(props.currentMessage.document);
                  }
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: rS(8),
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={SIZES.large}
                      color={props.position === "right" ? "#fff" : "#FF4444"}
                    />
                    {/* Show download status icon */}
                    {downloadingPDFs.has(props.currentMessage.document) && (
                      <MaterialCommunityIcons
                        name="download"
                        size={SIZES.small}
                        color={
                          props.position === "right"
                            ? "rgba(255,255,255,0.7)"
                            : themeColors.textSecondary
                        }
                        style={{ marginLeft: rS(4) }}
                      />
                    )}
                    {downloadedPDFs.has(props.currentMessage.document) && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={SIZES.small}
                        color={
                          props.position === "right"
                            ? "rgba(255,255,255,0.7)"
                            : themeColors.textSecondary
                        }
                        style={{ marginLeft: rS(4) }}
                      />
                    )}
                  </View>
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
                          "PDF Document"
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
                      {downloadedPDFs.has(props.currentMessage.document)
                        ? "PDF Document (Downloaded)"
                        : downloadingPDFs.has(props.currentMessage.document)
                        ? "PDF Document (Downloading...)"
                        : "PDF Document"}
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
              left: {
                backgroundColor: themeColors.secondaryBackground,
                marginTop:
                  isSameUserMessage && isSameDayMessage ? rV(0.5) : rV(5),
                marginBottom: rV(0.5),
              },
              right: {
                backgroundColor: themeColors.tint,
                marginTop:
                  isSameUserMessage && isSameDayMessage ? rV(0.5) : rV(5),
                marginBottom: rV(0.5),
              },
              ...(isSelected && styles.blurBackground),
            }}
            // containerStyle={{
            //   marginLeft:
            //     isOtherUser && isSameUserMessage && isSameDayMessage
            //       ? rS(24)
            //       : rS(28),
            //   marginRight: props.position === "right" ? rS(8) : rS(4),
            // }}
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
    [
      selectedMessages,
      handlePress,
      handleLongPress,
      themeColors,
      user?.id,
      downloadingPDFs,
      downloadedPDFs,
    ]
  );

  useEffect(() => {
    const updateProfileImages = () => {
      const newProfileImages = { ...profileImages };
      let hasChanges = false;

      messages.forEach((msg) => {
        const userId = String(msg.user._id);
        const avatarUrl = msg.user.avatar || user?.profile_picture;
        if (
          !newProfileImages[userId] &&
          avatarUrl &&
          typeof avatarUrl === "string"
        ) {
          newProfileImages[userId] = avatarUrl;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setProfileImages(newProfileImages);
      }
    };

    updateProfileImages();
  }, [messages, user?.profile_picture, profileImages]);

  const getAvatarColor = (userId: string) => {
    const colors = ["#007AFF", "#FF2D55", "#5856D6", "#FF9500"];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderAvatar = useCallback(
    (props) => {
      // Check if user exists to avoid undefined errors
      if (!props.currentMessage?.user) {
        console.warn("Message user is undefined:", props.currentMessage);
        return null;
      }

      // Safely get userId with a fallback
      const userId = props.currentMessage.user._id || "unknown";

      // Determine avatar URL with fallbacks, including a default image
      const avatarUrl =
        profileImages[userId] ||
        props.currentMessage.user.avatar ||
        user?.profile_picture ||
        "https://slatebucket.s3.amazonaws.com/media/profile_pics/default.jpg";

      // Construct display name with fallbacks
      const displayName =
        props.currentMessage.user.name ||
        (user?.first_name
          ? `${user.first_name} ${user.last_name || ""}`
          : "Unknown User");
      const initial = displayName.charAt(0).toUpperCase();

      // Render avatar image if a valid URL exists (not the default)
      if (
        avatarUrl &&
        avatarUrl !==
          "https://slatebucket.s3.amazonaws.com/media/profile_pics/default.jpg"
      ) {
        return (
          <View style={styles.avatarContainer}>
            <AppImage uri={avatarUrl} style={styles.avatar} />
          </View>
        );
      } else {
        // Render initial with a tinted background if no valid avatar or using default
        return (
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: themeColors.tint },
            ]}
          >
            <Text style={styles.initials}>{initial}</Text>
          </View>
        );
      }
    },
    [
      profileImages,
      user?.profile_picture,
      user?.first_name,
      user?.last_name,
      themeColors,
    ]
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

  // Platform-specific PDF opening function
  const openLocalPDF = useCallback(async (localUri: string) => {
    try {
      if (Platform.OS === "android") {
        // Android: Try intent launcher first, fallback to sharing
        try {
          const contentUri = await FileSystem.getContentUriAsync(localUri);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: "application/pdf",
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            }
          );
        } catch (intentError) {
          console.error(
            "Intent launcher failed, falling back to sharing:",
            intentError
          );
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, {
              mimeType: "application/pdf",
              dialogTitle: "Open PDF Document",
            });
          } else {
            Alert.alert(
              "Error",
              "Unable to open PDF. Please install a PDF viewer app."
            );
          }
        }
      } else {
        // iOS: Use sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, {
            mimeType: "application/pdf",
            dialogTitle: "Open PDF Document",
          });
        } else {
          Alert.alert("Error", "Sharing is not available on this device");
        }
      }
    } catch (error) {
      console.error("Error opening local PDF:", error);
      Alert.alert("Error", "Failed to open PDF. Please try again.");
    }
  }, []);

  // Handle base64 data URIs
  const handleBase64PDF = useCallback(
    async (documentUri: string) => {
      try {
        const fileName = `document_${Date.now()}.pdf`;
        const localUri = `${FileSystem.documentDirectory}${fileName}`;

        // Extract base64 data from data URI
        const base64Data = documentUri.split(",")[1];
        if (!base64Data) {
          throw new Error("Invalid data URI format");
        }

        // Write base64 data to file
        await FileSystem.writeAsStringAsync(localUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Add to downloaded set
        setDownloadedPDFs((prev) => new Set([...prev, documentUri]));

        // Open the saved file
        await openLocalPDF(localUri);
      } catch (error) {
        console.error("Error handling base64 PDF:", error);
        Alert.alert(
          "Error",
          "Unable to save the PDF to your device. Please try again."
        );
      }
    },
    [openLocalPDF, setDownloadedPDFs]
  );

  const openPDFDocument = useCallback(
    async (documentUri: string) => {
      try {
        // Check if the URI is a local file or remote URL
        if (documentUri.startsWith("file://")) {
          // Local file - use platform-specific approach
          await openLocalPDF(documentUri);
        } else if (
          documentUri.startsWith("https://") ||
          documentUri.startsWith("http://")
        ) {
          // Check if already downloaded
          if (downloadedPDFs.has(documentUri)) {
            const urlFileName = documentUri.split("/").pop()?.split("?")[0];
            const fileName = urlFileName
              ? `${urlFileName}.pdf`
              : `document_${Date.now()}.pdf`;
            const localUri = `${FileSystem.documentDirectory}${fileName}`;

            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (fileInfo.exists) {
              await openLocalPDF(localUri);
              return;
            }
          }

          // If not downloaded or file doesn't exist, download it
          if (downloadingPDFs.has(documentUri)) {
            return; // Already downloading
          }

          setDownloadingPDFs((prev) => new Set([...prev, documentUri]));

          try {
            const urlFileName = documentUri.split("/").pop()?.split("?")[0];
            const fileName = urlFileName
              ? `${urlFileName}.pdf`
              : `document_${Date.now()}.pdf`;
            const localUri = `${FileSystem.documentDirectory}${fileName}`;

            // Download the PDF
            const downloadResult = await FileSystem.downloadAsync(
              documentUri,
              localUri
            );

            if (downloadResult.status === 200) {
              setDownloadedPDFs((prev) => new Set([...prev, documentUri]));
              await openLocalPDF(localUri);
            } else {
              throw new Error(
                `Download failed with status: ${downloadResult.status}`
              );
            }
          } catch (downloadError) {
            console.error("Error downloading PDF:", downloadError);
            try {
              await Linking.openURL(documentUri);
            } catch (err) {
              console.error("Failed to open external PDF:", err);
              Alert.alert(
                "Error",
                "Unable to download or open the PDF. Please check your internet connection and try again."
              );
            }
          } finally {
            setDownloadingPDFs((prev) => {
              const newSet = new Set(prev);
              newSet.delete(documentUri);
              return newSet;
            });
          }
        } else if (documentUri.startsWith("data:")) {
          // Handle base64 data URIs
          await handleBase64PDF(documentUri);
        } else {
          // Unknown format - try Linking as fallback
          try {
            await Linking.openURL(documentUri);
          } catch (err) {
            console.error("Failed to open PDF:", err);
            Alert.alert(
              "Error",
              "Unable to open PDF. Please ensure you have a PDF viewer app installed."
            );
          }
        }
      } catch (error) {
        console.error("Error opening PDF:", error);
        Alert.alert("Error", "Failed to open PDF document. Please try again.");
      }
    },
    [downloadedPDFs, downloadingPDFs, openLocalPDF, handleBase64PDF]
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
            <TouchableOpacity
              onPress={() => {
                if (mediaPreview.uri) {
                  openPDFDocument(mediaPreview.uri);
                }
              }}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: rS(8),
                }}
              >
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={SIZES.medium}
                  color="#FF4444"
                />
                {/* Show download status icon */}
                {mediaPreview.uri && downloadingPDFs.has(mediaPreview.uri) && (
                  <MaterialCommunityIcons
                    name="download"
                    size={SIZES.small}
                    color={themeColors.textSecondary}
                    style={{ marginLeft: rS(4) }}
                  />
                )}
                {mediaPreview.uri && downloadedPDFs.has(mediaPreview.uri) && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={SIZES.small}
                    color={themeColors.textSecondary}
                    style={{ marginLeft: rS(4) }}
                  />
                )}
              </View>
              <Text style={styles.previewDocument}>
                {decodeURIComponent(
                  mediaPreview.uri.split("/").pop() || "PDF Document"
                )}
              </Text>
              <Text
                style={[
                  styles.previewDocument,
                  {
                    fontSize: SIZES.xSmall,
                    color: themeColors.textSecondary,
                    marginLeft: rS(8),
                  },
                ]}
              >
                {mediaPreview.uri && downloadedPDFs.has(mediaPreview.uri)
                  ? "(PDF) - Downloaded"
                  : mediaPreview.uri && downloadingPDFs.has(mediaPreview.uri)
                  ? "(PDF) - Downloading..."
                  : "(PDF) - Tap to open"}
              </Text>
            </TouchableOpacity>
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
  }, [mediaPreview, themeColors, downloadingPDFs, downloadedPDFs]);

  const renderInputToolbar = useCallback(
    (props) => {
      const MIN_INPUT_HEIGHT = rV(40);
      const MAX_INPUT_HEIGHT = rV(120);

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
              <View
                style={[
                  styles.inputField,
                  {
                    height: Math.min(
                      Math.max(inputHeight, MIN_INPUT_HEIGHT),
                      MAX_INPUT_HEIGHT
                    ),
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      height: inputHeight,
                      maxHeight: MAX_INPUT_HEIGHT,
                    },
                  ]}
                  scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
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
                  multiline={true}
                  onContentSizeChange={(e) => {
                    const newHeight = e.nativeEvent.contentSize.height;
                    setInputHeight(newHeight);
                  }}
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
      inputHeight,
    ]
  );

  const handleScroll = useCallback(({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    setShouldScrollToBottom(isCloseToBottom);
  }, []);

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
      width: rS(26),
      height: rS(26),
      borderRadius: rMS(18),
      overflow: "hidden",
      backgroundColor: "#ccc",
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(3.5),
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
      marginVertical: rV(5),
      paddingHorizontal: rS(10),
      marginRight: rS(10),
      height: rV(40),
    },
    textInput: {
      flex: 1,
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontFamily: FONT.regular,
      lineHeight: rV(20),
      paddingVertical: 0,
    },
    attachButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: rS(10),
      height: rV(30),
    },
    attachButton: {
      marginHorizontal: rS(5),
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
      // padding: rS(10),
      borderRadius: rMS(8),
      maxWidth: rS(250),
      // marginVertical: rV(4),
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
    scrollToBottomButton: {
      width: rS(40),
      height: rS(40),
      borderRadius: rMS(20),
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
          scrollToBottom={shouldScrollToBottom}
          scrollToBottomComponent={() => (
            <View style={styles.scrollToBottomButton}>
              <MaterialCommunityIcons
                name="chevron-double-down"
                size={SIZES.large}
                color={themeColors.text}
              />
            </View>
          )}
          loadEarlier={loadEarlier}
          onLoadEarlier={handleLoadEarlier}
          isLoadingEarlier={isLoadingEarlier}
          listViewProps={{
            scrollEventThrottle: 16,
            maintainVisibleContentPosition: {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            },
            initialNumToRender: 20,
            maxToRenderPerBatch: 10,
            windowSize: 10,
            removeClippedSubviews: true,
            onScroll: handleScroll,
            scrollEnabled: true,
          }}
        />
      )}
      <FullScreenImageViewer
        visible={isImageViewerVisible}
        images={imageViewerImages}
        currentIndex={currentImageIndex}
        onRequestClose={onRequestClose}
      />
      <ImagePreviewModal
        visible={isImagePreviewVisible}
        images={selectedImagesForPreview}
        onClose={onClose}
        onSend={handleSendImage}
      />
    </View>
  );
};
export default CommunityChatScreen;
