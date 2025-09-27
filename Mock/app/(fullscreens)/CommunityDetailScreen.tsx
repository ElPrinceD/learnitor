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
  Switch,
  FlatList,
  Modal,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import ImageView from "react-native-image-viewing";
import {
  getCommunityDetails,
  leaveCommunity,
  getCommunityMessages,
  getCommunityTimetable,
  removeCommunityMember,
  shareCommunity,
} from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../contexts/webSocketProvider"; // Updated to WebSocketContext
import { useCache } from "../../contexts/CacheContext"; // New import for caching
import { useCommunity } from "../../contexts/CommunityContext";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import { rMS, rS, rV, SIZES } from "../../constants";
import { router } from "expo-router";
import TimetableItem from "../../components/TimetableItem";
import AppImage from "../../components/AppImage";
import { useAlert } from "../../contexts/AlertContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";

type RouteParams = { id: string };

const CommunityDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const navigation = useNavigation();
  const { userToken, userInfo } = useAuth();
  const { showSuccessAlert, showErrorAlert, showDeleteAlert, showAlert } =
    useAlert();
  const { handleError } = useErrorHandler();
  const user = userInfo?.user;
  const { unsubscribeFromCommunity, removeMemberFromCommunity } =
    useCommunity();
  const { socket } = useWebSocket() || {
    socket: null,
    unsubscribeFromCommunity: () => {},
  };
  const { getItem, setItem, removeItem } = useCache();

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
  const [profileImages, setProfileImages] = useState<Record<string, string>>(
    {}
  );
  const [showAllCalendar, setShowAllCalendar] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const sortedMembers = useMemo(() => {
    if (!community?.members) return [];

    // Sort members alphabetically first
    const sorted = [...community.members].sort((a, b) =>
      a.first_name.localeCompare(b.first_name)
    );

    // Find current user and move them to the front
    const currentUserIndex = sorted.findIndex(
      (member) => member.email === user?.email
    );
    if (currentUserIndex > -1) {
      const currentUser = sorted.splice(currentUserIndex, 1)[0];
      return [currentUser, ...sorted];
    }

    return sorted;
  }, [community?.members, user?.email]);

  const memberData = useMemo(() => {
    const members = sortedMembers || [];
    let displayed = members.slice(0, 5);
    if (members.length > 5) {
      displayed = [...displayed, { id: "view-all", type: "view-all" } as any];
    }
    return displayed;
  }, [sortedMembers]);

  const limitedTimetable = useMemo(() => {
    console.log(
      "Computing limitedTimetable - showAllCalendar:",
      showAllCalendar,
      "timetable.length:",
      timetable.length
    );

    if (showAllCalendar) {
      // When showing all, return all timetable items without the "view-all" button
      console.log("Showing all timetables:", timetable);
      return timetable;
    } else {
      // When showing limited, return first 5 items plus "view-all" button if there are more than 5
      let items = timetable.slice(0, 5);
      if (timetable.length > 5) {
        items = [...items, { id: "view-all-cal", type: "view-all-cal" }];
      }
      console.log("Showing limited timetables:", items);
      return items;
    }
  }, [timetable, showAllCalendar, renderKey]);

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

  const removeCachedData = useCallback(
    async (key: string) => {
      await removeItem(key);
    },
    [removeItem]
  );

  // Background refresh function for timetable data
  const refreshTimetableInBackground = useCallback(async () => {
    if (!userToken?.token) return;

    try {
      console.log("Background refresh: Fetching fresh timetable data...");
      const freshData = await getCommunityTimetable(id, userToken.token);
      console.log("Background refresh - Fresh data:", freshData);

      const processedData = Array.isArray(freshData) ? freshData : [];
      setTimetable(processedData);

      // Update cache with fresh data
      await setCachedData(`timetable_${id}`, processedData);
    } catch (err) {
      console.error("Background refresh error:", err);
    }
  }, [id, userToken?.token, setCachedData]);

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      const cachedCommunity = await getCachedData(`community_${id}`);
      const cachedTimetable = await getCachedData(`timetable_${id}`);
      const cachedImages = await getCachedData(`images_${id}`);

      if (cachedCommunity && cachedImages && cachedTimetable) {
        console.log(
          "Using cached data - Community timetable:",
          cachedTimetable
        );
        console.log("Cached timetable type:", typeof cachedTimetable);
        console.log(
          "Cached timetable length:",
          Array.isArray(cachedTimetable)
            ? cachedTimetable.length
            : "Not an array"
        );

        setCommunity(cachedCommunity);
        setIsUserLeader(cachedCommunity?.created_by === user?.email);
        setTimetable(Array.isArray(cachedTimetable) ? cachedTimetable : []);
        setCommunityImages(Array.isArray(cachedImages) ? cachedImages : []);
        setLoading(false);

        // If cached timetable is empty, try to fetch fresh data
        if (Array.isArray(cachedTimetable) && cachedTimetable.length === 0) {
          console.log("Cached timetable is empty, fetching fresh data...");
          try {
            const freshTimetableData = await getCommunityTimetable(
              id,
              userToken?.token!
            );
            console.log("Fresh timetable data:", freshTimetableData);
            setTimetable(
              Array.isArray(freshTimetableData) ? freshTimetableData : []
            );
            await setCachedData(
              `timetable_${id}`,
              Array.isArray(freshTimetableData) ? freshTimetableData : []
            );
          } catch (err) {
            console.error("Error fetching fresh timetable data:", err);
          }
        }
        return;
      }

      if (!userToken?.token) throw new Error("User not authenticated.");

      const data = await getCommunityDetails(id, userToken.token);
      setCommunity(data);
      await setCachedData(`community_${id}`, data);
      setIsUserLeader(data?.created_by === user?.email);

      const messages = await getCommunityMessages(id, userToken.token);
      const images =
        messages.filter((msg) => msg.image).map((msg) => msg.image) || [];
      setCommunityImages(images);
      await setCachedData(`images_${id}`, images);

      const timetableData =
        (await getCommunityTimetable(id, userToken.token)) || [];
      console.log("Community timetable data:", timetableData);
      console.log("Timetable data type:", typeof timetableData);
      console.log(
        "Timetable data length:",
        Array.isArray(timetableData) ? timetableData.length : "Not an array"
      );

      // Ensure we have an array and handle the data structure properly
      const processedTimetable = Array.isArray(timetableData)
        ? timetableData
        : [];
      setTimetable(processedTimetable);
      await setCachedData(`timetable_${id}`, processedTimetable);

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
        // Trigger background refresh of timetable data
        refreshTimetableInBackground();
      }
    }, [id, fetchCommunityData, refreshTimetableInBackground])
  );

  // Set navigation options to show edit button only for leaders
  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isUserLeader ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "EditCommunityScreen",
                params: { id },
              })
            }
            style={{ marginRight: 16 }}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={themeColors.text}
            />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isUserLeader, id, themeColors.text]);

  useEffect(() => {
    let socketCleanup = () => {};

    if (socket) {
      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.type === "community_updated" &&
            data.community?.id.toString() === id
          ) {
            setCommunity((prev) => ({
              ...prev,
              ...data.community,
              members: data.community.members || prev?.members || [],
            }));
            setCachedData(`community_${id}`, {
              ...community,
              ...data.community,
              members: data.community.members || community?.members || [],
            });
          } else if (
            data.type === "member_removed" &&
            data.community_id.toString() === id
          ) {
            setCommunity((prev) => {
              if (!prev) return prev;
              const updatedMembers =
                prev.members?.filter((member) => member.id !== data.user_id) ||
                [];
              const updatedCommunity = { ...prev, members: updatedMembers };
              setCachedData(`community_${id}`, updatedCommunity);
              return updatedCommunity;
            });
          } else if (
            data.type === "timetable_created" &&
            data.community_id.toString() === id
          ) {
            // Clear cached timetable data and refetch
            removeCachedData(`timetable_${id}`);
            fetchCommunityData();
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
  }, [socket, id, setCachedData, community]);

  const handleRemoveMember = useCallback(
    async (userId: number) => {
      try {
        if (!userToken?.token) throw new Error("User not authenticated.");

        // Call API to remove member
        await removeMemberFromCommunity(id, userId.toString());

        // Immediately update local state
        setCommunity((prev) => {
          if (!prev) return prev;
          const updatedMembers = prev.members?.filter(
            (member) => member.id !== userId
          );
          const updatedCommunity = { ...prev, members: updatedMembers };

          return updatedCommunity;
        });

        showSuccessAlert("Success", "Member removed from the channel.");
      } catch (err) {
        handleError(err, "Remove Failed");
      }
    },
    [id, userToken?.token, setCachedData]
  );

  const renderRightActions = useCallback(
    (userId: number) => (
      <TouchableOpacity
        style={[
          styles.removeAction,
          { backgroundColor: themeColors.errorText },
        ]}
        onPress={() => {
          showDeleteAlert(
            "Remove member?",
            "Are you sure you want to remove this member from the channel?",
            () => handleRemoveMember(userId)
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
            style={[
              styles.viewAllMembersButton,
              {
                backgroundColor: themeColors.tint + "10",
                borderColor: themeColors.tint + "30",
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "AllMembersScreen",
                params: {
                  communityId: id,
                  communityName: community?.name,
                },
              })
            }
          >
            <Ionicons name="people" size={20} color={themeColors.tint} />
            <Text
              style={[
                styles.viewAllMembersButtonText,
                { color: themeColors.tint },
              ]}
            >
              View All {sortedMembers.length} Members
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={themeColors.tint}
            />
          </TouchableOpacity>
        );
      }
      const isLeader = item.email === community?.created_by;
      const isCurrentUser = item.email === user?.email;
      const memberItem = (
        <View style={styles.memberItem}>
          {renderAvatar(item)}
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: themeColors.text }]}>
              {isCurrentUser ? "You" : `${item.first_name} ${item.last_name}`}
            </Text>
            {isLeader && <Text style={styles.adminText}>Admin</Text>}
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
        params: { timetableId: item.id, isUserLeader: isUserLeader.toString() },
      });
    },
    [isUserLeader]
  );

  const handleShareCommunity = useCallback(async () => {
    try {
      if (!userToken?.token) throw new Error("User not authenticated.");
      const response = await shareCommunity(id, userToken.token);
      const shareableLink = response.shareable_link;
      if (!shareableLink) throw new Error("Failed to generate shareable link.");

      await Share.share({
        message: `Join the channel "${community?.name}"! Use this link to join`,
        url: shareableLink,
      });
    } catch (err) {
      handleError(err, "Share Failed");
    }
  }, [id, community?.name, userToken?.token]);

  const leaveCommunityHandler = useCallback(async () => {
    try {
      if (!userToken?.token) throw new Error("User not authenticated.");

      unsubscribeFromCommunity(id, false);
      setIsFollowing(false);
      showSuccessAlert("Success", "You have left the channel.");

      router.replace({
        pathname: "/CommunityScreen",
        params: { leftCommunityId: id },
      });
    } catch (err) {
      handleError(err, "Leave Failed");
    }
  }, [
    id,
    userToken?.token,
    unsubscribeFromCommunity,
    getCachedData,
    setCachedData,
    removeCachedData,
    getItem,
    setItem,
  ]);

  const confirmLeaveCommunity = useCallback(() => {
    showDeleteAlert(
      "Leave channel?",
      "Are you sure you want to leave (unfollow) this channel?",
      leaveCommunityHandler
    );
  }, [leaveCommunityHandler, showDeleteAlert]);

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: community?.image_url }}
            style={styles.channelImage}
          />
          <View style={styles.channelHeader}>
            <Text style={[styles.channelName, { color: themeColors.text }]}>
              {community?.name}
            </Text>
            <View style={styles.publicBadge}>
              <Ionicons
                name="globe-outline"
                size={16}
                color={themeColors.background}
              />
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
            {isUserLeader && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "EditCommunityScreen",
                    params: { id },
                  })
                }
                style={styles.editButton}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
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
              color={isUserLeader ? themeColors.tint : themeColors.text}
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
              {community?.members?.length} Members
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statItem, styles.statDivider]}
            onPressIn={handleShareCommunity}
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
            onPress={() => {
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

          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons
              name="search-outline"
              size={24}
              color={themeColors.text}
              style={styles.icon}
            />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Channel Visibility
              </Text>
              <Text
                style={[
                  styles.sectionValue,
                  { color: themeColors.textSecondary },
                ]}
              >
                Public - Anyone can find and join
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                showAlert({
                  title: "Channel Privacy",
                  message:
                    "This channel is public and can be found by anyone searching for it. Users can join directly without an invitation.",
                  type: "default",
                })
              }
              style={styles.helpButton}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={themeColors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>
              Channel Privacy
            </Text>
          </View>
          <Text
            style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}
          >
            This channel is public and can be found by anyone searching for it.
            Users can join directly without an invitation.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
            Members
          </Text>
        </View>
      </>
    ),
    [
      community,
      isUserLeader,
      themeColors,
      communityImages,
      handleShareCommunity,
    ]
  );

  const renderFooter = useCallback(
    () => (
      <>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[styles.sectionHeaderText, { color: themeColors.text }]}
            >
              Calendar ({timetable.length} events)
            </Text>
            {isUserLeader && (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: "TimeTable", params: { id } })
                }
                style={styles.addEventButton}
              >
                <Ionicons name="add" size={18} color={themeColors.tint} />
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {timetable.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={themeColors.textSecondary}
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: themeColors.textSecondary },
              ]}
            >
              No events scheduled yet
            </Text>
            {isUserLeader && (
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: themeColors.textSecondary },
                ]}
              >
                Tap "Add Event" to create the first event
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {/* Show only first 5 events */}
            <View style={styles.eventsGrid}>
              {timetable.slice(0, 5).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.eventCard,
                    {
                      backgroundColor: themeColors.secondaryBackground,
                      borderColor: themeColors.tint + "20",
                    },
                  ]}
                  onPress={() => handleTimetableItemPress(item)}
                >
                  <View style={styles.eventHeader}>
                    <View
                      style={[
                        styles.eventIcon,
                        { backgroundColor: themeColors.tint + "20" },
                      ]}
                    >
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={themeColors.tint}
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text
                        style={[styles.eventTitle, { color: themeColors.text }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.eventDescription,
                          { color: themeColors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventFooter}>
                    <View style={styles.eventStats}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={themeColors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.eventStatText,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {item.periods?.length || 0} periods
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={themeColors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* View All Events Button */}
            {timetable.length > 5 && (
              <TouchableOpacity
                style={[
                  styles.viewAllButton,
                  {
                    backgroundColor: themeColors.tint + "10",
                    borderColor: themeColors.tint + "30",
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "AllEventsScreen",
                    params: {
                      communityId: id,
                      communityName: community?.name,
                    },
                  })
                }
              >
                <Ionicons name="list" size={20} color={themeColors.tint} />
                <Text
                  style={[
                    styles.viewAllButtonText,
                    { color: themeColors.tint },
                  ]}
                >
                  View All {timetable.length} Events
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={themeColors.tint}
                />
              </TouchableOpacity>
            )}
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
              showDeleteAlert(
                "Delete Channel",
                "Are you sure you want to delete this channel? This action cannot be undone.",
                () => {
                  // Add delete channel functionality here
                  console.log("Delete channel functionality");
                }
              )
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
          paddingHorizontal: rS(16),
          marginTop: rV(30),
          marginBottom: rV(10),
        },
        sectionHeaderRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
        channelHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: rV(4),
        },
        publicBadge: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: themeColors.tint,
          paddingHorizontal: rS(8),
          paddingVertical: rV(4),
          borderRadius: rMS(12),
          marginLeft: rS(8),
        },
        publicBadgeText: {
          color: themeColors.background,
          fontSize: SIZES.xSmall,
          fontWeight: "600",
          marginLeft: rS(4),
        },
        helpButton: {
          padding: rS(4),
          marginLeft: rS(8),
        },
        editButton: {
          padding: rS(4),
          marginLeft: rS(8),
        },
        leaderNote: {
          fontSize: SIZES.xSmall,
          fontWeight: "600",
          marginTop: rV(2),
        },
        youText: {
          color: themeColors.tint,
          fontSize: SIZES.xSmall,
          fontWeight: "600",
          marginLeft: rS(8),
        },
        // New Calendar UI Styles
        emptyStateContainer: {
          alignItems: "center",
          paddingVertical: rV(40),
          paddingHorizontal: rS(20),
        },
        emptyStateText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          marginTop: rV(12),
          textAlign: "center",
        },
        emptyStateSubtext: {
          fontSize: SIZES.small,
          marginTop: rV(8),
          textAlign: "center",
          lineHeight: 20,
        },
        eventsContainer: {
          paddingHorizontal: rS(16),
        },
        eventsGrid: {
          gap: rV(12),
        },
        eventCard: {
          borderRadius: rMS(12),
          padding: rV(16),
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        eventHeader: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: rV(12),
        },
        eventIcon: {
          width: rMS(40),
          height: rMS(40),
          borderRadius: rMS(20),
          alignItems: "center",
          justifyContent: "center",
          marginRight: rS(12),
        },
        eventInfo: {
          flex: 1,
        },
        eventTitle: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          marginBottom: rV(4),
        },
        eventDescription: {
          fontSize: SIZES.small,
          lineHeight: 18,
        },
        eventFooter: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        eventStats: {
          flexDirection: "row",
          alignItems: "center",
        },
        eventStatText: {
          fontSize: SIZES.xSmall,
          marginLeft: rS(4),
          fontWeight: "500",
        },
        viewAllButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: rV(16),
          paddingHorizontal: rS(20),
          borderRadius: rMS(12),
          borderWidth: 1,
          marginTop: rV(12),
        },
        viewAllButtonText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          marginHorizontal: rS(8),
        },
        viewAllMembersButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: rV(16),
          paddingHorizontal: rS(20),
          borderRadius: rMS(12),
          borderWidth: 1,
          marginHorizontal: rS(16),
          marginVertical: rV(12),
        },
        viewAllMembersButtonText: {
          fontSize: SIZES.medium,
          fontWeight: "600",
          marginHorizontal: rS(8),
        },
        addEventButton: {
          backgroundColor: "transparent",
          borderRadius: rMS(6),
          paddingHorizontal: rS(8),
          paddingVertical: rV(4),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: themeColors.tint,
        },
        addEventButtonText: {
          color: themeColors.tint,
          fontSize: rMS(12),
          fontWeight: "500",
          marginLeft: rS(4),
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
