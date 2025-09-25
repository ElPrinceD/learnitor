import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getCommunityDetails } from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useCache } from "../../contexts/CacheContext";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants";
import AppImage from "../../components/AppImage";

type RouteParams = {
  communityId: string;
  communityName?: string;
};

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
}

const AllMembersScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { communityId, communityName } = route.params as RouteParams;
  const { userToken, userInfo } = useAuth();
  const { getItem, setItem } = useCache();

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Record<string, string>>(
    {}
  );

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const user = userInfo?.user;

  const getCachedData = useCallback(
    async (key: string) => {
      const data = await getItem(key);
      return data ? JSON.parse(data) : null;
    },
    [getItem]
  );

  const setCachedData = useCallback(
    async (key: string, data: any) => {
      await setItem(key, JSON.stringify(data));
    },
    [setItem]
  );

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userToken?.token) {
        throw new Error("User not authenticated");
      }

      const cachedData = await getCachedData(`community_${communityId}`);
      if (
        cachedData &&
        cachedData.members &&
        Array.isArray(cachedData.members)
      ) {
        setCommunity(cachedData);
        setMembers(cachedData.members);
        setLoading(false);
        return;
      }

      const communityData = await getCommunityDetails(
        communityId,
        userToken.token
      );
      console.log("Fetched community data:", communityData);

      setCommunity(communityData);
      setMembers(communityData.members || []);
      await setCachedData(`community_${communityId}`, communityData);

      // Load profile images
      const memberImages = communityData?.members?.reduce((acc, member) => {
        if (member.profile_picture)
          acc[member.id.toString()] = member.profile_picture;
        return acc;
      }, {} as Record<string, string>);
      if (memberImages) {
        setProfileImages(memberImages);
      }
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [communityId, userToken?.token, getCachedData, setCachedData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await setItem(`community_${communityId}`, "");
      await fetchMembers();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMembers, setItem, communityId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    navigation.setOptions({
      title: `Members - ${communityName || "Community"}`,
      headerRight: () => (
        <TouchableOpacity
          onPress={onRefresh}
          style={{ marginRight: 16, padding: 8 }}
        >
          <Ionicons name="refresh" size={24} color={themeColors.tint} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, communityName, themeColors.tint, onRefresh]);

  const renderAvatar = useCallback(
    (member: Member) => {
      const userId = member.id.toString();
      const avatarUrl = profileImages[userId] || member.profile_picture;
      return avatarUrl ? (
        <AppImage uri={avatarUrl} style={styles.memberPicture} />
      ) : (
        <View style={styles.memberPicture}>
          <Text style={styles.initials}>
            {member.first_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    },
    [profileImages]
  );

  const renderMemberCard = useCallback(
    ({ item }: { item: Member }) => {
      const isLeader = item.email === community?.created_by;
      const isCurrentUser = item.email === user?.email;

      return (
        <View
          style={[
            styles.memberCard,
            { backgroundColor: themeColors.secondaryBackground },
          ]}
        >
          <View style={styles.memberHeader}>
            {renderAvatar(item)}
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: themeColors.text }]}>
                {isCurrentUser ? "You" : `${item.first_name} ${item.last_name}`}
              </Text>
              <Text
                style={[
                  styles.memberEmail,
                  { color: themeColors.textSecondary },
                ]}
              >
                {item.email}
              </Text>
              {isLeader && (
                <View
                  style={[
                    styles.leaderBadge,
                    { backgroundColor: themeColors.tint + "20" },
                  ]}
                >
                  <Ionicons name="star" size={14} color={themeColors.tint} />
                  <Text
                    style={[styles.leaderText, { color: themeColors.tint }]}
                  >
                    Leader
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [themeColors, renderAvatar, community?.created_by, user?.email]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name="people-outline"
          size={64}
          color={themeColors.textSecondary}
        />
        <Text
          style={[styles.emptyStateText, { color: themeColors.textSecondary }]}
        >
          No members found
        </Text>
        <Text
          style={[
            styles.emptyStateSubtext,
            { color: themeColors.textSecondary },
          ]}
        >
          This community doesn't have any members yet
        </Text>
      </View>
    ),
    [themeColors]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(20),
      paddingHorizontal: rV(16),
      paddingTop: rV(16),
    },
    headerTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    memberCount: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      backgroundColor: themeColors.tint + "20",
      paddingHorizontal: rS(12),
      paddingVertical: rV(6),
      borderRadius: rMS(16),
    },
    membersList: {
      paddingHorizontal: rV(16),
      paddingBottom: rV(20),
    },
    memberCard: {
      borderRadius: rMS(12),
      padding: rV(16),
      marginBottom: rV(12),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    memberHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    memberPicture: {
      width: rMS(50),
      height: rMS(50),
      borderRadius: rMS(25),
      marginRight: rS(12),
      backgroundColor: themeColors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: {
      color: themeColors.text,
      fontSize: SIZES.medium,
      fontWeight: "600",
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      marginBottom: rV(4),
    },
    memberEmail: {
      fontSize: SIZES.small,
      marginBottom: rV(8),
    },
    leaderBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: rS(8),
      paddingVertical: rV(4),
      borderRadius: rMS(12),
    },
    leaderText: {
      fontSize: SIZES.xSmall,
      fontWeight: "600",
      marginLeft: rS(4),
    },
    emptyStateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: rV(60),
      paddingHorizontal: rS(20),
    },
    emptyStateText: {
      fontSize: SIZES.large,
      fontWeight: "600",
      marginTop: rV(16),
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: SIZES.medium,
      marginTop: rV(8),
      textAlign: "center",
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(20),
    },
    errorText: {
      fontSize: SIZES.medium,
      color: themeColors.errorText,
      textAlign: "center",
      marginTop: rV(12),
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.errorText, { color: themeColors.text }]}>
          Loading members...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={themeColors.errorText}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchMembers}
          style={{
            marginTop: rV(16),
            paddingHorizontal: rS(20),
            paddingVertical: rV(10),
            backgroundColor: themeColors.tint,
            borderRadius: rMS(8),
          }}
        >
          <Text style={{ color: themeColors.background, fontWeight: "600" }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>All Members</Text>
            <View style={styles.memberCount}>
              <Text style={{ color: themeColors.textSecondary }}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.membersList}
      />
    </View>
  );
};

export default AllMembersScreen;
