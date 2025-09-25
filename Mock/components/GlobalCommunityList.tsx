import React, { useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import CommunityListItem from "./CommunityListItem";
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, rV, SIZES } from "../constants";

interface GlobalCommunityListProps {
  title?: string;
  data: Community[];
  onCommunityPress: (item: Community) => void;
}

const GlobalCommunityList: React.FC<GlobalCommunityListProps> = ({
  title,
  data,
  onCommunityPress,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handleJoinCommunity = useCallback(
    (community: Community) => {
      Alert.alert(
        `Join ${community.name}?`,
        `Do you want to join this community and start chatting?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Join",
            style: "default",
            onPress: () => onCommunityPress(community),
          },
        ]
      );
    },
    [onCommunityPress]
  );

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityListItem
        item={item}
        onPress={() => handleJoinCommunity(item)}
        showLastMessage={false}
        lastMessage={null}
        isGlobal={true}
        showUnreadIndicator={false}
      />
    ),
    [handleJoinCommunity]
  );

  const styles = StyleSheet.create({
    container: {
      marginBottom: rV(20),
    },
    sectionHeader: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      color: themeColors.text,
      marginBottom: rV(8),
      marginTop: rV(6),
      paddingHorizontal: rS(16),
    },
    separator: {
      borderBottomWidth: 1,
      borderBottomColor: themeColors.text,
      marginHorizontal: rS(16),
    },
  });

  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.sectionHeader}>{title}</Text>}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        // ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

export default React.memo(GlobalCommunityList);
