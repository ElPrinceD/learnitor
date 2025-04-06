import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useColorScheme,
  Share,
  Alert,
  Switch,
  FlatList,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import ImageView from "react-native-image-viewing";
import { getCommunityDetails, leaveCommunity, getCommunityMessages, getCommunityTimetable } from "../../CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../webSocketProvider";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import { rMS, rS, rV, SIZES } from "../../constants";
import { router } from "expo-router";
import TimetableItem from "../../components/TimetableItem";
import AppImage from "../../components/AppImage";

type RouteParams = { id: string };

const CommunityDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const navigation = useNavigation();
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;

  // Extract SQLite utilities from WebSocket context with fallback defaults
  const {
    unsubscribeFromCommunity,
    sqliteGetItem,
    sqliteSetItem,
    sqliteRemoveItem,
  } = useWebSocket() || {
    unsubscribeFromCommunity: () => { },
    sqliteGetItem: async () => null,
    sqliteSetItem: async () => { },
    sqliteRemoveItem: async () => { },
  };

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [communityImages, setCommunityImages] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isUserLeader, setIsUserLeader] = useState(false);
  const [visible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const sortedMembers = useMemo(() => {
    return community?.members?.sort((a, b) => a.first_name.localeCompare(b.first_name)) || [];
  }, [community?.members]);

  // SQLite-based caching functions
  const getCachedData = useCallback(async (key: string) => {
    const data = await sqliteGetItem(key);
    return data ? JSON.parse(data) : null;
  }, [sqliteGetItem]);

  const setCachedData = useCallback(async (key: string, data: any) => {
    await sqliteSetItem(key, JSON.stringify(data));
  }, [sqliteSetItem]);

  const removeCachedData = useCallback(async (key: string) => {
    await sqliteRemoveItem(key);
  }, [sqliteRemoveItem]);

  // Fetch community data, load from cache first, then update with fresh data
  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);

      // Load cached data immediately if available
      const cachedCommunity = await getCachedData(`community_${id}`);
      if (cachedCommunity) setCommunity(cachedCommunity);

      if (!userToken?.token) throw new Error("User not authenticated.");

      // Fetch fresh data from APe
      const data = await getCommunityDetails(id, userToken.token);
      setCommunity(data);
      await setCachedData(`community_${id}`, data); // Save to SQLite for future use
      setIsUserLeader(data?.created_by === user?.email);

      const messages = await getCommunityMessages(id, userToken.token);
      const images = messages.filter(msg => msg.image).map(msg => msg.image);
      setCommunityImages(images);

      const timetableData = await getCommunityTimetable(id, userToken.token);
      setTimetable(timetableData);

      const memberImages = data?.members?.reduce((acc, member) => {
        if (member.profile_picture) acc[member.id.toString()] = member.profile_picture;
        return acc;
      }, {} as Record<string, string>);
      if (memberImages) setProfileImages(prev => ({ ...prev, ...memberImages }));
    } catch (err) {
      setError(err.message || "Failed to load community data.");
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, userToken?.token, user?.email, getCachedData, setCachedData]);

  useEffect(() => {
    if (id) fetchCommunityData();
  }, [id, fetchCommunityData]);

  const handleTimetableItemPress = useCallback((item) => {
    router.push({ pathname: "TimeTableDetails", params: { timetableId: item.id, isUserLeader } });
  }, [isUserLeader]);

  const shareCommunity = useCallback(async () => {
    try {
      const shareableLink = community?.shareable_link; // e.g., myapp://join/sJmnCdcdXRRPHWMzVkh1
      await Share.share({
        message: `Check out this channel: ${community?.name}\nJoin here: ${shareableLink}`,
        url: shareableLink, // Ensures the link is tappable where supported
      });
    } catch (err) {
      console.error("Error sharing community:", err);
    }
  }, [community?.name, community?.shareable_link]);

  // In your leaveCommunityHandler (CommunityDetailScreen)
