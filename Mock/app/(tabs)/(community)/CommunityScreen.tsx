import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, Text, useColorScheme, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
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

  // Utility function for mapping communities
  const mapCommunities = (communities, lastMessages) => {
    return communities.map(community => ({
      ...community,
      lastMessageTime: lastMessages[community.id]?.sent_at || new Date(0).toISOString(),
    })).sort((a, b) => 
      moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
    );
  };

  // Load cached user communities when the screen mounts or when token changes
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedCommunities = await AsyncStorage.getItem('communities');
        if (cachedCommunities) {
          setMyCommunities(JSON.parse(cachedCommunities));
          const messages = await Promise.all(
            JSON.parse(cachedCommunities).map(async (community: Community) => {
              const message = await AsyncStorage.getItem(`last_message_${community.id}`);
              const parsedMessage = message ? JSON.parse(message) : null;
              console.log(`Status of last message in community ${community.id}: ${parsedMessage?.status || 'no message'}`);
              return [community.id, parsedMessage];
            })
          );
          setLastMessages(Object.fromEntries(messages));
  
          // Here we ensure that only messages with status other than 'read' show the indicator
          const unreadIndicatorStatus = Object.fromEntries(
            messages.map(([id, message]) => [id, message?.status !== 'read'])
          );
          console.log('Unread status:', unreadIndicatorStatus);
        }
        setLoading(false);
        setInitialLoad(false);
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
          const newMessage = {
            ...data,
            status: 'sent',
            sent_at: new Date(data.sent_at).toISOString(),
          };
          setLastMessages((prevState) => ({
            ...prevState,
            [data.community_id]: newMessage,
          }));


          console.log(`Status of last message in community ${data.community_id}: ${newMessage.status}`);
          // Cache the new message status
          AsyncStorage.setItem(`last_message_${data.community_id}`, JSON.stringify(newMessage));
        } else if (data.type === 'message_status') {
          setLastMessages((prevState) => ({
            ...prevState,
            [data.message_id]: {
              ...(prevState[data.message_id] || {}),
              status: data.status,
            }
          }));

          
          console.log(`Status of message ${data.message_id}: ${data.status}`);
          // Update cache with new status
          const cachedMessage = lastMessages[data.message_id];
          if (cachedMessage) {
            AsyncStorage.setItem(`last_message_${cachedMessage.community_id}`, JSON.stringify({
              ...cachedMessage,
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
  }, [isConnected, socket, lastMessages]);

  const handleNavigateCreateCommunity = useCallback(() => {
    router.navigate("CreateCommunity");
  }, []);

  const getLastMessage = useCallback((communityId: string) => {
    return lastMessages[communityId] || null;
  }, [lastMessages]);

  // Sorting logic for user communities based on the last message's timestamp
  const sortedMyCommunities = useMemo(() => {
    return mapCommunities(myCommunities, lastMessages);
  }, [myCommunities, lastMessages]);

  // Combine and filter communities for search
  const filteredCommunities = useMemo(() => {
    if (searchQuery.length < 3) return { user: sortedMyCommunities, global: [] };

    const filteredUserCommunities = mapCommunities(
      myCommunities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      lastMessages
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
        
        // Optimistically update the state to remove the unread indicator
        setLastMessages(prevState => ({
          ...prevState,
          [community.id]: {
            ...prevState[community.id],
            status: 'read'
          }
        }));
  
        // Update the cache immediately for persistence
        AsyncStorage.setItem(`last_message_${community.id}`, JSON.stringify({
          ...lastMessage,
          status: 'read'
        }));
      }
    }
  
    router.navigate({
      pathname: "ChatScreen",
      params: { communityId: community.id, name: community.name, image: community.image_url },
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
          <View key={`skeleton-${index}`} style={styles.skeletonItem}>
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
                showUnreadIndicator={Object.fromEntries(
                  Object.entries(lastMessages).map(([id, message]) => [id, message?.status !== 'read'])
                )}
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
              showUnreadIndicator={Object.fromEntries(
                Object.entries(lastMessages).map(([id, message]) => [id, message?.status !== 'read'])
              )}
            />
          )}
          <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.buttonBackground }]} onPress={handleNavigateCreateCommunity}>
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