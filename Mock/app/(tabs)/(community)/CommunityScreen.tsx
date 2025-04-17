import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import moment from "moment";
import SearchBar from "../../../components/SearchBar2";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import ErrorMessage from "../../../components/ErrorMessage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  const { userToken, userInfo } = useAuth();
  const userId = userInfo?.user?.id;
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
    sqliteRemoveItem,
  } = useWebSocket() || {
    isConnected: false,
    socket: null,
    joinAndSubscribeToCommunity: () => Promise.resolve(),
    unsubscribeFromCommunity: () => {},
    subscribeToExistingUserCommunities: () => Promise.resolve(),
    fetchAndCacheCommunities: () => Promise.resolve(),
    markMessageAsRead: () => {},
    sqliteGetItem: async () => null,
    sqliteSetItem: async () => {},
    sqliteRemoveItem: async () => {},
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

  // Load cached user communities
  const loadCachedData = useCallback(async () => {
    if (!sqliteGetItem) return;
    try {
      const cachedCommunities = await sqliteGetItem("communities");
      if (cachedCommunities) {
        const parsedCommunities = JSON.parse(cachedCommunities);
        setMyCommunities(parsedCommunities);
        const messages = await Promise.all(
          parsedCommunities.map(async (community: Community) => {
            const message = await sqliteGetItem(`last_message_${community.id}`);
            let parsedMessage = message ? JSON.parse(message) : null;
            if (
              parsedMessage &&
              !["sent", "delivered", "read"].includes(parsedMessage.status)
            ) {
              parsedMessage = { ...parsedMessage, status: "read" };
            }
            return [community.id.toString(), parsedMessage];
          })
        );
        const messagesMap = Object.fromEntries(messages);
        setLastMessages(messagesMap);
      } else {
        console.log("No cached communities found");
      }
      setLoading(false);
      setInitialLoad(false);
    } catch (error) {
      console.error("Error loading cached communities:", error);
      setErrorMessage("Failed to load communities");
      setLoading(false);
      setInitialLoad(false);
    }
  }, [sqliteGetItem]);

  useFocusEffect(
    useCallback(() => {
      loadCachedData();
    }, [loadCachedData])
  );

  // Fetch global communities
  useEffect(() => {
    const searchForCommunities = async () => {
      if (searchQuery.length >= 3 && userToken?.token) {
        setIsFetching(true);
        try {
          const fetchedCommunities = await searchCommunities(
            searchQuery,
            userToken.token
          );
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

  // WebSocket message handler
  useEffect(() => {
    let socketCleanup = () => {};

    if (socket && isConnected && userToken) {
      const onMessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "community_updated" && data.community) {
            const communityId = data.community.id?.toString();
            if (!communityId) {
              console.warn("Received community_updated with missing community ID");
              return;
            }
            setMyCommunities((prev) => {
              const exists = prev.some((c) => c.id.toString() === communityId);
              let updatedCommunities;
              if (exists) {
                // Update existing community
                updatedCommunities = prev.map((c) =>
                  c.id.toString() === communityId
                    ? { ...c, ...data.community, id: parseInt(communityId) }
                    : c
                );
              } else {
                // Add new community
                updatedCommunities = [
                  ...prev,
                  { ...data.community, id: parseInt(communityId) },
                ];
              }
              // Update cache
              sqliteSetItem("communities", JSON.stringify(updatedCommunities));
              // Update individual community cache
              sqliteSetItem(
                `community_${communityId}`,
                JSON.stringify({ ...data.community, id: parseInt(communityId) })
              );
              return updatedCommunities;
            });
          } else if (data.type === "join_success" && data.community_id) {
            const communityId = data.community_id.toString();
            // Fetch full community details
            const communityDetails = await getCommunityDetails(
              communityId,
              userToken.token
            );
            if (communityDetails) {
              setMyCommunities((prev) => {
                if (!prev.some((c) => c.id.toString() === communityId)) {
                  const updatedCommunities = [
                    ...prev,
                    { ...communityDetails, id: parseInt(communityId) },
                  ];
                  // Update cache
                  sqliteSetItem("communities", JSON.stringify(updatedCommunities));
                  sqliteSetItem(
                    `community_${communityId}`,
                    JSON.stringify({
                      ...communityDetails,
                      id: parseInt(communityId),
                    })
                  );
                  return updatedCommunities;
                }
                return prev;
              });
            }
          } else if (data.type === "leave_community" && data.community_id) {
            const communityId = data.community_id.toString();
            setMyCommunities((prev) => {
              const updatedCommunities = prev.filter(
                (c) => c.id.toString() !== communityId
              );
              // Update cache
              sqliteSetItem("communities", JSON.stringify(updatedCommunities));
              return updatedCommunities;
            });
            setLastMessages((prev) => {
              const { [communityId]: _, ...rest } = prev;
              return rest;
            });
            await Promise.all([
              sqliteRemoveItem(`last_message_${communityId}`),
              sqliteRemoveItem(`community_${communityId}`),
              sqliteRemoveItem(`messages_${communityId}`),
              sqliteRemoveItem(`timetable_${communityId}`),
              sqliteRemoveItem(`images_${communityId}`),
            ]);
          } else if (data.type === "message") {
            const communityId = data.community_id?.toString();
            if (!communityId) {
              console.warn("Received message with missing community_id");
              return;
            }
            const newMessage = {
              ...data,
              status: "sent",
              sent_at: new Date(data.sent_at).toISOString(),
              community_id: parseInt(communityId),
            };
            setLastMessages((prev) => {
              const updated = { ...prev, [communityId]: newMessage };
              sqliteSetItem(
                `last_message_${communityId}`,
                JSON.stringify(newMessage)
              );
              return updated;
            });
          } else if (data.type === "message_status") {
            const messageId = data.message_id;
            const communityId =
              data.community_id?.toString() ||
              Object.keys(lastMessages).find(
                (key) => lastMessages[key].id === messageId
              )?.toString();
            if (!communityId) {
              console.warn("Received message_status with unknown community_id");
              return;
            }
            setLastMessages((prev) => {
              const updatedMessage = {
                ...prev[communityId],
                status: data.status,
                community_id: parseInt(communityId),
              };
              const updated = { ...prev, [communityId]: updatedMessage };
              sqliteSetItem(
                `last_message_${communityId}`,
                JSON.stringify(updatedMessage)
              );
              return updated;
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
  }, [socket, isConnected, userToken, sqliteGetItem, sqliteSetItem, sqliteRemoveItem, lastMessages]);

  // Handle community changes via navigation params
  useFocusEffect(
    useCallback(() => {
      const handleCommunityChanges = async () => {
        const newCommunityParam = params.newCommunity;
        let newCommunity: Community | undefined;
  
        // Parse newCommunity from params if available
        if (newCommunityParam && typeof newCommunityParam === "string") {
          try {
            newCommunity = JSON.parse(newCommunityParam) as Community;
          } catch (error) {
            console.error("Error parsing newCommunity param:", error);
          }
        }
  
        // Add new community to list if it doesn't exist already
        if (newCommunity && newCommunity.id) {
          setMyCommunities((prev) => {
            const alreadyExists = prev.some((c) => c.id === newCommunity!.id);
            if (!alreadyExists) {
              const updated = [...prev, newCommunity!];
              sqliteSetItem("communities", JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
  
        // Optionally refresh last messages from cache
        if (sqliteGetItem && myCommunities.length > 0) {
          const messages = await Promise.all(
            myCommunities.map(async (community: Community) => {
              const message = await sqliteGetItem(`last_message_${community.id}`);
              return [
                community.id.toString(),
                message ? JSON.parse(message) : null,
              ];
            })
          );
          setLastMessages(Object.fromEntries(messages));
        }
  
        // Clear navigation param to avoid reprocessing
        router.setParams({ newCommunity: undefined });
      };
  
      handleCommunityChanges();
    }, [params.newCommunity, myCommunities, sqliteGetItem])
  );
  

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

  const handleCommunityPress = useCallback(async (community: Community) => {
    try {
      const isUserCommunity = myCommunities.some((c) => c.id === community.id);
      if (!isUserCommunity && isConnected) {
        await joinAndSubscribeToCommunity(community.id);
        setMyCommunities((prev) => {
          const updatedCommunities = [...prev, community];
          sqliteSetItem("communities", JSON.stringify(updatedCommunities));
          return updatedCommunities;
        });
      }

      const lastMessage = getLastMessage(community.id.toString());
      if (lastMessage && lastMessage.sender_id !== userId && lastMessage.status !== "read") {
        markMessageAsRead(community.id.toString());
        setLastMessages((prev) => ({
          ...prev,
          [community.id.toString()]: { ...lastMessage, status: "read" },
        }));
      }

      router.navigate({
        pathname: "ChatScreen",
        params: { communityId: community.id, name: community.name, image: community.image_url },
      });
      setSearchQuery("");
    } catch (error) {
      console.error("Error in handleCommunityPress:", error);
      setErrorMessage("Failed to join or navigate to community");
    }
  }, [myCommunities, isConnected, joinAndSubscribeToCommunity, getLastMessage, markMessageAsRead, userId]);

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
            <>
              <CommunityList
                title="My Communities"
                data={filteredCommunities.user}
                onCommunityPress={handleCommunityPress}
                showLastMessage
                getLastMessage={getLastMessage}
                showUnreadIndicator={Object.fromEntries(
                  Object.entries(lastMessages).map(([id, message]) => [
                    id,
                    message && message.sender_id !== userId && message.status !== "read",
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
            </>
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
                  message && message.sender_id !== userId && message.status !== "read",
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