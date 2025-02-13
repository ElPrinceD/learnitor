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
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  getCommunityDetails,
  leaveCommunity,
  getCommunityMessages,
  getCommunityTimetable
} from "../../CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import Colors from "../../constants/Colors";
import { Community } from "../../components/types";
import TimetableItem from '../../components/TimetableItem'; // Import the new component
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useWebSocket } from "../../webSocketProvider";
import { rMS, rV } from "../../constants";
import PlanItem from "../../components/PlanItem"; // Assuming this component exists in the given path
import { SIZES, useShadows, rS } from "../../constants";

type RouteParams = {
  id: string;
};

const CommunityDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const navigation = useNavigation();
  const { userToken, userInfo } = useAuth();
  const user = userInfo?.user;
  const { unsubscribeFromCommunity } = useWebSocket() || { unsubscribeFromCommunity: () => {} };
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Photo" | "Calendar" | "Member">("Calendar");
  const colorScheme = useColorScheme();
  const [communityImages, setCommunityImages] = useState<string[]>([]);
  const themeColors = Colors[colorScheme ?? "light"];
  const [isUserLeader, setIsUserLeader] = useState(false);
  const [timetable, setTimetable] = useState([]);

  // State for managing the current day
  const [currentDay, setCurrentDay] = useState(new Date());
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number; height: number } }>({});

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const cachedCommunity = await AsyncStorage.getItem(`community_${id}`);
        if (cachedCommunity) {
          setCommunity(JSON.parse(cachedCommunity));
          setLoading(false);
          return;
        }

        if (userToken?.token) {
          const data = await getCommunityDetails(id, userToken?.token);
          setCommunity(data);
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

    const fetchCommunityImages = async () => {
      try {
        if (userToken?.token) {
          const messages = await getCommunityMessages(id, userToken.token);
          const images = messages.filter(msg => msg.image).map(msg => msg.image);
          setCommunityImages(images);
          
          // Fetch dimensions for each image
          images.forEach((imageUrl) => {
            Image.getSize(imageUrl, (width, height) => {
              setImageDimensions(prevDimensions => ({
                ...prevDimensions,
                [imageUrl]: { width, height }
              }));
            }, (error) => {
              console.error("Failed to get image dimensions for", imageUrl, error);
            });
          });
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
          console.log(timetableData)
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


  

   

    // Function to check if the user is the creator of the community
    const checkUserRole = (communityData: Community) => {
      if (communityData.created_by === user?.email) {
        setIsUserLeader(true);
      } else {
        setIsUserLeader(false);
      }
    };
  

    const handleTimetableItemPress = (plan) => {
      // Handle the press event for the timetable item
      console.log('Timetable item pressed:', plan);
    };




  const getCategoryColor = (type) => {
    switch(type) {
      case 1:
        return "#FF5722"; // Example color for category 1
      case 2:
        return "#03A9F4"; // Example color for category 2
      default:
        return "#000";
    }
  };

 
  
  const shareCommunity = async () => {
    try {
      const result = await Share.share({
        message: `Check out this community: ${community?.name}\nJoin here: ${community?.shareable_link}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
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
        await leaveCommunity(id, userToken?.token);
        Alert.alert("Success", "You have left the community.");
        
        if (unsubscribeFromCommunity) {
          unsubscribeFromCommunity(id);
        }

        router.navigate("/");

        await AsyncStorage.removeItem(`community_${id}`);
        await removeCommunityFromCache(id);
      } else {
        Alert.alert("Error", "User not authenticated.");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      Alert.alert("Error", "Failed to leave the community.");
    }
  };

  const removeCommunityFromCache = async (communityId: string) => {
    try {
      const cachedCommunities = await AsyncStorage.getItem('communities');
      if (cachedCommunities) {
        const communities = JSON.parse(cachedCommunities);
        const updatedCommunities = communities.filter((c: Community) => c.id !== communityId);
        await AsyncStorage.setItem('communities', JSON.stringify(updatedCommunities));
      }
    } catch (error) {
      console.error("Error removing community from cache:", error);
    }
  };

  // Function to get the day of the week
  const getDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Function to move to the previous day
  const previousDay = () => {
    const newDate = new Date(currentDay);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDay(newDate);
  };

  // Function to move to the next day
  const nextDay = () => {
    const newDate = new Date(currentDay);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDay(newDate);
  };

  // Helper function to get date for display
  const getDisplayDate = (date: Date) => {
    return date.getDate().toString().padStart(2, '0');
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
        <Text style={{ color: themeColors.text }}>Community not found.</Text>
      </View>
    );
  }

  const sortedMembers = community.members?.sort((a, b) =>
    a.first_name.localeCompare(b.first_name)
  );

  // Simulating events for demonstration
  const events = [
    {
      day: 'Monday',
      date: 7,
      startTime: '4:00 PM',
      endTime: '6:00 PM',
      lecturer: 'Dr. Jane Doe',
      subject: 'Quantum Physics',
      location: 'Lecture Hall A',
    },
    {
      day: 'Thursday',
      date: 10,
      startTime: '4:15 PM',
      endTime: '5:45 PM',
      lecturer: 'Prof. John Smith',
      subject: 'Advanced Calculus',
      location: 'Room 201',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Community Info */}
      <View style={styles.communityInfo}>
        <Image source={{ uri: community.image_url }} style={styles.profilePicture} />
        <Text style={[styles.communityName, { color: themeColors.text }]}>{community.name}</Text>
        
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
      </View>

      {/* Tabs */}
      <View style={styles.bottom}>
        <View style={styles.tabsContainer}>
          {['Photo', 'Calendar', 'Member'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: themeColors.tint },
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && { color: '#fff' }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on Active Tab */}
          {/* Content based on Active Tab */}
          <ScrollView style={styles.contentContainer}>
          {activeTab === "Photo" && (
          <FlatList
            data={communityImages}
            numColumns={2} // Two images per row
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              const dimensions = imageDimensions[item] || { width: 100, height: 100 }; // default dimensions if not yet fetched
              const aspectRatio = dimensions.width / dimensions.height;

              return (
                <Image 
                  source={{ uri: item }}
                  style={{
                    width: '50%', // Takes half the width of the container
                    aspectRatio: aspectRatio, // Maintains the image's aspect ratio
                    resizeMode: 'contain', // Ensure the image fits within these dimensions without cropping
                  }}
                />
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: themeColors.text, textAlign: 'center' }}>No photos available.</Text>
            }
          />
        )}
          
          {activeTab === "Calendar" && (
        <View style={styles.calendarContainer}>
          <View style={styles.planItemsContainer}>
            {timetable.map((plan) => (
              <TimetableItem key={plan.id} plan={plan} onPress={handleTimetableItemPress} />
            ))}
          </View>
        </View>
      )}

          
          {activeTab === "Member" && (
            <View style={styles.membersContainer}>
              <FlatList
                data={sortedMembers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.memberItem}>
                    <Image source={{ uri: item.profile_picture }} style={styles.memberPicture} />
                    <Text style={[styles.memberName, { color: themeColors.text }]}>{item.first_name} {item.last_name}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={[styles.noMembersText, { color: themeColors.textSecondary }]}>
                    No members found.
                  </Text>
                }
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: rV(20),
  
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarMonth2: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  statDivider: {
    borderLeftWidth: 2, // Add a left border to create the line
    borderLeftColor: 'white', // Set the color to white
  },
  bottom: {
    backgroundColor: "white", 
    height: "100%", 
    width: "100%",
    borderTopLeftRadius: rMS(30),
    borderTopRightRadius: rMS(30)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  communityInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  communityName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  communityHandleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  communityHandle: {
    fontSize: 16,
    color: '#666',
  },
  copyIcon: {
    marginLeft: 5,
  },
  communityStats: {
    flexDirection: 'row',
    marginTop: rMS(20),
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1, 
  },
  statText: {
    fontSize: 14,
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  calendarContainer: {
    padding: 10,
  },
  event: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row', // Keep row for overall layout
    justifyContent: 'space-between', // This will push details to the right
  },
  eventHeader: {
    flexDirection: 'column', // Change to column to stack times vertically
    alignItems: 'flex-start', // Align items to the start (left)
  },
  eventDay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2, // Add some space between start time, dash, and end time
  },
  eventDetailsContainer: {
    // No need for marginLeft here since we're aligning to the right
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventDetailText: {
    marginLeft: 10,
    fontSize: 14,
  },
  bersContainer: {
    padding: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    textAlign: 'center',
    fontSize: 16,
  },
  leaveButton: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginTop: 20,
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planItemsContainer: {
    marginTop: rV(18),
  },
  planItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: rV(8),
    paddingHorizontal: rS(10),
  },
});

export default CommunityDetailScreen;