import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, rV, SIZES } from "../constants";
import { useAuth } from "./AuthContext";
import AppImage from "./AppImage";

interface CommunityListItemProps {
  item: Community;
  onPress: () => void;
  showLastMessage?: boolean;
  lastMessage?: {
    sender?: string;
    message?: string;
    sent_at: string;
    status?: string;
    image?: string | null;
    document?: string | null;
  } | null;
  isGlobal?: boolean;
  showUnreadIndicator?: boolean;
}

const CommunityListItem: React.FC<CommunityListItemProps> = ({
  item,
  onPress,
  showLastMessage = false,
  lastMessage,
  isGlobal = false,
  showUnreadIndicator = false,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userInfo } = useAuth();

  const MAX_SENDER_LENGTH = 15;
  const MAX_MESSAGE_LENGTH = 40;
  const MAX_DESCRIPTION_LENGTH = 80;

  const displaySenderName =
    lastMessage?.sender === userInfo?.user.first_name
      ? "You"
      : lastMessage?.sender || "";

  const truncatedSenderName = useCallback(() => {
    if (!displaySenderName) return "";
    return displaySenderName.length > MAX_SENDER_LENGTH
      ? `${displaySenderName.substring(0, MAX_SENDER_LENGTH)}...`
      : displaySenderName;
  }, [displaySenderName]);

  const getLastMessageTimeDisplay = useCallback((timestamp: string) => {
    const messageDate = moment(timestamp);
    const today = moment();
    if (messageDate.isSame(today, "day")) return messageDate.format("HH:mm");
    if (messageDate.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
    return messageDate.format("DD/MM/YY");
  }, []);

  const truncatedMessage = useCallback((message: string) => {
    return message.length > MAX_MESSAGE_LENGTH
      ? `${message.substring(0, MAX_MESSAGE_LENGTH)}...`
      : message;
  }, []);

  const handleJoinPress = useCallback(async () => {
    if (isJoining) return;

    setIsJoining(true);
    try {
      await onPress();
    } finally {
      setIsJoining(false);
    }
  }, [onPress, isJoining]);

  const styles = StyleSheet.create({
    communityItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingLeft: rS(1),
      paddingVertical: rV(10),
      position: "relative", // Make container relative for absolute positioning below
    },
    communityImage: {
      width: 50,
      height: 50,
      borderRadius: 50,
    },
    unreadIndicator: {
      position: "absolute",
      bottom: 30, // adjust as needed
      right: 10, // adjust as needed
      width: 12,
      height: 12,
      borderRadius: 7.5,
      backgroundColor: "green",
    },
    communityTextContainer: {
      flex: 1,
    },
    communityName: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    lastMessageContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    lastMessage: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    description: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
    lastMessageTime: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      alignSelf: "flex-start",
      paddingRight: rS(10),
    },
    joinButton: {
      backgroundColor: themeColors.tint,
      paddingVertical: rV(8),
      paddingHorizontal: rS(16),
      borderRadius: rS(20),
      marginLeft: "auto",
      shadowColor: themeColors.tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: rS(80),
    },
    joinButtonText: {
      color: themeColors.background,
      fontSize: SIZES.medium,
      fontWeight: "600",
      marginLeft: rS(4),
    },
    joinIcon: {
      marginRight: rS(4),
    },
    photoIcon: {
      marginRight: 4,
    },
  });

  return (
    <TouchableHighlight
      activeOpacity={0.8}
      underlayColor={themeColors.shadow}
      onPress={onPress}
    >
      <View style={styles.communityItem}>
        <View style={styles.communityImage}>
          <AppImage uri={item.image_url} style={styles.communityImage} />
        </View>
        <View style={styles.communityTextContainer}>
          <Text style={[styles.communityName, { color: themeColors.text }]}>
            {item.name}
          </Text>
          {isGlobal ? (
            <Text
              style={[styles.description, { color: themeColors.textSecondary }]}
            >
              {item.description &&
              item.description.length > MAX_DESCRIPTION_LENGTH
                ? `${item.description.substring(0, MAX_DESCRIPTION_LENGTH)}...`
                : item.description || "No description"}
            </Text>
          ) : (
            showLastMessage &&
            lastMessage && (
              <View style={styles.lastMessageContainer}>
                {lastMessage.image || lastMessage.document ? (
                  <>
                    {truncatedSenderName() && (
                      <Text
                        style={[
                          styles.lastMessage,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {`${truncatedSenderName()}: `}
                      </Text>
                    )}
                    <MaterialCommunityIcons
                      name={lastMessage.image ? "image" : "file-document"}
                      size={SIZES.medium}
                      color={themeColors.textSecondary}
                      style={styles.photoIcon}
                    />
                    <Text
                      style={[
                        styles.lastMessage,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {lastMessage.image ? "Photo" : "Document"}
                    </Text>
                  </>
                ) : (
                  lastMessage.message !== undefined && (
                    <Text
                      style={[
                        styles.lastMessage,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {truncatedSenderName()
                        ? `${truncatedSenderName()}: `
                        : ""}
                      {truncatedMessage(lastMessage.message)}
                    </Text>
                  )
                )}
              </View>
            )
          )}
        </View>
        {isGlobal ? (
          <TouchableOpacity
            style={[styles.joinButton, isJoining && { opacity: 0.7 }]}
            onPress={handleJoinPress}
            activeOpacity={0.8}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator
                size="small"
                color={themeColors.background}
                style={styles.joinIcon}
              />
            ) : (
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={themeColors.background}
                style={styles.joinIcon}
              />
            )}
            <Text style={styles.joinButtonText}>
              {isJoining ? "Joining..." : "Join"}
            </Text>
          </TouchableOpacity>
        ) : (
          showLastMessage &&
          lastMessage?.sent_at && (
            <Text
              style={[
                styles.lastMessageTime,
                {
                  color: showUnreadIndicator
                    ? "green"
                    : themeColors.textSecondary,
                },
              ]}
            >
              {getLastMessageTimeDisplay(lastMessage.sent_at)}
            </Text>
          )
        )}
        {!isGlobal && lastMessage && showUnreadIndicator && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    </TouchableHighlight>
  );
};

export default memo(CommunityListItem);
