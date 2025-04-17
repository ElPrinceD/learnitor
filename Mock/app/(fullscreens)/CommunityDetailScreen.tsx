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
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import ImageView from "react-native-image-viewing";
import {
  getCommunityDetails,
  leaveCommunity,
  getCommunityMessages,
  getCommunityTimetable,
  removeCommunityMember,
} from "../../CommunityApiCalls";
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

  const {
    socket,
    unsubscribeFromCommunity,
    sqliteGetItem,
    sqliteSetItem,
    sqliteRemoveItem,
  } = useWebSocket() || {
    socket: null,
    unsubscribeFromCommunity: () => {},
    sqliteGetItem: async () => null,
    sqliteSetItem: async () => {},
    sqliteRemoveItem: async () => {},
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
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllCalendar, setShowAllCalendar] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const sortedMembers = useMemo(() => {
    return (
      community?.members?.sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      ) || []
    );
  }, [community?.members]);

  const memberData = useMemo(() => {
    const members = sortedMembers || [];
    let displayed = showAllMembers ? members : members.slice(0, 5);
    if (!showAllMembers && members.length > 5) {
      displayed = [...displayed, { id: "view-all", type: "view-all" } as any];
    }
    return displayed;
  }, [sortedMembers, showAllMembers]);

  const limitedTimetable = useMemo(() => {
    let items = showAllCalendar ? timetable : timetable.slice(0, 5);
    if (!showAllCalendar && timetable.length > 5) {
      items = [...items, { id: "view-all-cal", type: "view-all-cal" }];
    }
    return items;
  }, [timetable, showAllCalendar]);

  const getCachedData = useCallback(
    async (key: string) => {
      const data = await sqliteGetItem(key);
      return data ? JSON.parse(data) : null;
    },
    [sqliteGetItem]
  );

  const setCachedData = useCallback(
    async (key: string, data: any) => {
      await sqliteSetItem(key, JSON.stringify(data));
    },
    [sqliteSetItem]
  );

  const removeCachedData = useCallback(
    async (key: string) => {
      await sqliteRemoveItem(key);
    },
    [sqliteRemoveItem]
  );

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      const cachedCommunity = await getCachedData(`community_${id}`);
      const cachedTimetable = await getCachedData(`timetable_${id}`);
      const cachedImages = await getCachedData(`images_${id}`);

      if (cachedCommunity && cachedImages && cachedTimetable) {
        setCommunity(cachedCommunity);
        setIsUserLeader(cachedCommunity?.created_by === user?.email);
        setTimetable(Array.isArray(cachedTimetable) ? cachedTimetable : []);
        setCommunityImages(Array.isArray(cachedImages) ? cachedImages : []);
        setLoading(false);
        return;
      }

      if (!userToken?.token) throw new Error("User not authenticated.");

      const data = await getCommunityDetails(id, userToken.token);
      setCommunity(data);
      await setCachedData(`community_${id}`, data);
      setIsUserLeader(data?.created_by === user?.email);

      const messages = await getCommunityMessages(id, userToken.token);
      const images = messages
        .filter((msg) => msg.image)
        .map((msg) => msg.image) || [];
      setCommunityImages(images);
      await setCachedData(`images_${id}`, images);

      const timetableData = await getCommunityTimetable(id, userToken.token) || [];
      console.log(timetableData)
      setTimetable(timetableData);
      await setCachedData(`timetable_${id}`, timetableData);

      const memberImages = data?.members?.reduce((acc, member) => {
        if (member.profile_picture)
          acc[member.id.toString()] = member.profile_picture;
        return acc;
      }, {} as Record<string, string>);
      if (memberImages)
        setProfileImages((prev) => ({ ...prev, ...memberImages }));
    } catch (err: any) {
      setError(err.message || "Failed to load community data.");
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, userToken?.token, user?.email, getCachedData, setCachedData]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchCommunityData();
      }
    }, [id, fetchCommunityData])
  );

  useEffect(() => {
    let socketCleanup = () => {};

    if (socket) {
      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "community_updated" && data.community?.id.toString() === id) {
            setCommunity((prev) => ({
              ...prev,
              ...data.community,
              members: data.community.members || prev?.members || [],
            }));
          } else if (data.type === "member_removed" && data.community_id.toString() === id) {
            setCommunity((prev) => {
              if (!prev) return prev;
              const updatedMembers = prev.members.filter(
                (member) => member.id !== data.user_id
              );
              const updatedCommunity = { ...prev, members: updatedMembers };
              setCachedData(`community_${id}`, updatedCommunity);
              return updatedCommunity;
            });
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.addEventListener("message", onMessage);
      socketCleanup = () => {
        socket.removeEventListener("message", onMessage);
      };
    }

    return socketCleanup;
  }, [socket, id, setCachedData]);

  const handleRemoveMember = useCallback(
    async (userId: number) => {
      try {
        if (!userToken?.token) throw new Error("User not authenticated.");
        await removeCommunityMember(id, userId, userToken.token);
        Alert.alert("Success", "Member removed from the channel.");
      } catch (err) {
        console.error("Error removing member:", err);
        Alert.alert("Error", "Failed to remove member.");
      }
    },
    [id, userToken?.token]
  );

  const renderRightActions = useCallback(
    (userId: number) => (
      <TouchableOpacity
        style={[styles.removeAction, { backgroundColor: themeColors.errorText }]}
        onPress={() => {
          Alert.alert(
            "Remove Member",
            "Are you sure you want to remove this member from the channel?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => handleRemoveMember(userId),
              },
            ]
          );
        }}
      >
        <Text style={styles.removeActionText}>Remove</Text>
      </TouchableOpacity>
    ),
    [handleRemoveMember, themeColors.errorText]
  );

  const renderAvatar = useCallback(
    (member) => {
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

  const renderMemberItem = useCallback(
    ({ item }) => {
      if (item.type === "no-members") {
        return (
          <Text
            style={{
              color: themeColors.textSecondary,
              marginLeft: rV(16),
              marginBottom: rV(10),
            }}
          >
            No members yet.
          </Text>
        );
      }
      if (item.type === "view-all") {
        return (
          <TouchableOpacity
            style={{
              marginLeft: rS(16),
              marginVertical: rV(8),
            }}
            onPress={() => setShowAllMembers(true)}
          >
            <Text style={{ color: themeColors.tint }}>View all members</Text>
          </TouchableOpacity>
        );
      }
      const isLeader = item.email === community?.created_by;
      const memberItem = (
        <View style={styles.memberItem}>
          {renderAvatar(item)}
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: themeColors.text }]}>
              {item.first_name} {item.last_name}
            </Text>
            {isLeader && (
              <Text style={styles.adminText}>Admin</Text>
            )}
          </View>
        </View>
      );

      if (isUserLeader && !isLeader) {
        return (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            {memberItem}
          </Swipeable>
        );
      }
      return memberItem;
    },
    [
      themeColors,
      renderAvatar,
      community?.created_by,
      isUserLeader,
      renderRightActions,
    ]
  );

  const handleTimetableItemPress = useCallback(
    (item) => {
      router.push({
        pathname: "TimeTableDetails",
        params: { timetableId: item.id, isUserLeader },
      });
    },
    [isUserLeader]
  );

  const shareCommunity = useCallback(async () => {
    try {
      const shareableLink = community?.shareable_link;
      await Share.share({
        message: `Check out this channel: ${community?.name}\nJoin here: ${shareableLink}`,
        url: shareableLink,
      });
    } catch (err) {
      console.error("Error sharing community:", err);
    }
  }, [community?.name, community?.shareable_link]);

  const leaveCommunityHandler = useCallback(async () => {
    try {
      if (!userToken?.token) throw new Error("User not authenticated.");

      await leaveCommunity(id, userToken.token);
      unsubscribeFromCommunity(id);

      const dbKeysToRemove = [
        `community_${id}`,
        `messages_${id}`,
        `last_message_${id}`,
      ];
      await Promise.all(dbKeysToRemove.map((key) => sqliteRemoveItem(key)));

      const cachedCommunities = await getCachedData("communities");
      if (cachedCommunities) {
        const updatedCommunities = cachedCommunities.filter(
          (c: Community) => c.id.toString() !== id.toString()
        );
        await setCachedData("communities", updatedCommunities);
      }

      const storedLeftIds = await sqliteGetItem("leftCommunityIds");
      const leftCommunityIds = storedLeftIds ? JSON.parse(storedLeftIds) : [];
      await sqliteSetItem(
        "leftCommunityIds",
        JSON.stringify([...leftCommunityIds, id.toString()])
      );

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
  }, [
    id,
    userToken?.token,
    unsubscribeFromCommunity,
    getCachedData,
    setCachedData,
    sqliteRemoveItem,
    sqliteGetItem,
    sqliteSetItem,
  ]);

  const confirmLeaveCommunity = useCallback(() => {
    Alert.alert(
      "Leave Channel",
      "Are you sure you want to leave (unfollow) this channel?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: leaveCommunityHandler },
      ]
    );
  }, [leaveCommunityHandler]);

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: community?.image_url }}
            style={styles.channelImage}
          />
          <Text style={[styles.channelName, { color: themeColors.text }]}>
            {community?.name}
          </Text>
          <Text
            style={[styles.followerCount, { color: themeColors.textSecondary }]}
          >
            {community?.description ||
              `The official channel of ${community?.name}.`}
          </Text>
        </View>

        <View style={styles.communityStats}>
          <View style={styles.statItem}>
            <FontAwesome6
              name={isUserLeader ? "crown" : "user"}
              size={SIZES.large}
              color={themeColors.text}
            />
            <Text
              style={[styles.statText, { color: themeColors.textSecondary }]}
            >
              {isUserLeader ? "Leader" : "Member"}
            </Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <FontAwesome6 name="users" size={16} color={themeColors.text} />
            <Text
              style={[styles.statText, { color: themeColors.textSecondary }]}
            >
              {community?.members?.length}+ Member
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statItem, styles.statDivider]}
            onPressIn={shareCommunity}
          >
            <FontAwesome6 name="share" size={16} color={themeColors.text} />
            <Text
              style={[styles.statText, { color: themeColors.textSecondary }]}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: themeColors.background },
          ]}
        >
          <TouchableOpacity
            style={styles.sectionItem}
            onPressIn={() => {
              router.push({
                pathname: "CommunityImageScreen",
                params: { id, images: communityImages },
              });
            }}
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={themeColors.text}
              style={styles.icon}
            />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Media, links and docs
              </Text>
              <Text
                style={[
                  styles.sectionValue,
                  { color: themeColors.textSecondary },
                ]}
              >
                {communityImages.length}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={24}
              color={themeColors.text}
            />
          </TouchableOpacity>

          {isUserLeader && (
            <View style={styles.sectionItem}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={themeColors.text}
                style={styles.icon}
              />
              <View style={styles.sectionTextContainer}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.text }]}
                >
                  Lock chat
                </Text>
              </View>
              <Switch
                value={isMuted}
                onValueChange={() => setIsMuted((prev) => !prev)}
                trackColor={{ true: themeColors.tint, false: "#999" }}
              />
            </View>
          )}
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons
              name="lock-closed"
              size={24}
              color={themeColors.text}
              style={styles.icon}
            />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Encryption
              </Text>
              <Text
                style={[
                  styles.sectionValue,
                  { color: themeColors.textSecondary },
                ]}
              >
                Messages and calls are end-to-end encrypted.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
            Members
          </Text>
        </View>
      </>
    ),
    [community, isUserLeader, themeColors, communityImages, isMuted, shareCommunity]
  );

  const renderFooter = useCallback(
    () => (
      <>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
            Calendar
          </Text>
          {isUserLeader && (
            <TouchableOpacity
              onPressIn={() =>
                router.push({ pathname: "TimeTable", params: { id } })
              }
            >
              <Text style={[styles.viewAllText, { color: themeColors.tint }]}>
                Add
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {timetable.length === 0 ? (
          <Text
            style={{
              color: themeColors.textSecondary,
              marginLeft: rV(16),
              marginBottom: rV(10),
            }}
          >
            No events found.
          </Text>
        ) : (
          <View style={styles.calendarContainer}>
            {limitedTimetable.map((item) => {
              if (item.type === "view-all-cal") {
                return (
                  <TouchableOpacity
                    key="view-all-cal"
                    style={{
                      marginLeft: rS(16),
                      marginVertical: rV(8),
                    }}
                    onPress={() => setShowAllCalendar(true)}
                  >
                    <Text style={{ color: themeColors.tint }}>
                      View all events
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TimetableItem
                  key={item.id}
                  plan={{ ...item, logo: community?.image_url }}
                  onPress={() => handleTimetableItemPress(item)}
                />
              );
            })}
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name="earth"
              size={22}
              color={themeColors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>
              Public channel
            </Text>
          </View>
          <Text
            style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}
          >
            Anyone can find this channel and see what's been shared.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name="lock-closed"
              size={22}
              color={themeColors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>
              Profile privacy
            </Text>
          </View>
          <Text
            style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}
          >
            This channel has a reduced profile for your phone number. Tap to
            learn more.
          </Text>
        </View>

        <Text
          style={[styles.createdDate, { color: themeColors.textSecondary }]}
        >
          Created {community?.created_at?.substring(0, 10) || "N/A"}
        </Text>

        <TouchableOpacity
          style={styles.unfollowButton}
          onPress={confirmLeaveCommunity}
        >
          <Text style={styles.unfollowButtonText}>Unfollow channel</Text>
        </TouchableOpacity>

        {isUserLeader && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() =>
              Alert.alert("Report", "Report channel functionality.")
            }
          >
            <Text style={styles.reportButtonText}>Delete channel</Text>
          </TouchableOpacity>
        )}
      </>
    ),
    [
      community,
      isUserLeader,
      themeColors,
      timetable,
      handleTimetableItemPress,
      confirmLeaveCommunity,
    ]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        profileSection: { alignItems: "center", marginTop: rV(20) },
        channelImage: {
          width: rMS(80),
          height: rMS(80),
          borderRadius: rMS(40),
          marginBottom: rV(10),
        },
        channelName: {
          fontSize: SIZES.large,
          fontWeight: "bold",
          marginBottom: rV(4),
          color: themeColors.text,
        },
        followerCount: {
          fontSize: SIZES.medium,
          color: themeColors.textSecondary,
          textAlign: "center",
        },
        communityStats: {
          flexDirection: "row",
          marginTop: rV(20),
          justifyContent: "space-around",
          width: "100%",
        },
        statItem: { alignItems: "center", flex: 1 },
        statDivider: {
          borderLeftWidth: rS(2),
          borderLeftColor: themeColors.text,
        },
        statText: {
          fontSize: SIZES.small,
          marginTop: rV(5),
          color: themeColors.textSecondary,
        },
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
        sectionValue: {
          fontSize: SIZES.small,
          color: themeColors.textSecondary,
        },
        sectionHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: rS(16),
          marginTop: rV(30),
          marginBottom: rV(10),
        },
        sectionHeaderText: {
          fontSize: SIZES.medium,
          fontWeight: "bold",
          color: themeColors.text,
        },
        viewAllText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          color: themeColors.tint,
        },
        memberItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: rS(16),
          paddingVertical: rV(10),
          borderBottomWidth: rS(1),
          borderBottomColor: themeColors.secondaryBackground,
        },
        memberInfo: {
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        adminText: {
          color: themeColors.tint,
          fontSize: SIZES.small,
          fontWeight: "600",
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
        memberName: {
          fontSize: SIZES.medium,
          fontWeight: "500",
          color: themeColors.text,
        },
        calendarContainer: { paddingHorizontal: rS(16) },
        infoRow: { paddingHorizontal: rS(16), marginTop: rV(20) },
        infoLeft: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: rV(5),
        },
        infoTitle: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          color: themeColors.text,
        },
        infoSubtitle: {
          fontSize: SIZES.small,
          lineHeight: rV(20),
          color: themeColors.textSecondary,
        },
        createdDate: {
          marginTop: rV(20),
          paddingHorizontal: rS(16),
          fontSize: SIZES.small,
          color: themeColors.textSecondary,
        },
        unfollowButton: {
          backgroundColor: themeColors.secondaryBackground,
          marginTop: rV(20),
          marginHorizontal: rS(16),
          paddingVertical: rV(12),
          borderRadius: rMS(8),
          alignItems: "center",
        },
        unfollowButtonText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          color: themeColors.errorText,
        },
        reportButton: {
          backgroundColor: themeColors.errorText,
          marginTop: rV(10),
          marginBottom: rV(40),
          marginHorizontal: rS(16),
          paddingVertical: rV(12),
          borderRadius: rMS(8),
          alignItems: "center",
        },
        reportButtonText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          color: themeColors.background,
        },
        removeAction: {
          backgroundColor: themeColors.errorText,
          justifyContent: "center",
          alignItems: "center",
          width: rS(80),
          height: "100%",
        },
        removeActionText: {
          color: themeColors.background,
          fontSize: SIZES.medium,
          fontWeight: "600",
        },
      }),
    [themeColors]
  );

  const data = memberData;

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (error || !community) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text }}>
          {error || "Channel not found."}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        data={data}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <ImageView
          images={communityImages.map((uri) => ({ uri }))}
          imageIndex={currentImageIndex}
          visible={visible}
          onRequestClose={() => setIsVisible(false)}
        />
      </Modal>
    </GestureHandlerRootView>
  );
};

export default CommunityDetailScreen;