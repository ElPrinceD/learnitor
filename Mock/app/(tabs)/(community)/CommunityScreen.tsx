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
import { useWebSocket } from "../../../contexts/webSocketProvider";
import { useCommunity } from "../../../contexts/CommunityContext";
import { useCache } from "../../../contexts/CacheContext";
import {
  getCommunityDetails,
  searchCommunities,
} from "../../../services/CommunityApiCalls";

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

  const { isConnected, socket } = useWebSocket();
  const {
    unreadMessages,
    joinAndSubscribeToCommunity,
    markMessageAsRead,
    setCurrentCommunityId,
  } = useCommunity();
  const { getItem, setItem, removeItem,getAllKeys } = useCache();

  const mapCommunities = (communities: Community[], lastMsgs: Record<string, any>) =>
    communities
      .map((community) => ({
        ...community,
        lastMessageTime: lastMsgs[community.id]?.sent_at || new Date(0).toISOString(),
      }))
      .sort((a, b) => moment(b.lastMessageTime).diff(moment(a.lastMessageTime)));

      const loadCachedData = useCallback(async () => {
        try {
          // Get all cached keys
          const keys = await getAllKeys();
          const cachedCommunityKeys = keys.filter((key) => key.startsWith("community_"));
      
          if (cachedCommunityKeys.length > 0) {
            // Fetch all cached communities
            const cachedCommunities = await Promise.all(
              cachedCommunityKeys.map(async (key) => {
                const community = await getItem(key);
                return community ? JSON.parse(community) : null;
              })
            );
      
            // Filter out any null values (in case of corrupted or missing data)
            const validCommunities = cachedCommunities.filter((c) => c !== null);
      
            // Set communities to state
            setMyCommunities(validCommunities);
      
            // Load last messages for each community
            const messages = await Promise.all(
              validCommunities.map(async (c: Community) => {
                const msg = await getItem(`last_message_${c.id}`);
                return [c.id.toString(), msg ? JSON.parse(msg) : null];
              })
            );
      
            setLastMessages(Object.fromEntries(messages));
          } else {
            setErrorMessage("No cached communities found");
          }
        } catch (e) {
          setErrorMessage("Failed to load communities");
        } finally {
          setLoading(false);
          setInitialLoad(false);
        }
      }, [getAllKeys, getItem]);

  useFocusEffect(
    useCallback(() => {
      loadCachedData();
    }, [loadCachedData])
  );

  useEffect(() => {
    if (!socket || !isConnected || !userToken) return;

    const onMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        const id = data.community?.id?.toString() || data.community_id?.toString();
        if (!id) return;

        if (data.type === "community_updated" && data.community) {
          setMyCommunities((prev) => {
            const exists = prev.some((c) => c.id.toString() === id);
            const updated = exists
              ? prev.map((c) => (c.id.toString() === id ? { ...c, ...data.community } : c))
              : [...prev, { ...data.community, id: parseInt(id) }];
            
            setItem(`community_${id}`, JSON.stringify(data.community));
            return updated;
          });
        } else if (data.type === "join_success") {
          const community = await getCommunityDetails(id, userToken.token);
          if (community) {
            setMyCommunities((prev) => {
              if (!prev.some((c) => c.id === community.id)) {
                const updated = [...prev, community];
                setItem("communities", JSON.stringify(updated));
                setItem(`community_${id}`, JSON.stringify(community));
                return updated;
              }
              return prev;
            });
          }
        }  else if (data.type === "message") {
          const newMsg = {
            ...data,
            sent_at: new Date(data.sent_at).toISOString(),
            community_id: parseInt(id),
          };
          setLastMessages((prev) => {
            const updated = { ...prev, [id]: newMsg };
            console.log("Updated last messages:", updated);
            setItem(`last_message_${id}`, JSON.stringify(newMsg));
            return updated;
          });
        }
      } catch (e) {
        console.error("WebSocket error:", e);
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [socket, isConnected, userToken, getItem, setItem, removeItem]);

  useEffect(() => {
    const fetchGlobal = async () => {
      if (searchQuery.length >= 3 && userToken?.token) {
        setIsFetching(true);
        try {
          const result = await searchCommunities(searchQuery, userToken.token);
          const filtered = result.filter(
            (c) => !myCommunities.some((mc) => mc.id === c.id)
          );
          setGlobalCommunities(filtered);
        } catch (e) {
          setErrorMessage("Failed to search global communities");
        } finally {
          setIsFetching(false);
        }
      } else {
        setGlobalCommunities([]);
      }
    };
    fetchGlobal();
  }, [searchQuery, userToken, myCommunities]);

 

  useFocusEffect(
    useCallback(() => {
      const handleNavParam = async () => {
        const newCommunityParam = params.newCommunity;
        if (newCommunityParam && typeof newCommunityParam === "string") {
          try {
            const parsed: Community = JSON.parse(newCommunityParam);
            if (!myCommunities.some((c) => c.id === parsed.id)) {
              const updated = [...myCommunities, parsed];
              setMyCommunities(updated);
              
              await setItem(`community_${parsed.id}`, JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn("Failed to parse new community param:", e);
          }
        }
        router.setParams({ newCommunity: undefined });
      };
      handleNavParam();
    }, [params.newCommunity, myCommunities])
  );

  const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

  const getLastMessage = useCallback(
    (id: string) => lastMessages[id] || null,
    [lastMessages]
  );

  const sortedMyCommunities = useMemo(
    () => mapCommunities(myCommunities, lastMessages),
    [myCommunities, lastMessages]
  );

  const filteredCommunities = useMemo(() => {
    if (searchQuery.length < 3)
      return { user: sortedMyCommunities, global: [] };

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
  }, [searchQuery, myCommunities, globalCommunities, lastMessages]);

  const handleCommunityPress = useCallback(async (community: Community) => {
    try {
      const exists = myCommunities.some((c) => c.id === community.id);
      if (!exists && isConnected) {
        await joinAndSubscribeToCommunity(community.id.toString());
        const details = await getCommunityDetails(community.id.toString(), userToken?.token);
        setMyCommunities((prev) => {
          if (!prev.some((c) => c.id === details.id)) {
            const updated = [...prev, details];
            setItem(`community_${details.id}`, JSON.stringify(community));
            return updated;
          }
          return prev;
        });
      }
      setCurrentCommunityId(community.id.toString());
      markMessageAsRead(community.id.toString());
      router.navigate({
        pathname: "ChatScreen",
        params: { communityId: community.id, name: community.name, image: community.image_url },
      });
      setSearchQuery("");
    } catch (e) {
      console.error("Join or navigate failed:", e);
      setErrorMessage("Failed to join or open community");
    }
  }, [myCommunities, isConnected, joinAndSubscribeToCommunity, markMessageAsRead, setCurrentCommunityId, userToken, setItem]);

  const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, backgroundColor: themeColors.background },
    searchContainer: { paddingVertical: 10, flex: 0.05 },
    listContainer: { flex: 1, paddingTop: 15 },
    noResultsText: { color: themeColors.textSecondary, alignSelf: "center" },
    skeletonItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingLeft: rS(1),
      paddingVertical: rV(10),
    },
    skeletonTextContainer: { flex: 1, gap: 10 },
  });

  const noResultsFound = searchQuery.length >= 3 && !filteredCommunities.user.length && !filteredCommunities.global.length;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </View>

      {initialLoad || loading ? (
        Array.from({ length: 6 }).map((_, idx) => (
          <View key={`skeleton-${idx}`} style={styles.skeletonItem}>
            <Skeleton colorMode={colorMode} width={50} height={50} radius={50} />
            <View style={styles.skeletonTextContainer}>
              <Skeleton colorMode={colorMode} height={rV(20)} width="60%" />
              <Skeleton colorMode={colorMode} height={rV(15)} width="80%" />
            </View>
          </View>
        ))
      ) : noResultsFound ? (
        <View style={styles.listContainer}>
          {isFetching ? (
            <ActivityIndicator color="white" style={styles.noResultsText} />
          ) : (
            <Text style={[styles.noResultsText, { color: themeColors.placeholder }]}>No results found</Text>
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
                  Object.entries(unreadMessages).map(([id, count]) => [id, count > 0])
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
                Object.entries(unreadMessages).map(([id, count]) => [id, count > 0])
              )}
            />
          )}
        </View>
      )}

      {errorMessage && (
        <ErrorMessage message={errorMessage} visible onDismiss={() => setErrorMessage(null)} />
      )}
    </View>
  );
};

export default CommunityScreen;
