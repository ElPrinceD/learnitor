import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import moment from "moment";
import SearchBar from "../../../components/SearchBar2";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import ErrorMessage from "../../../components/ErrorMessage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { SIZES, rS, rV } from "../../../constants";
import { Community } from "../../../components/types";
import CommunityList from "../../../components/CommunityList";
import GlobalCommunityList from "../../../components/GlobalCommunityList";
import { Skeleton } from "moti/skeleton";
import { useWebSocket } from "../../../webSocketProvider";
import {
  getCommunityDetails,
  searchCommunities,
} from "../../../CommunityApiCalls";

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
  const params = useLocalSearchParams();

  const {
    isConnected,
    socket,
    joinAndSubscribeToCommunity,
    unsubscribeFromCommunity,
    subscribeToExistingUserCommunities,
    fetchAndCacheCommunities,
    markMessageAsRead,
    sqliteGetItem,
    sqliteSetItem,
  } = useWebSocket() || {
    isConnected: false,
    socket: null,
    joinAndSubscribeToCommunity: () => Promise.resolve(),
    unsubscribeFromCommunity: () => {},
    subscribeToExistingUserCommunities: () => Promise.resolve(),
    fetchAndCacheCommunities: () => Promise.resolve(),
  };

  // Utility function for mapping communities
  const mapCommunities = (
    communities: Community[],
    lastMessages: Record<string, any>
  ) => {
    return communities
      .map((community) => ({
        ...community,
        lastMessageTime:
          lastMessages[community.id]?.sent_at || new Date(0).toISOString(),
      }))
      .sort((a, b) =>
        moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
      );
  };

  // Load cached user communities when the screen mounts or when token changes
  useEffect(() => {
    const loadCachedData = async () => {
      if (!sqliteGetItem) return;
      try {
        const cachedCommunities = await sqliteGetItem("communities");
        if (cachedCommunities) {
          const parsedCommunities = JSON.parse(cachedCommunities);
          setMyCommunities(parsedCommunities);
          const messages = await Promise.all(
            parsedCommunities.map(async (community: Community) => {
              const message = await sqliteGetItem(
                `last_message_${community.id}`
              );
              const parsedMessage = message ? JSON.parse(message) : null;
              return [community.id, parsedMessage];
            })
          );
          setLastMessages(Object.fromEntries(messages));
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
  }, [userToken, sqliteGetItem]);

  // Fetch global communities and filter out user's communities
  useEffect(() => {
    const searchForCommunities = async () => {
      if (searchQuery.length >= 3 && userToken?.token) {
        setIsFetching(true);
        try {
          const fetchedCommunities = await searchCommunities(
            searchQuery,
            userToken.token
          );
          // Filter out communities that are already in myCommunities
          const filteredGlobalCommunities = fetchedCommunities.filter(
            (community) =>
              !myCommunities.some(
                (myCommunity) => myCommunity.id === community.id
              )
          );
          setGlobalCommunities(filteredGlobalCommunities);
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
  }, [searchQuery, userToken, myCommunities]);

  // Use WebSocket for real-time subscriptions
  useFocusEffect(
    useCallback(() => {
      const handleCommunityChanges = async () => {
        const newCommunityParam = params.newCommunity;
        let newCommunity: Community | undefined;
  
        if (newCommunityParam) {
          if (Array.isArray(newCommunityParam)) {
            newCommunity = JSON.parse(newCommunityParam[0]) as Community;
          } else {
            newCommunity = JSON.parse(newCommunityParam) as Community;
          }
  
          if (newCommunity) {
            setMyCommunities((prev) => {
              if (!prev.some((c) => c.id === newCommunity!.id)) {
                return [...prev, newCommunity!];
              }
              return prev;
            });
            router.setParams({ newCommunity: undefined });
          }
        }
  
        // Handle the leftCommunityId parameter
        const leftCommunityId = params.leftCommunityId;
        console.log('Id: ',leftCommunityId)
        if (leftCommunityId) {
          setMyCommunities((prev) => prev.filter((c) => c.id !== leftCommunityId));
          router.setParams({ leftCommunityId: undefined });
        }
  
        if (isConnected) {
          await subscribeToExistingUserCommunities();
          await fetchAndCacheCommunities();
        }
      };
      handleCommunityChanges();
    }, [
      params.newCommunity,
      params.leftCommunityId, // Add this dependency
      isConnected,
      subscribeToExistingUserCommunities,
      fetchAndCacheCommunities,
    ])
  );

  

  const handleJoinViaLink = useCallback(
    async (communityId) => {
      const communityDetails = await getCommunityDetails(
        communityId,
        userToken?.token
      );
      setMyCommunities((prev) => {
        if (!prev.some((c) => c.id === communityId)) {
          return [...prev, communityDetails];
        }
        return prev;
      });
    },
    [userToken]
  );

  // Listen to WebSocket messages for updating last messages
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (!sqliteSetItem) return;
      try {
        const data = JSON.parse(event.data);

        if (data.type === "join_success") {
          await handleJoinViaLink(data.community_id);
        }

        if (data.type === "message") {
          const newMessage = {
            ...data,
            status: "sent",
            sent_at: new Date(data.sent_at).toISOString(),
          };
          setLastMessages((prevState) => ({
            ...prevState,
            [data.community_id]: newMessage,
          }));
          await sqliteSetItem(
            `last_message_${data.community_id}`,
            JSON.stringify(newMessage)
          );
        } else if (data.type === "message_status") {
          setLastMessages((prevState) => ({
            ...prevState,
            [data.message_id]: {
              ...(prevState[data.message_id] || {}),
              status: data.status,
            },
          }));
          const cachedMessage = lastMessages[data.message_id];
          if (cachedMessage) {
            await sqliteSetItem(
              `last_message_${cachedMessage.community_id}`,
              JSON.stringify({
                ...cachedMessage,
                status: data.status,
              })
            );
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    if (isConnected && socket) {
      socket.addEventListener("message", onMessage);
    }

    return () => {
      if (isConnected && socket) {
        socket.removeEventListener("message", onMessage);
      }
    };
  }, [isConnected, socket, lastMessages, sqliteSetItem]);

  const handleNavigateCreateCommunity = useCallback(() => {
    router.navigate("CreateCommunity");
  }, []);

  const getLastMessage = useCallback(
    (communityId: string) => lastMessages[communityId] || null,
    [lastMessages]
  );

  const sortedMyCommunities = useMemo(() => {
    return mapCommunities(myCommunities, lastMessages);
  }, [myCommunities, lastMessages]);

  const filteredCommunities = useMemo(() => {
    if (searchQuery.length < 3)
      return { user: sortedMyCommunities, global: [] };

    const filteredUserCommunities = mapCommunities(
      myCommunities.filter((community) =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      lastMessages
    );

    const filteredGlobalCommunities = globalCommunities.filter((community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return { user: filteredUserCommunities, global: filteredGlobalCommunities };
  }, [searchQuery, myCommunities, globalCommunities, lastMessages]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCommunityPress = useCallback(
    async (community: Community) => {
      try {
        const isUserCommunity = myCommunities.some(
          (c) => c.id === community.id
        );
        if (!isUserCommunity && isConnected) {
          await joinAndSubscribeToCommunity(community.id);
          setMyCommunities((prev) => [...prev, community]);
          await fetchAndCacheCommunities();
        }

        const lastMessage = getLastMessage(community.id);
        if (lastMessage && lastMessage.status !== "read") {
          markMessageAsRead(community.id);
          setLastMessages((prevState) => ({
            ...prevState,
            [community.id]: { ...prevState[community.id], status: "read" },
          }));
        }

        router.navigate({
          pathname: "ChatScreen",
          params: {
            communityId: community.id,
            name: community.name,
            image: community.image_url,
          },
        });
      } catch (error) {
        console.error("Error in handleCommunityPress:", error);
      }
    },
    [
      myCommunities,
      isConnected,
      joinAndSubscribeToCommunity,
      fetchAndCacheCommunities,
      getLastMessage,
      markMessageAsRead,
    ]
  );

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
      paddingTop: 15,
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

  
  const noResultsFound =
    searchQuery.length >= 3 &&
    filteredCommunities.user.length === 0 &&
    filteredCommunities.global.length === 0;

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </View>

      {initialLoad || loading ? (
        // Show skeleton only if there's no cached data on initial load
        Array.from({ length: 6 }).map((_, index) => (
          <View key={`skeleton-${index}`} style={styles.skeletonItem}>
            <Skeleton
              colorMode={colorMode}
              width={50}
              height={50}
              radius={50}
            />
            <View style={styles.skeletonTextContainer}>
              <Skeleton colorMode={colorMode} height={rV(20)} width={"60%"} />
              <Skeleton colorMode={colorMode} height={rV(15)} width={"80%"} />
            </View>
          </View>
        ))
      ) : noResultsFound ? (
        <View style={styles.listContainer}>
          {isFetching ? (
            <ActivityIndicator color="white" style={[styles.noResultsText]} />
          ) : (
            <Text
              style={[styles.noResultsText, { color: themeColors.placeholder }]}
            >
              No results found
            </Text>
          )}
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
                  Object.entries(lastMessages).map(([id, message]) => [
                    id,
                    message && message.status !== "read",
                  ])
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
                Object.entries(lastMessages).map(([id, message]) => [
                  id,
                  message && message.status !== "read",
                ])
              )}
            />
          )}
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
