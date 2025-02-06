import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
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
import { searchCommunities } from "../../../CommunityApiCalls";

const CommunityScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [globalCommunities, setGlobalCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const {
    isConnected,
    socket,
    joinAndSubscribeToCommunity,
    unsubscribeFromCommunity,
    subscribeToExistingUserCommunities,
    fetchAndCacheCommunities,
    markMessageAsRead,
    db,
    fetchMessagesPage, // New addition for pagination (not used here but available)
  } = useWebSocket();

  // Utility function for mapping communities
  const mapCommunities = (communities, lastMessages) => {
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
      try {
        await fetchAndCacheCommunities();
        const [communitiesResult] = await db.executeSql("SELECT * FROM communities");
        const communities = Array.from({ length: communitiesResult.rows.length }, (_, i) => communitiesResult.rows.item(i));

        const messagesPromises = communities.map(async (community: Community) => {
          const [lastMessageResult] = await db.executeSql("SELECT * FROM last_messages WHERE community_id = ?", [community.id]);
          const parsedMessage = lastMessageResult.rows.length > 0 ? lastMessageResult.rows.item(0) : null;
          return [community.id, parsedMessage];
        });
        const messages = await Promise.all(messagesPromises);
        setLastMessages(Object.fromEntries(messages));

        setMyCommunities(communities);
        setLoading(false);
      } catch (error) {
        console.error("Error loading cached communities:", error);
        setErrorMessage("Failed to load communities");
        setLoading(false);
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
          const fetchedCommunities = await searchCommunities(
            searchQuery,
            userToken.token
          );
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
      }
      return () => {
        // Unsubscribe logic can still be here if needed
      };
    }, [isConnected, subscribeToExistingUserCommunities])
  );

  // Listen to WebSocket messages for updating last messages
  useEffect(() => {
    const onMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          setLastMessages((prevState) => ({
            ...prevState,
            [data.community_id]: {
              ...data,
              status: "sent",
              sent_at: new Date().toISOString(),
            },
          }));
        } else if (data.type === "message_status") {
          setLastMessages((prevState) => ({
            ...prevState,
            [data.message_id]: {
              ...(prevState[data.message_id] || {}),
              status: data.status,
            },
          }));
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
  }, [isConnected, socket]);

  const handleNavigateCreateCommunity = useCallback(() => {
    router.navigate("CreateCommunity");
  }, []);

  const getLastMessage = useCallback(
    (communityId: string) => {
      return lastMessages[communityId] || null;
    },
    [lastMessages]
  );

  // Sorting logic for user communities based on the last message's timestamp
  const sortedMyCommunities = useMemo(() => {
    return mapCommunities(myCommunities, lastMessages);
  }, [myCommunities, lastMessages]);

  // Combine and filter communities for search
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
      console.log("Community pressed:", community.id);

      try {
        const isUserCommunity = myCommunities.some((c) => c.id === community.id);

        if (!isUserCommunity && isConnected) {
          await joinAndSubscribeToCommunity(community.id);
          setMyCommunities((prev) => [...prev, community]);
        }

        const lastMessage = getLastMessage(community.id);

        if (lastMessage && lastMessage.status !== "read") {
          markMessageAsRead(community.id);
          setLastMessages((prevState) => ({
            ...prevState,
            [community.id]: {
              ...prevState[community.id],
              status: "read",
            },
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
    [myCommunities, isConnected, joinAndSubscribeToCommunity, getLastMessage]
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

      {loading ? (
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
                    message?.status !== "read",
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
                  message?.status !== "read",
                ])
              )}
            />
          )}
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: themeColors.buttonBackground },
            ]}
            onPress={handleNavigateCreateCommunity}
          >
            <FontAwesome6
              name="add"
              size={SIZES.xLarge}
              color={themeColors.text}
            />
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