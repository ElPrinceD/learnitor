import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import moment from "moment";
import SearchBar from "../../../components/SearchBar2";
import Colors from "../../../constants/Colors";
import { useAuth } from "../../../components/AuthContext";
import ErrorMessage from "../../../components/ErrorMessage";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { SIZES, rS, rV } from "../../../constants";
import { Message, Community } from "../../../components/types";
import {
  getCommunities,
  getCommunityMessages,
  getUserCommunities,
} from "../../../CommunityApiCalls"; // Import the API calls
import CommunityList from "../../../components/CommunityList";
import { Skeleton } from "moti/skeleton"; // Import Skeleton

const CommunityScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [globalCommunities, setGlobalCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});

  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const wsRefs = useRef<{ [key: string]: WebSocket | null }>({});

  // Fetch communities and messages
  const fetchCommunities = async () => {
    try {
      const [userCommunities, globalCommunitiesResponse] = await Promise.all([
        getUserCommunities(userToken?.token || ""),
        getCommunities(userToken?.token || ""),
      ]);

      setMyCommunities(userCommunities);
      setGlobalCommunities(globalCommunitiesResponse);

      const messagesResponse = await Promise.all(
        userCommunities.map((community) =>
          getCommunityMessages(community.id, userToken?.token || "").then(
            (messages) => ({
              id: community.id,
              messages,
            })
          )
        )
      );

      const messagesMap = messagesResponse.reduce((acc, { id, messages }) => {
        acc[id] = messages;
        return acc;
      }, {} as { [key: string]: Message[] });

      setMessages(messagesMap);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching communities or messages:", error);
      setErrorMessage("Failed to load communities");
      setLoading(false);
    }
  };

  // Connect WebSocket connections
  const connectWebSockets = useCallback(() => {
    myCommunities.forEach((community) => {
      const { id } = community;
      if (userToken?.token) {
        const ws = new WebSocket(
          `wss://learnitor.onrender.com/community/${id}/?token=${userToken.token}`
        );
        wsRefs.current[id] = ws;

        ws.onopen = () => {
          console.log(`WebSocket connection opened for community ${id}`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message) {
              setMessages((prevMessages) => {
                const communityMessages = prevMessages[id] || [];
                const updatedMessages = [...communityMessages, data.message];
                return {
                  ...prevMessages,
                  [id]: updatedMessages,
                };
              });
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for community ${id}:`, error);
        };

        ws.onclose = () => {
          console.log(`WebSocket connection closed for community ${id}`);
          // Reconnect logic if needed
        };
      }
    });
  }, [myCommunities, userToken]);

  // Use focus effect to fetch data and connect WebSockets when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      connectWebSockets();
      fetchCommunities();

      // Cleanup WebSocket connections when the component is unfocused
      return () => {
        Object.values(wsRefs.current).forEach((ws) => {
          if (ws) ws.close();
        });
      };
    }, [connectWebSockets])
  );

  const handleNavigateCreateCommunity = () => {
    router.navigate("CreateCommunity");
  };

  // Get the last message for a given community ID
  const getLastMessage = (communityId: string) => {
    const communityMessages = messages[communityId] || [];
    return communityMessages.length > 0
      ? communityMessages[communityMessages.length - 1]
      : null;
  };

  // Sort communities by the time of the latest message
  const sortedMyCommunities = useMemo(() => {
    return myCommunities
      .map((community) => ({
        ...community,
        lastMessageTime:
          getLastMessage(community.id)?.sent_at || new Date(0).toISOString(),
      }))
      .sort((a, b) =>
        moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
      );
  }, [myCommunities, messages]);

  const sortedGlobalCommunities = useMemo(() => {
    return globalCommunities
      .filter(
        (community) =>
          !myCommunities.some((myComm) => myComm.id === community.id)
      ) // Filter out user's communities
      .map((community) => ({
        ...community,
        lastMessageTime:
          getLastMessage(community.id)?.sent_at || new Date(0).toISOString(),
      }))
      .sort((a, b) =>
        moment(b.lastMessageTime).diff(moment(a.lastMessageTime))
      );
  }, [globalCommunities, myCommunities, messages]);

  const filteredMyCommunities = useMemo(() => {
    if (!searchQuery) return sortedMyCommunities;
    return sortedMyCommunities.filter((community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sortedMyCommunities]);

  const filteredGlobalCommunities = useMemo(() => {
    if (!searchQuery) return sortedGlobalCommunities;
    return sortedGlobalCommunities.filter((community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sortedGlobalCommunities]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCommunityPress = (community: Community) => {
    router.navigate({
      pathname: "ChatScreen",
      params: { communityId: community.id, name: community.name },
    });
  };

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
    searchQuery &&
    filteredMyCommunities.length === 0 &&
    filteredGlobalCommunities.length === 0;

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </View>

      {loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
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
          <Text
            style={[styles.noResultsText, { color: themeColors.placeholder }]}
          >
            No results found
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {searchQuery ? (
            <View>
              <CommunityList
                title="My Communities"
                data={filteredMyCommunities}
                onCommunityPress={handleCommunityPress}
                showLastMessage
                getLastMessage={getLastMessage}
              />
              <CommunityList
                title="Global Communities"
                data={filteredGlobalCommunities}
                onCommunityPress={handleCommunityPress}
              />
            </View>
          ) : (
            <CommunityList
              title=""
              data={sortedMyCommunities}
              onCommunityPress={handleCommunityPress}
              showLastMessage
              getLastMessage={getLastMessage}
            />
          )}
          <TouchableOpacity
            style={styles.addButton}
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
