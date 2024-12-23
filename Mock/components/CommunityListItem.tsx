import React from "react";
import {
  View,
  Text,
  TouchableHighlight,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import moment from "moment";
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, rV, SIZES } from "../constants";
import { useAuth } from "./AuthContext";

interface CommunityListItemProps {
  item: Community;
  onPress: () => void;
  showLastMessage?: boolean;
  lastMessage?: { sender?: string; message?: string; sent_at: string } | null;
  loading?: boolean;
}

const CommunityListItem: React.FC<CommunityListItemProps> = ({
  item,
  onPress,
  showLastMessage,
  lastMessage,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userInfo } = useAuth();

  // Set max length for sender and message text
  const MAX_SENDER_LENGTH = 15;
  const MAX_MESSAGE_LENGTH = 40;

  // Determine the display name for the sender
  const displaySenderName =
    lastMessage?.sender === userInfo?.user.first_name
      ? "You"
      : lastMessage?.sender;

  // Truncate the sender name if it exceeds MAX_SENDER_LENGTH
  const truncatedSenderName = displaySenderName
    ? displaySenderName.length > MAX_SENDER_LENGTH
      ? `${displaySenderName.substring(0, MAX_SENDER_LENGTH)}...`
      : displaySenderName
    : "";

  const getLastMessageTimeDisplay = (timestamp: string) => {
    const messageDate = moment(timestamp);
    const today = moment();

    if (messageDate.isSame(today, "day")) {
      return messageDate.format("HH:mm");
    } else if (messageDate.isSame(today.subtract(1, "day"), "day")) {
      return "Yesterday";
    } else {
      return messageDate.format("DD/MM/YY");
    }
  };

  const styles = StyleSheet.create({
    communityItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingLeft: rS(1),
      paddingVertical: rV(10),
    },
    communityImage: {
      width: 50,
      height: 50,
      borderRadius: 50,
    },
    communityTextContainer: {
      flex: 1,
    },
    communityName: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    lastMessage: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    lastMessageTime: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      alignSelf: "flex-start",
      paddingRight: rS(10),
    },
  });

  return (
    <TouchableHighlight
      activeOpacity={0.8}
      underlayColor={themeColors.shadow}
      onPress={onPress}
    >
      <View style={styles.communityItem}>
        <Image source={{ uri: item.image_url }} style={styles.communityImage} />
        <View style={styles.communityTextContainer}>
          <Text style={styles.communityName}>{item.name}</Text>
          {showLastMessage &&
            lastMessage &&
            lastMessage.message !== undefined && (
              <Text style={styles.lastMessage}>
                {truncatedSenderName ? `${truncatedSenderName}: ` : ""}
                {lastMessage.message.length > MAX_MESSAGE_LENGTH
                  ? `${lastMessage.message.substring(0, MAX_MESSAGE_LENGTH)}...`
                  : lastMessage.message}
              </Text>
            )}
        </View>
        {showLastMessage && lastMessage && (
          <Text style={styles.lastMessageTime}>
            {getLastMessageTimeDisplay(lastMessage.sent_at)}
          </Text>
        )}
      </View>
    </TouchableHighlight>
  );
};

export default CommunityListItem;
