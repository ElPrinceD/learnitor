import React from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import CommunityListItem from "./CommunityListItem"; // Assuming you have this component for consistent display
import { Community } from "./types";
import Colors from "../constants/Colors";
import { rS, SIZES } from "../constants";

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

  const handleJoinCommunity = (community: Community) => {
    Alert.alert(
      "Join Community?",
      `Do you want to join ${community.name}?`,
      [
        {
          text: "No",
          style: "cancel",
        },
        { 
          text: "Yes", 
          onPress: () => onCommunityPress(community)
        }
      ]
    );
  };

  return data.length > 0 ? (
    <ScrollView>
      {title ? <Text style={styles.sectionHeader}>{title}</Text> : null}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleJoinCommunity(item)}>
            <CommunityListItem
              item={item}
              onPress={() => handleJoinCommunity(item)} // This will trigger the Alert
              showLastMessage={false} // No last message for global communities
              lastMessage={null}
              isGlobal={true}
            />
            
          </TouchableOpacity>
        )}
        // ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </ScrollView>
  ) : null;
};

export default GlobalCommunityList;