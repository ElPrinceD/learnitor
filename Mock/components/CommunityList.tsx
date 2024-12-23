import React from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from "react-native";
import CommunityListItem from "./CommunityListItem";
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, SIZES } from "../constants";

interface CommunityListProps {
  title?: string;
  data: Community[];
  onCommunityPress: (item: Community) => void;
  showLastMessage?: boolean;
  getLastMessage?: (
    communityId: string
  ) => { sender: string; message: string; sent_at: string } | null;
}

const CommunityList: React.FC<CommunityListProps> = ({
  title,
  data,
  onCommunityPress,
  showLastMessage = false,
  getLastMessage,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    sectionHeader: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginBottom: 8,
      marginTop: 6,
    },
    separator: {
      borderBottomWidth: 0.3,
      borderBottomColor: "#c0c0c0",
      marginLeft: 63,
    },
  });

  return data.length > 0 ? (
    <ScrollView>
      {title ? <Text style={styles.sectionHeader}>{title}</Text> : null}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityListItem
            item={item}
            onPress={() => onCommunityPress(item)}
            showLastMessage={showLastMessage}
            lastMessage={
              showLastMessage && getLastMessage ? getLastMessage(item.id) : null
            }
          />
        )}
        // ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </ScrollView>
  ) : null;
};

export default CommunityList;
