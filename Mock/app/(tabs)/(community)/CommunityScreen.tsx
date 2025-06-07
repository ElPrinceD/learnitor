import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import moment from "moment";
import { debounce } from "lodash"; // Add lodash for debouncing
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
import { useWebSocket } from "../../../contexts/webSocketProvider";
import { useCommunity } from "../../../contexts/CommunityContext";
import { useCache } from "../../../contexts/CacheContext";
import {
  getCommunityDetails,
  searchCommunities,
} from "../../../services/CommunityApiCalls";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: rS(16),
  },
  searchContainer: {
    paddingVertical: rV(5),
  },
  listContainer: {
    flex: 1,
    paddingTop: rV(5),
  },
  noResultsText: {
    alignSelf: "center",
    marginTop: rV(20),
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: rS(14),
    paddingLeft: rS(1),
    paddingVertical: rV(10),
  },
  skeletonTextContainer: {
    flex: 1,
    gap: rV(10),
  },
});

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
  const themeColors = useMemo(
    () => Colors[colorScheme ?? "light"],
    [colorScheme]
  );
  const colorMode = colorScheme === "dark" ? "dark" : "light";
  const params = useLocalSearchParams();
  const { isConnected, socket } = useWebSocket();
  const {
    unreadMessages,
    joinAndSubscribeToCommunity,
    markMessageAsRead,
    setCurrentCommunityId,
  } = useCommunity();
  const { getItem, setItem, getAllKeys } = useCache();
  const hasProcessedNewCommunity = useRef(false);

  const mapCommunities = useCallback(
    (communities: Community[], lastMsgs: Record<string, any>) =>
      communities
        .map((community) => ({
          ...community,
          lastMessageTime:
            lastMsgs[community.id]?.sent_at || new Date(0).toISOString(),
        }))
        .sort((a, b) =>
          moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
        ),
    []
  );

  const loadCachedData = useCallback(async () => {
    if (myCommunities.length > 0) return; // Skip if data exists
    try {
      setLoading(true);
      const keys = await getAllKeys();
      const cachedCommunityKeys = keys.filter((key) =>
        key.startsWith("community_")
      );

      if (cachedCommunityKeys.length > 0) {
        const cachedCommunities = await Promise.all(
          cachedCommunityKeys.map(async (key) => {
            const community = await getItem(key);
            return community ? JSON.parse(community) : null;
          })
        );
        const validCommunities = cachedCommunities.filter(
          (c): c is Community => c !== null
        );
        setMyCommunities(validCommunities);

        const messages = await Promise.all(
          validCommunities.map(async (c: Community) => {
            const msg = await getItem(`last_message_${c.id}`);
            return [c.id.toString(), msg ? JSON.parse(msg) : null];
          })
        );
        setLastMessages(Object.fromEntries(messages));
      } else {
        setErrorMessage("No communities found.");
      }
    } catch (e) {
      setErrorMessage("Failed to load communities.");
      console.error("Cache load error:", e);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [getAllKeys, getItem, myCommunities.length]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoad && myCommunities.length > 0) return;
      loadCachedData();
      const handleNavParam = async () => {
        const newCommunityParam = params.newCommunity;
        if (
          newCommunityParam &&
          typeof newCommunityParam === "string" &&
          !hasProcessedNewCommunity.current
        ) {
          try {
            hasProcessedNewCommunity.current = true;
            const parsed: Community = JSON.parse(newCommunityParam);
            setMyCommunities((prev) => {
              if (!prev.some((c) => c.id === parsed.id)) {
                setItem(`community_${parsed.id}`, JSON.stringify(parsed));
                return [...prev, parsed];
              }
              return prev;
            });
            router.setParams({ newCommunity: undefined });
          } catch (e) {
            console.warn("Failed to parse new community param:", e);
          }
        }
      };
      handleNavParam();
    }, [
      loadCachedData,
      params.newCommunity,
      setItem,
      initialLoad,
      myCommunities.length,
    ])
  );
  const debouncedSetCommunities = useCallback(
    debounce((newCommunities) => {
      setMyCommunities(newCommunities);
    }, 300),
    []
  );
  const debouncedSetMessages = useCallback(
    debounce((newMessages) => {
      setLastMessages(newMessages);
    }, 300),
    []
  );

  const onMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const id =
          data.community?.id?.toString() || data.community_id?.toString();
        if (!id) return;

        if (data.type === "community_updated" && data.community) {
          setMyCommunities((prev) => {
            const exists = prev.some((c) => c.id.toString() === id);
            if (exists) {
              const updated = prev.map((c) =>
                c.id.toString() === id ? { ...c, ...data.community } : c
              );
              if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                setItem(`community_${id}`, JSON.stringify(data.community));
                debouncedSetCommunities(updated);
                return updated;
              }
              return prev;
            }
            const newCommunity = { ...data.community, id: parseInt(id) };
            setItem(`community_${id}`, JSON.stringify(newCommunity));
            const newCommunities = [...prev, newCommunity];
            debouncedSetCommunities(newCommunities);
            return newCommunities;
          });
        } else if (data.type === "join_success") {
          const community = await getCommunityDetails(id, userToken?.token);
          if (community) {
            setMyCommunities((prev) => {
              if (!prev.some((c) => c.id === community.id)) {
                setItem(`community_${id}`, JSON.stringify(community));
                const newCommunities = [...prev, community];
                debouncedSetCommunities(newCommunities);
                return newCommunities;
              }
              return prev;
            });
          }
        } else if (data.type === "message") {
          const newMsg = {
            ...data,
            sent_at: new Date(data.sent_at).toISOString(),
            community_id: parseInt(id),
          };
          setLastMessages((prev) => {
            if (JSON.stringify(prev[id]) !== JSON.stringify(newMsg)) {
              setItem(`last_message_${id}`, JSON.stringify(newMsg));
              const newMessages = { ...prev, [id]: newMsg };
              debouncedSetMessages(newMessages);
              return newMessages;
            }
            return prev;
          });
        }
      } catch (e) {
        console.error("WebSocket error:", e);
      }
    },
    [userToken?.token, setItem]
  );

  useEffect(() => {
    if (!socket || !isConnected || !userToken) return;

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [socket, isConnected, userToken, onMessage]);

  const debouncedFetchGlobal = useCallback(
    debounce(async (query: string) => {
      if (query.length >= 3 && userToken?.token) {
        setIsFetching(true);
        try {
          const result = await searchCommunities(query, userToken.token);
          setGlobalCommunities(
            result.filter((c) => !myCommunities.some((mc) => mc.id === c.id))
          );
        } catch (e) {
          setErrorMessage("Failed to search communities.");
          console.error("Search error:", e);
        } finally {
          setIsFetching(false);
        }
      } else {
        setGlobalCommunities([]);
      }
    }, 300),
    [userToken?.token, myCommunities]
  );

  useEffect(() => {
    debouncedFetchGlobal(searchQuery);
  }, [searchQuery, debouncedFetchGlobal]);

  const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

  const getLastMessage = useCallback(
    (id: string) => lastMessages[id] || null,
    [lastMessages]
  );

  const sortedMyCommunities = useMemo(
    () => mapCommunities(myCommunities, lastMessages),
    [myCommunities, lastMessages, mapCommunities]
  );

  const filteredCommunities = useMemo(() => {
    if (searchQuery.length < 3) {
      return { user: sortedMyCommunities, global: [] };
    }

    return {
      user: mapCommunities(
        myCommunities.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        lastMessages
      ),
      global: globalCommunities.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    };
  }, [
    searchQuery,
    myCommunities,
    globalCommunities,
    lastMessages,
    sortedMyCommunities,
    mapCommunities,
  ]);

  const handleCommunityPress = useCallback(
    async (community: Community) => {
      try {
        const exists = myCommunities.some((c) => c.id === community.id);
        if (!exists && isConnected) {
          await joinAndSubscribeToCommunity(community.id.toString());
          const details = await getCommunityDetails(
            community.id.toString(),
            userToken?.token
          );
          setMyCommunities((prev) => {
            if (!prev.some((c) => c.id === details.id)) {
              setItem(`community_${details.id}`, JSON.stringify(details));
              return [...prev, details];
            }
            return prev;
          });
        }
        setCurrentCommunityId(community.id.toString());
        markMessageAsRead(community.id.toString());
        router.navigate({
          pathname: "/ChatScreen",
          params: {
            communityId: community.id,
            name: community.name,
            image: community.image_url,
          },
        });
        setSearchQuery("");
      } catch (e) {
        console.error("Join or navigate failed:", e);
        setErrorMessage("Failed to join or open community.");
      }
    },
    [
      myCommunities,
      isConnected,
      joinAndSubscribeToCommunity,
      markMessageAsRead,
      setCurrentCommunityId,
      userToken?.token,
      setItem,
    ]
  );

  const showUnreadIndicator = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(unreadMessages).map(([id, count]) => [id, count > 0])
      ),
    [unreadMessages]
  );

  const noResultsFound =
    searchQuery.length >= 3 &&
    !filteredCommunities.user.length &&
    !filteredCommunities.global.length;

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </View>
      {initialLoad || loading ? (
        Array.from({ length: 6 }).map((_, idx) => (
          <View key={`skeleton-${idx}`} style={styles.skeletonItem}>
            <Skeleton
              colorMode={colorMode}
              width={rS(50)}
              height={rS(50)}
              radius={50}
            />
            <View style={styles.skeletonTextContainer}>
              <Skeleton colorMode={colorMode} height={rV(20)} width="60%" />
              <Skeleton colorMode={colorMode} height={rV(15)} width="80%" />
            </View>
          </View>
        ))
      ) : noResultsFound ? (
        <View style={styles.listContainer}>
          {isFetching ? (
            <ActivityIndicator
              color={themeColors.tint}
              style={styles.noResultsText}
            />
          ) : (
            <Text
              style={[
                styles.noResultsText,
                { color: themeColors.textSecondary },
              ]}
            >
              No communities found.
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
                showUnreadIndicator={showUnreadIndicator}
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
              showUnreadIndicator={showUnreadIndicator}
            />
          )}
        </View>
      )}
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default memo(CommunityScreen);
