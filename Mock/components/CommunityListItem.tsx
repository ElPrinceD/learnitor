import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableHighlight,
  Image,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, rV, SIZES } from "../constants";
import { useAuth } from "./AuthContext";

interface CommunityListItemProps {
  item: Community;
  onPress: () => void;
  showLastMessage?: boolean;
  lastMessage?: { sender?: string; message?: string; sent_at: string; status?: string; image?: string | null } | null;
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
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userInfo } = useAuth();

  // Constants for text truncation
  const MAX_SENDER_LENGTH = 15;
  const MAX_MESSAGE_LENGTH = 40;
  const MAX_DESCRIPTION_LENGTH = 80;

  // Determine sender display name
  const displaySenderName = lastMessage?.sender === userInfo?.user.first_name ? "You" : lastMessage?.sender || "";

  // Truncate sender name if necessary
  const truncatedSenderName = useCallback(() => {
    if (!displaySenderName) return "";
    return displaySenderName.length > MAX_SENDER_LENGTH
      ? `${displaySenderName.substring(0, MAX_SENDER_LENGTH)}...`
      : displaySenderName;
  }, [displaySenderName]);

  // Format last message timestamp
  const getLastMessageTimeDisplay = useCallback((timestamp: string) => {
    const messageDate = moment(timestamp);
    const today = moment();
    if (messageDate.isSame(today, "day")) return messageDate.format("HH:mm");
    if (messageDate.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
    return messageDate.format("DD/MM/YY");
  }, []);

  // Truncate message text if necessary
  const truncatedMessage = useCallback((message: string) => {
    return message.length > MAX_MESSAGE_LENGTH ? `${message.substring(0, MAX_MESSAGE_LENGTH)}...` : message;
  }, []);

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
      right: 10,  // adjust as needed
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
      backgroundColor: themeColors.buttonBackground,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      marginLeft: "auto",
    },
    joinButtonText: {
      color: themeColors.background,
      fontSize: SIZES.medium,
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
          <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%", borderRadius: 50 }} />
        </View>
        <View style={styles.communityTextContainer}>
          <Text style={styles.communityName}>{item.name}</Text>
          {isGlobal ? (
            <Text style={styles.description}>
              {item.description.length > MAX_DESCRIPTION_LENGTH
                ? `${item.description.substring(0, MAX_DESCRIPTION_LENGTH)}...`
                : item.description}
            </Text>
          ) : (
            showLastMessage && lastMessage && (
              <View style={styles.lastMessageContainer}>
                {lastMessage.image ? (
                  <>
                    {truncatedSenderName() && <Text style={styles.lastMessage}>{`${truncatedSenderName()}: `}</Text>}
                    <MaterialCommunityIcons
                      name="image"
                      size={SIZES.small}
                      color={themeColors.textSecondary}
                      style={styles.photoIcon}
                    />
                    <Text style={styles.lastMessage}>Photo</Text>
                  </>
                ) : (
                  lastMessage.message !== undefined && (
                    <Text style={styles.lastMessage}>
                      {truncatedSenderName() ? `${truncatedSenderName()}: ` : ""}
                      {truncatedMessage(lastMessage.message)}
                    </Text>
                  )
                )}
              </View>
            )
          )}
        </View>
        {isGlobal ? (
          <TouchableOpacity style={styles.joinButton} onPress={onPress}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        ) : (
          showLastMessage && lastMessage?.sent_at && (
            <Text style={styles.lastMessageTime}>{getLastMessageTimeDisplay(lastMessage.sent_at)}</Text>
          )
        )}
        {/* Place the unread indicator at the far bottom right */}
        {!isGlobal && lastMessage && showUnreadIndicator && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    </TouchableHighlight>
  );
};

export default CommunityListItem;