const leaveCommunityHandler = useCallback(async () => {
  try {
    if (!userToken?.token) throw new Error("User not authenticated.");

    // Leave the community via API
    await leaveCommunity(id, userToken.token);

    // Unsubscribe from WebSocket updates
    unsubscribeFromCommunity(id);

    // Remove all related data from SQLite
    const dbKeysToRemove = [
      `community_${id}`,      // Community details
      `messages_${id}`,       // Community messages
      `last_message_${id}`,   // Last message cache
    ];
    await Promise.all(dbKeysToRemove.map(key => sqliteRemoveItem(key)));

    // Update cached communities list by filtering out the left community
    const cachedCommunities = await getCachedData("communities");
    if (cachedCommunities) {
      const updatedCommunities = cachedCommunities.filter(
        (c: Community) => c.id.toString() !== id.toString()
      );
      await setCachedData("communities", updatedCommunities);
    }

    // Persist the left community ID so that subsequent fetches can filter it out.
    const storedLeftIds = await sqliteGetItem("leftCommunityIds");
    const leftCommunityIds = storedLeftIds ? JSON.parse(storedLeftIds) : [];
    await sqliteSetItem("leftCommunityIds", JSON.stringify([...leftCommunityIds, id.toString()]));

    setIsFollowing(false);
    Alert.alert("Success", "You have left the channel.");

    router.replace({
      pathname: "/CommunityScreen",
      params: { leftCommunityId: id },
    });
  } catch (err) {
    console.error("Error leaving community:", err);
    Alert.alert("Error", "Failed to leave the channel.");
  }
}, [id, userToken?.token, unsubscribeFromCommunity, getCachedData, setCachedData, sqliteRemoveItem, sqliteGetItem, sqliteSetItem]);

  

  const confirmLeaveCommunity = useCallback(() => {
    Alert.alert("Leave Channel", "Are you sure you want to leave (unfollow) this channel?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: leaveCommunityHandler },
    ]);
  }, [leaveCommunityHandler]);

  const renderAvatar = useCallback((member) => {
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
  }, [profileImages]);

  const renderHeader = useCallback(() => (
    <>
      <View style={styles.profileSection}>
        <Image source={{ uri: community?.image_url }} style={styles.channelImage} />
        <Text style={[styles.channelName, { color: themeColors.text }]}>{community?.name}</Text>
        <Text style={[styles.followerCount, { color: themeColors.textSecondary }]}>
          {community?.description || `The official channel of ${community?.name}.`}
        </Text>
      </View>

      <View style={styles.communityStats}>
        <View style={styles.statItem}>
          <FontAwesome6 name={isUserLeader ? "crown" : "user"} size={SIZES.large} color={themeColors.text} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
            {isUserLeader ? "Leader" : "Member"}
          </Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <FontAwesome6 name="users" size={16} color={themeColors.text} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
            {community?.members?.length}+ Member
          </Text>
        </View>
        <TouchableOpacity style={[styles.statItem, styles.statDivider]} onPressIn={shareCommunity}>
          <FontAwesome6 name="share" size={16} color={themeColors.text} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionContainer, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity style={styles.sectionItem} onPressIn={() => {
          router.push({ pathname: "CommunityImageScreen", params: { id, images: communityImages } });
        }}>
          <Ionicons name="image-outline" size={24} color={themeColors.text} style={styles.icon} />
          <View style={styles.sectionTextContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Media, links and docs</Text>
            <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>{communityImages.length}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={themeColors.text} />
        </TouchableOpacity>
        
        {/* Render "Lock chat" option only if user is leader */}
        {isUserLeader && (
          <View style={styles.sectionItem}>
            <Ionicons name="lock-closed-outline" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Lock chat</Text>
            </View>
            <Switch
              value={isMuted}
              onValueChange={() => setIsMuted(prev => !prev)}
              trackColor={{ true: themeColors.tint, false: "#999" }}
            />
          </View>
        )}
        <TouchableOpacity style={styles.sectionItem}>
          <Ionicons name="lock-closed" size={24} color={themeColors.text} style={styles.icon} />
          <View style={styles.sectionTextContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Encryption</Text>
            <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>
              Messages and calls are end-to-end encrypted.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>Members</Text>
      </View>
    </>
  ), [community, isUserLeader, themeColors, communityImages, isMuted, shareCommunity]);

  const renderFooter = useCallback(() => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>Calendar</Text>
        {isUserLeader && (
          <TouchableOpacity onPress={() => router.push({ pathname: "TimeTable", params: { id } })}>
            <Text style={[styles.viewAllText, { color: themeColors.tint }]}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {timetable.length === 0 ? (
        <Text style={{ color: themeColors.textSecondary, marginLeft: rV(16), marginBottom: rV(10) }}>
          No events found.
        </Text>
      ) : (
        <View style={styles.calendarContainer}>
          {timetable.map(item => (
            <TimetableItem
              key={item.id}
              plan={{ ...item, logo: community?.image_url }}
              onPress={() => handleTimetableItemPress(item)}
            />
          ))}
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Ionicons name="earth" size={22} color={themeColors.textSecondary} style={{ marginRight: 10 }} />
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>Public channel</Text>
        </View>
        <Text style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}>
          Anyone can find this channel and see what's been shared.
        </Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Ionicons name="lock-closed" size={22} color={themeColors.textSecondary} style={{ marginRight: 10 }} />
          <Text style={[styles.infoTitle, { color: themeColors.text }]}>Profile privacy</Text>
        </View>
        <Text style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}>
          This channel has a reduced profile for your phone number. Tap to learn more.
        </Text>
      </View>

      <Text style={[styles.createdDate, { color: themeColors.textSecondary }]}>
        Created {community?.created_at?.substring(0, 10) || "N/A"}
      </Text>

      <TouchableOpacity style={styles.unfollowButton} onPress={confirmLeaveCommunity}>
        <Text style={styles.unfollowButtonText}>Unfollow channel</Text>
      </TouchableOpacity>

      {/* Render "Delete channel" option only if user is leader */}
      {isUserLeader && (
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => Alert.alert("Report", "Report channel functionality.")}
        >
          <Text style={styles.reportButtonText}>Delete channel</Text>
        </TouchableOpacity>
      )}
    </>
  ), [community, isUserLeader, themeColors, timetable, handleTimetableItemPress, confirmLeaveCommunity]);

  const styles = StyleSheet.create({
    container: { flex: 1 },
    profileSection: { alignItems: "center", marginTop: rV(20) },
    channelImage: { width: rMS(80), height: rMS(80), borderRadius: rMS(40), marginBottom: rV(10) },
    channelName: { fontSize: SIZES.large, fontWeight: "bold", marginBottom: rV(4), color: themeColors.text },
    followerCount: { fontSize: SIZES.medium, color: themeColors.textSecondary, textAlign: "center" },
    leaderBadge: { marginTop: rV(4), fontSize: SIZES.medium, fontWeight: "600", color: themeColors.tint },
    communityStats: { flexDirection: "row", marginTop: rV(20), justifyContent: "space-around", width: "100%" },
    statItem: { alignItems: "center", flex: 1 },
    statDivider: { borderLeftWidth: rS(2), borderLeftColor: themeColors.text },
    statText: { fontSize: SIZES.small, marginTop: rV(5), color: themeColors.textSecondary },
    sectionContainer: { paddingHorizontal: rS(16), marginTop: rV(20) },
    sectionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rV(10),
      borderBottomWidth: rS(1),
      borderBottomColor: themeColors.secondaryBackground,
      paddingHorizontal: rS(16),
    },
    icon: { marginRight: rS(10) },
    sectionTextContainer: { flex: 1 },
    sectionTitle: { fontSize: SIZES.medium, color: themeColors.text },
    sectionValue: { fontSize: SIZES.small, color: themeColors.textSecondary },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(16),
      marginTop: rV(30),
      marginBottom: rV(10),
    },
    sectionHeaderText: { fontSize: SIZES.medium, fontWeight: "bold", color: themeColors.text },
    viewAllText: { fontSize: SIZES.small, fontWeight: "600", color: themeColors.tint },
    memberItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: rS(16),
      paddingVertical: rV(10),
      borderBottomWidth: rS(1),
      borderBottomColor: themeColors.secondaryBackground,
    },
    memberPicture: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(20),
      marginRight: rS(10),
      backgroundColor: themeColors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { color: themeColors.text, fontSize: SIZES.medium },
    memberInfo: { flex: 1 },
    memberName: { fontSize: SIZES.medium, fontWeight: "500", color: themeColors.text },
    calendarContainer: { paddingHorizontal: rS(16) },
    infoRow: { paddingHorizontal: rS(16), marginTop: rV(20) },
    infoLeft: { flexDirection: "row", alignItems: "center", marginBottom: rV(5) },
    infoTitle: { fontSize: SIZES.medium, fontWeight: "600", color: themeColors.text },
    infoSubtitle: { fontSize: SIZES.small, lineHeight: rV(20), color: themeColors.textSecondary },
    createdDate: { marginTop: rV(20), paddingHorizontal: rS(16), fontSize: SIZES.small, color: themeColors.textSecondary },
    unfollowButton: {
      backgroundColor: themeColors.secondaryBackground,
      marginTop: rV(20),
      marginHorizontal: rS(16),
      paddingVertical: rV(12),
      borderRadius: rMS(8),
      alignItems: "center",
    },
    unfollowButtonText: { fontSize: SIZES.medium, fontWeight: "600", color: themeColors.errorText },
    reportButton: {
      backgroundColor: themeColors.errorText,
      marginTop: rV(10),
      marginBottom: rV(40),
      marginHorizontal: rS(16),
      paddingVertical: rV(12),
      borderRadius: rMS(8),
      alignItems: "center",
    },
    reportButtonText: { fontSize: SIZES.medium, fontWeight: "600", color: themeColors.background },
  });

  const data = useMemo(() => (
    sortedMembers.length > 0 ? sortedMembers.slice(0, 5) : [{ id: "no-members", type: "no-members" }]
  ), [sortedMembers]);

  const renderItem = useCallback(({ item }) => {
    if (item.type === "no-members") {
      return (
        <Text style={{ color: themeColors.textSecondary, marginLeft: rV(16), marginBottom: rV(10) }}>
          No members yet.
        </Text>
      );
    }
    return (
      <View style={styles.memberItem}>
        {renderAvatar(item)}
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: themeColors.text }]}>
            {item.first_name} {item.last_name}
          </Text>
        </View>
      </View>
    );
  }, [themeColors, renderAvatar]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (error || !community) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>{error || "Channel not found."}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
      />
      <Modal visible={visible} transparent={true} onRequestClose={() => setIsVisible(false)}>
        <ImageView
          images={communityImages.map(uri => ({ uri }))}
          imageIndex={currentImageIndex}
          visible={visible}
          onRequestClose={() => setIsVisible(false)}
        />
      </Modal>
    </View>
  );
};

export default CommunityDetailScreen;
