import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, Text, useColorScheme, TouchableOpacity, ActivityIndicator } from "react-native";
import moment from "moment";
import SearchBar from "../../../components/SearchBar2";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import ErrorMessage from "../../../components/ErrorMessage";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { SIZES, rS, rV } from "../../../constants";
import { Community } from "../../../components/types";
import CommunityList from "../../../components/CommunityList";
import GlobalCommunityList from "../../../components/GlobalCommunityList";
import { Skeleton } from "moti/skeleton";
import { useWebSocket } from "../../../webSocketProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { searchCommunities } from '../../../CommunityApiCalls';

const CommunityScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [globalCommunities, setGlobalCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [initialLoad, setInitialLoad] = useState(true);
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const { isConnected, socket, joinAndSubscribeToCommunity, unsubscribeFromCommunity, subscribeToExistingUserCommunities, fetchAndCacheCommunities } = useWebSocket() || {
    isConnected: false,
    socket: null,
    joinAndSubscribeToCommunity: () => {},
    unsubscribeFromCommunity: () => {},
    subscribeToExistingUserCommunities: () => {},
    fetchAndCacheCommunities: () => {},
  };

  // Load cached user communities when the screen mounts or when token changes
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedCommunities = await AsyncStorage.getItem('communities');
        if (cachedCommunities) {
          setMyCommunities(JSON.parse(cachedCommunities));
          // Fetch last messages for all communities
          const messages = await Promise.all(
            JSON.parse(cachedCommunities).map(async (community: Community) => {
              const message = await AsyncStorage.getItem(`last_message_${community.id}`);
              return [community.id, message ? JSON.parse(message) : null];
            })
          );
          setLastMessages(Object.fromEntries(messages));
        }
        setLoading(false);
        setInitialLoad(false); // Set initialLoad to false after fetching data
      } catch (error) {
        console.error("Error loading cached communities:", error);
        setErrorMessage("Failed to load communities");
        setLoading(false);
        setInitialLoad(false);
      }
    };
    loadCachedData();
  }, [userToken]);

  // Fetch global communities only when search query has at least 3 characters
  useEffect(() => {
    const searchForCommunities = async () => {
      if (searchQuery.length >= 3 && userToken?.token) {
        setIsFetching(true);
        try {
          const fetchedCommunities = await searchCommunities(searchQuery, userToken.token);
          setGlobalCommunities(fetchedCommunities);
        } catch (error) {
          console.error("Error searching for global communities:", error);
          setErrorMessage("Failed to search global communities");
        } finally {
          setIsFetching(false);
        }
      } else {
        setGlobalCommunities([]);
      }
    };
    searchForCommunities();
  }, [searchQuery, userToken]);

  // Use WebSocket for real-time subscriptions
  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        subscribeToExistingUserCommunities();
        fetchAndCacheCommunities();
      }
      return () => {
        // Unsubscribe logic can still be here if needed
      };
    }, [isConnected, subscribeToExistingUserCommunities, fetchAndCacheCommunities])
  );

  // Listen to WebSocket messages for updating last messages
  useEffect(() => {
    const onMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'message') {
          // New message comes with 'sent' status by default
          const newMessage = {
            ...data,
            status: 'sent',
            sent_at: new Date(data.sent_at).toISOString(),
          };
          setLastMessages(prevMessages => ({
            ...prevMessages,
            [data.community_id]: newMessage,
          }));
          // Cache the new message status
          AsyncStorage.setItem(`last_message_${data.community_id}`, JSON.stringify(newMessage));
        } else if (data.type === 'message_status') {
          setLastMessages(prevMessages => ({
            ...prevMessages,
            [data.message_id]: {
              ...(prevMessages[data.message_id] || {}),
              status: data.status,
            }
          }));
          // Update cache with new status
          if (prevMessages[data.message_id]) {
            AsyncStorage.setItem(`last_message_${prevMessages[data.message_id].community_id}`, JSON.stringify({
              ...prevMessages[data.message_id],
              status: data.status
            }));
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    if (isConnected && socket) {
      socket.addEventListener('message', onMessage);
    }

    return () => {
      if (isConnected && socket) {
        socket.removeEventListener('message', onMessage);
      }
    };
  }, [isConnected, socket]);


  const handleNavigateCreateCommunity = () => {
    router.navigate("CreateCommunity");
  };

  const getLastMessage = useCallback((communityId: string) => {
    return lastMessages[communityId] || null;
  }, [lastMessages]);

  // Sorting logic for user communities based on the last message's timestamp
  const sortedMyCommunities = useMemo(() => {
    return myCommunities.map(community => ({
      ...community,
      lastMessageTime: lastMessages[community.id]?.sent_at || new Date(0).toISOString(),
    })).sort((a, b) => 
      moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
    );
  }, [myCommunities, lastMessages]);

  // Combine and filter communities for search
  const filteredCommunities = useMemo(() => {
    if (searchQuery.length < 3) return { user: sortedMyCommunities, global: [] };

    const filteredUserCommunities = myCommunities.filter(community =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(community => ({
      ...community,
      lastMessageTime: lastMessages[community.id]?.sent_at || new Date(0).toISOString(),
    })).sort((a, b) => 
      moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
    );

    const filteredGlobalCommunities = globalCommunities.filter(community =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return { user: filteredUserCommunities, global: filteredGlobalCommunities };
  }, [searchQuery, myCommunities, globalCommunities, lastMessages]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCommunityPress = useCallback(async (community: Community) => {
    const isUserCommunity = myCommunities.some(c => c.id === community.id);
    
    if (!isUserCommunity && isConnected) {
      await joinAndSubscribeToCommunity(community.id);
      setMyCommunities(prev => [...prev, community]);
      fetchAndCacheCommunities();
    }
  
    // Update message status to 'read' for the last message in this community
    const lastMessage = getLastMessage(community.id);
    if (lastMessage && lastMessage.status !== 'read') {
      if (socket) {
        socket.send(JSON.stringify({
          type: 'message_status_update',
          message_id: lastMessage.id,
          status: 'read'
        }));
      }
    }

    router.navigate({
      pathname: "ChatScreen",
      params: { communityId: community.id, name: community.name },
    });
  }, [myCommunities, isConnected, joinAndSubscribeToCommunity, fetchAndCacheCommunities, getLastMessage, socket]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: themeColors.background,
    },
    searchContainer: {
      paddingVertical: 10,
      flex: 0.05,
    },
    listContainer: {
      flex: 1,
      paddingTop: 10,
    },
    addButton: {
      position: "absolute",
      right: rS(20),
      bottom: rV(20),
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.buttonBackground,
    },
    noResultsText: {
      color: themeColors.textSecondary,
      alignSelf: "center",
    },
    skeletonItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingLeft: rS(1),
      paddingVertical: rV(10),
    },
    skeletonTextContainer: {
      flex: 1,
      gap: 10,
    },
  });

  const noResultsFound = searchQuery.length >= 3 && filteredCommunities.user.length === 0 && filteredCommunities.global.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </View>

      {initialLoad || loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <Skeleton colorMode={colorMode} width={50} height={50} radius={50} />
            <View style={styles.skeletonTextContainer}>
              <Skeleton colorMode={colorMode} height={rV(20)} width={"60%"} />
              <Skeleton colorMode={colorMode} height={rV(15)} width={"80%"} />
            </View>
          </View>
        ))
      ) : noResultsFound ? (
        <View style={styles.listContainer}>
          {isFetching ? 
            <ActivityIndicator color="white" style={[styles.noResultsText]} /> : 
            <Text style={[styles.noResultsText, { color: themeColors.placeholder }]}>No results found</Text>
          }
        </View>
      ) : (
        <View style={styles.listContainer}>
          {searchQuery.length >= 3 ? (
            <React.Fragment>
              <CommunityList
                title="My Communities"
                data={filteredCommunities.user}
                onCommunityPress={handleCommunityPress}
                showLastMessage
                getLastMessage={getLastMessage}
              />
              {filteredCommunities.global.length > 0 && (
                <GlobalCommunityList
                  title="Global Communities"
                  data={filteredCommunities.global}
                  onCommunityPress={handleCommunityPress}
                />
              )}
            </React.Fragment>
          ) : (
            <CommunityList
              title="My Communities"
              data={sortedMyCommunities}
              onCommunityPress={handleCommunityPress}
              showLastMessage
              getLastMessage={getLastMessage}
            />
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleNavigateCreateCommunity}>
            <FontAwesome6 name="add" size={SIZES.xLarge} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      )}

      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </View>
  );
};

export default CommunityScreen;