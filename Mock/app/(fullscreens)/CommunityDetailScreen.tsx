import React, { useState, useEffect } from "react";
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
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import ImageView from 'react-native-image-viewing';

import { getCommunityDetails, leaveCommunity, getCommunityMessages, getCommunityTimetable } from "../../CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useWebSocket } from "../../webSocketProvider";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import { rMS, rS, rV, SIZES } from "../../constants";
import { router } from "expo-router";
import TimetableItem from "../../components/TimetableItem";

type RouteParams = {
  id: string;
};

const CommunityDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const navigation = useNavigation();
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { unsubscribeFromCommunity } = useWebSocket() || {
    unsubscribeFromCommunity: () => {},
  };

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mute toggle
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Following (joined) or not
  const [isFollowing, setIsFollowing] = useState<boolean>(true);

  // Community images
  const [communityImages, setCommunityImages] = useState<string[]>([]);

  // Community timetable (calendar)
  const [timetable, setTimetable] = useState<any[]>([]);

  // Check if user is the creator or leader
  const [isUserLeader, setIsUserLeader] = useState(false);

  // State for image viewer
  const [visible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const cachedCommunity = await AsyncStorage.getItem(`community_${id}`);
        if (cachedCommunity) {
          setCommunity(JSON.parse(cachedCommunity));
        }

        if (userToken?.token) {
          const data = await getCommunityDetails(id, userToken.token);
          setCommunity(data);
          await AsyncStorage.setItem(`community_${id}`, JSON.stringify(data));

          // Check if user is the leader
          if (data?.created_by === user?.email) {
            setIsUserLeader(true);
          }
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

    const fetchCommunityImages = async () => {
      try {
        if (userToken?.token) {
          const messages = await getCommunityMessages(id, userToken.token);
          const images = messages.filter(msg => msg.image).map(msg => msg.image);
          setCommunityImages(images);
        }
      } catch (error) {
        console.error("Failed to fetch community images:", error);
      }
    };

    const fetchCommunityTimetable = async () => {
      try {
        if (userToken?.token) {
          const timetableData = await getCommunityTimetable(id, userToken.token);
          setTimetable(timetableData);
        }
      } catch (error) {
        console.error("Failed to fetch community timetable:", error);
      }
    };

    if (id) {
      fetchCommunity();
      fetchCommunityImages();
      fetchCommunityTimetable();
    }
  }, [id, userToken?.token]);

  const handleTimetableItemPress = (item) => {
    router.push({
      pathname: "TimeTableDetails",
      params: { timetableId: item.id },
    });
  };

  const shareCommunity = async () => {
    try {
      await Share.share({
        message: `Check out this channel: ${community?.name}\nJoin here: ${community?.shareable_link}`,
      });
    } catch (error) {
      console.error("Error sharing community:", error);
    }
  };

  const confirmLeaveCommunity = () => {
    Alert.alert(
      "Leave Channel",
      "Are you sure you want to leave (unfollow) this channel?",
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
        await leaveCommunity(id, userToken?.token);
        Alert.alert("Success", "You have left the channel.");
        setIsFollowing(false);

        if (unsubscribeFromCommunity) {
          unsubscribeFromCommunity(id);
        }

        // Navigate away if needed
        router.replace("/");

        // Remove from AsyncStorage
        await AsyncStorage.removeItem(`community_${id}`);
        await removeCommunityFromCache(id);
      } else {
        Alert.alert("Error", "User not authenticated.");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      Alert.alert("Error", "Failed to leave the channel.");
    }
  };

  const removeCommunityFromCache = async (communityId: string) => {
    try {
      const cachedCommunities = await AsyncStorage.getItem("communities");
      if (cachedCommunities) {
        const communities = JSON.parse(cachedCommunities);
        const updatedCommunities = communities.filter(
          (c: Community) => c.id !== communityId
        );
        await AsyncStorage.setItem(
          "communities",
          JSON.stringify(updatedCommunities)
        );
      }
    } catch (error) {
      console.error("Error removing community from cache:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>{error}</Text>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>Channel not found.</Text>
      </View>
    );
  }

  const sortedMembers = community.members?.sort((a, b) =>
    a.first_name.localeCompare(b.first_name)
  ) || [];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Channel Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: community.image_url }}
            style={styles.channelImage}
          />
          <Text style={[styles.channelName, { color: themeColors.text }]}>
            {community.name}
          </Text>
          <Text style={[styles.followerCount, { color: themeColors.textSecondary }]}>
            {community.description
            ? community.description
            : `The official channel of ${community.name}.`}
          </Text>
          {isUserLeader && (
            <Text style={[styles.leaderBadge, { color: themeColors.tint }]}>
              You are the Leader
            </Text>
          )}
        </View>

        {/* Community Stats */}
        <View style={styles.communityStats}>
          <View style={styles.statItem}>
            <FontAwesome6 name={isUserLeader ? "crown" : "user"} size={SIZES.large} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.textSecondary }]}>{isUserLeader ? "Leader" : "Member"}</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <FontAwesome6 name="users" size={16} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.textSecondary }]}>{community.members?.length}+ Member</Text>
          </View>
          <TouchableOpacity style={[styles.statItem, styles.statDivider]} onPress={shareCommunity}>
            <FontAwesome6 name="share" size={16} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.textSecondary }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Sections from the Image */}
        <View style={[styles.sectionContainer, {backgroundColor: themeColors.background}]}>
          <TouchableOpacity style={styles.sectionItem} onPress={() => {
            router.push({
              pathname: "CommunityImageScreen",
              params: { id, images: communityImages },
            });
          }}>
            <Ionicons name="image-outline" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Media, links and docs</Text>
              <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>{communityImages.length}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
         
         
          
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="download-outline" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Save to Photos</Text>
              <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>Default</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="timer-outline" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Disappearing messages</Text>
              <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>Off</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={styles.sectionItem}>
            <Ionicons name="lock-closed-outline" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Lock chat</Text>
            </View>
            <Switch
              value={isMuted}
              onValueChange={() => setIsMuted(!isMuted)}
              trackColor={{ true: themeColors.tint, false: "#999" }}
            />
          </View>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="lock-closed" size={24} color={themeColors.text} style={styles.icon} />
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Encryption</Text>
              <Text style={[styles.sectionValue, { color: themeColors.textSecondary }]}>Messages and calls are end-to-end encrypted.</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>Members</Text>
       
        </View>
        {sortedMembers.length === 0 ? (<Text
            style={{
              color: themeColors.textSecondary,
              marginLeft: rV(16),
              marginBottom: rV(10),
            }}
          >
            No members yet.
          </Text>
        ) : (
          <FlatList
            data={sortedMembers.slice(0, 5)}
            keyExtractor={(item) => item.id.toString()}
            style={{ marginBottom: 15,paddingHorizontal: rS(16), }}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <Image
                  source={{ uri: item.profile_picture }}
                  style={styles.memberPicture}
                />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: themeColors.text }]}>
                    {item.first_name} {item.last_name}
                  </Text>
                 
                </View>
              </View>
            )}
          />
        )}

        {/* Calendar (Timetable) Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
            Calendar
          </Text>
       
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "TimeTable",
                  params: { id },
                });
              }}
            >
              <Text style={[styles.viewAllText, { color: themeColors.tint }]}>
                Add
              </Text>
            </TouchableOpacity>
          
        </View>
        {timetable?.length === 0 ? (
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
            <FlatList
              data={timetable.slice(0, 3)} // Show only first 3 events
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TimetableItem plan={{ ...item, logo: community.image_url }} onPress={() => handleTimetableItemPress(item)} />
              )}
            />
          </View>
        )}

        {/* Channel Privacy Info */}
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
            This channel has a reduced profile for your phone number. Tap to learn more.
          </Text>
        </View>

        {/* Created Date */}
        <Text style={[styles.createdDate, { color: themeColors.textSecondary }]}>
          Created {community.created_at?.substring(0, 10) || "N/A"}
        </Text>

        {/* Unfollow / Report */}
        <TouchableOpacity
          style={styles.unfollowButton}
          onPress={confirmLeaveCommunity}
        >
          <Text style={styles.unfollowButtonText}>Unfollow channel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => Alert.alert("Report", "Report channel functionality.")}
        >
          <Text style={styles.reportButtonText}>Report channel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Image Viewer Modal */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* Header */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rS(16),
    paddingVertical: rV(10),
  },
  backButton: {
    marginRight: rS(10),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },

  /* Profile Section */
  profileSection: {
    alignItems: "center",
    marginTop: rV(20),
  },
  channelImage: {
    width: rMS(80),
    height: rMS(80),
    borderRadius: rMS(40),
    marginBottom: rV(10),
  },
  channelName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: rV(4),
  },
  followerCount: {
    fontSize: 14,
    color: "#888",
  },
  leaderBadge: {
    marginTop: rV(4),
    fontSize: 13,
    fontWeight: "600",
  },

  communityStats: {
    flexDirection: "row",
    marginTop: rV(20),
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: rS(2),
    borderLeftColor: "white",
  },
  statText: {
    fontSize: 14,
    marginTop: rV(5),
  },

  /* Description */
  descriptionContainer: {
    marginTop: rV(20),
    paddingHorizontal: rS(16),
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* Toggle (Muted) */
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rS(16),
    marginTop: rV(30),
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rS(16),
    marginTop: rV(30),
    marginBottom: rV(10),
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  /* Images */
  communityImageThumbnail: {
    width: rS(100),
    height: rV(100),
    borderRadius: rMS(10),
    marginLeft: rS(3),
  },

  /* Calendar / Timetable */
  calendarContainer: {
    paddingHorizontal: rS(16),
  },
  eventContainer: {
    backgroundColor: "#f0f0f0",
    padding: rMS(10),
    borderRadius: rMS(8),
    marginBottom: rV(10),
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 12,
    color: "#555",
  },
  eventLocation: {
    fontSize: 12,
    color: "#999",
  },

  /* Members */
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rS(16),
    paddingVertical: rV(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  memberPicture: {
    width: rMS(40),
    height: rMS(40),
    borderRadius: rMS(20),
    marginRight: rS(10),
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
  },
  memberStatus: {
    fontSize: 12,
    color: "#888",
  },
  memberAdmin: {
    fontSize: 12,
    color: "blue",
  },
  memberPhone: {
    fontSize: 12,
    color: "#888",
  },

  /* Info Rows (Public channel, Profile privacy) */
  infoRow: {
    paddingHorizontal: rS(16),
    marginTop: rV(20),
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rV(5),
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* Created Date */
  createdDate: {
    marginTop: rV(20),
    paddingHorizontal: rS(16),
    fontSize: 13,
  },

  /* Unfollow / Report */
  unfollowButton: {
    backgroundColor: "#f0f0f0",
    marginTop: rV(20),
    marginHorizontal: rS(16),
    paddingVertical: rV(12),
    borderRadius: rMS(8),
    alignItems: "center",
  },
  unfollowButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c00",
  },
  reportButton: {
    backgroundColor: "#f0f0f0",
    marginTop: rV(10),
    marginBottom: rV(40),
    marginHorizontal: rS(16),
    paddingVertical: rV(12),
    borderRadius: rMS(8),
    alignItems: "center",
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c00",
  },

  // New Styles for Sections
  sectionContainer: {
    paddingHorizontal: rS(16),
    marginTop: rV(20),
    
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rV(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  icon: {
    marginRight: rS(10),
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
  },
  sectionValue: {
    fontSize: 14,
    color: '#888',
  },
});
export default CommunityDetailScreen;

