import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Share,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import {
  getCommunityDetails,
  leaveCommunity,
} from "../../../CommunityApiCalls";
import { useAuth } from "../../../components/AuthContext";
import Colors from "../../../constants/Colors";
import { Community } from "../../../components/types";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the type for route params
type RouteParams = {
  id: string; // Community ID
};

const CommunityDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const navigation = useNavigation();
  const { userToken } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Links" | "Documents" | "Images">(
    "Links"
  );
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        // Check if community data is cached
        const cachedCommunity = await AsyncStorage.getItem(`community_${id}`);
        if (cachedCommunity) {
          setCommunity(JSON.parse(cachedCommunity));
          setLoading(false);
          return; // Don't fetch from API if cached data is available
        }

        if (userToken) {
          const data = await getCommunityDetails(id, userToken.token);
          setCommunity(data);
          // Cache the community data
          await AsyncStorage.setItem(`community_${id}`, JSON.stringify(data));
        } else {
          setError("User not authenticated.");
        }
      } catch (error) {
        setError("Failed to load community details.");
        console.error("Failed to load community details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCommunity(); // Ensure id is defined before fetching
  }, [id, userToken]);

  const shareCommunity = async () => {
    console.log(community?.shareable_link);
    try {
      const result = await Share.share({
        message: `Check out this community: ${community?.name}\nJoin here: ${community?.shareable_link}`, // Replace with actual community link
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      console.error("Error sharing community:", error);
    }
  };

  const confirmLeaveCommunity = () => {
    Alert.alert(
      "Leave Community",
      "Are you sure you want to leave this community?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: leaveCommunityHandler,
        },
      ]
    );
  };

  const leaveCommunityHandler = async () => {
    try {
      if (userToken?.token) {
        await leaveCommunity(id, userToken.token);
        Alert.alert("Success", "You have left the community.");
        router.dismiss(2);
        // Clear cached data since the user is no longer a member
        await AsyncStorage.removeItem(`community_${id}`);
      } else {
        Alert.alert("Error", "User not authenticated.");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      Alert.alert("Error", "Failed to leave the community.");
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text }}>{error}</Text>
      </View>
    );
  }

  if (!community) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text }}>Community not found.</Text>
      </View>
    );
  }

  // Sort members alphabetically by first name
  const sortedMembers = community.members?.sort((a, b) =>
    a.first_name.localeCompare(b.first_name)
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.communityHeader}>
        <Image
          source={{ uri: community.image_url }}
          style={styles.profilePicture}
        />
        <Text style={[styles.communityName, { color: themeColors.text }]}>
          {community.name}
        </Text>
        <Text
          style={[styles.membersCount, { color: themeColors.textSecondary }]}
        >
          {community.members?.length} Members
        </Text>
        <View style={styles.iconRow}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: themeColors.reverseText },
            ]}
          >
            <FontAwesome6 name="bell" size={24} color={themeColors.text} />
            <Text
              style={[styles.iconLabel, { color: themeColors.textSecondary }]}
            >
              Mute
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              { backgroundColor: themeColors.reverseText },
            ]}
            onPress={confirmLeaveCommunity}
          >
            <FontAwesome6
              name="right-from-bracket"
              size={24}
              color={themeColors.text}
            />
            <Text
              style={[styles.iconLabel, { color: themeColors.textSecondary }]}
            >
              Leave
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              { backgroundColor: themeColors.reverseText },
            ]}
            onPress={shareCommunity}
          >
            <FontAwesome6 name="share" size={24} color={themeColors.text} />
            <Text
              style={[styles.iconLabel, { color: themeColors.textSecondary }]}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Members Section */}
      <View
        style={[
          styles.membersSection,
          { backgroundColor: themeColors.reverseText },
        ]}
      >
        <Text style={[styles.membersTitle, { color: themeColors.text }]}>
          Members
        </Text>
        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Image
                source={{ uri: item.profile_picture }}
                style={styles.memberPicture}
              />
              <Text style={[styles.memberName, { color: themeColors.text }]}>
                {item.first_name} {item.last_name}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={[
                styles.noMembersText,
                { color: themeColors.textSecondary },
              ]}
            >
              No members found.
            </Text>
          }
        />
      </View>

      {/* Mini Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Links" && {
              backgroundColor: themeColors.background,
            },
          ]}
          onPress={() => setActiveTab("Links")}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.text },
              activeTab === "Links" && { color: themeColors.tint },
            ]}
          >
            Links
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Documents" && {
              backgroundColor: themeColors.background,
            },
          ]}
          onPress={() => setActiveTab("Documents")}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.text },
              activeTab === "Documents" && { color: themeColors.tint },
            ]}
          >
            Documents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Images" && {
              backgroundColor: themeColors.background,
            },
          ]}
          onPress={() => setActiveTab("Images")}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.text },
              activeTab === "Images" && { color: themeColors.tint },
            ]}
          >
            Images
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render Content Based on Active Tab */}
      {activeTab === "Links" && (
        <View>
          <Text style={{ color: themeColors.text }}>Links Content</Text>
          {/* Add the actual Links content here */}
        </View>
      )}
      {activeTab === "Documents" && (
        <View>
          <Text style={{ color: themeColors.text }}>Documents Content</Text>
          {/* Add the actual Documents content here */}
        </View>
      )}
      {activeTab === "Images" && (
        <View>
          <Text style={{ color: themeColors.text }}>Images Content</Text>
          {/* Add the actual Images content here */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  communityHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  communityName: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  membersCount: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 5,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  iconContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 7,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  iconLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
  },
  membersSection: {
    marginVertical: 10,
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  memberPicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
  },
  noMembersText: {
    textAlign: "center",
    fontSize: 16,
  },
});

export default CommunityDetailScreen;