import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getCommunityTimetable } from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useCache } from "../../contexts/CacheContext";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants";
import { router } from "expo-router";

type RouteParams = {
  communityId: string;
  communityName?: string;
};

const AllEventsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { communityId, communityName } = route.params as RouteParams;
  const { userToken } = useAuth();
  const { getItem, setItem } = useCache();

  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const getCachedData = useCallback(
    async (key: string) => {
      const data = await getItem(key);
      return data ? JSON.parse(data) : null;
    },
    [getItem]
  );

  const setCachedData = useCallback(
    async (key: string, data: any) => {
      await setItem(key, JSON.stringify(data));
    },
    [setItem]
  );

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userToken?.token) {
        throw new Error("User not authenticated");
      }

      const cachedData = await getCachedData(`timetable_${communityId}`);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        setTimetable(cachedData);
        setLoading(false);
        return;
      }

      const eventsData = await getCommunityTimetable(
        communityId,
        userToken.token
      );
      console.log("Fetched events data:", eventsData);

      const processedData = Array.isArray(eventsData) ? eventsData : [];
      setTimetable(processedData);
      await setCachedData(`timetable_${communityId}`, processedData);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [communityId, userToken?.token, getCachedData, setCachedData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await setItem(`timetable_${communityId}`, "");
      await fetchEvents();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvents, setItem, communityId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    navigation.setOptions({
      title: `Events - ${communityName || "Community"}`,
      headerRight: () => (
        <TouchableOpacity
          onPress={onRefresh}
          style={{ marginRight: 16, padding: 8 }}
        >
          <Ionicons name="refresh" size={24} color={themeColors.tint} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, communityName, themeColors.tint, onRefresh]);

  const handleEventPress = useCallback((item: any) => {
    router.push({
      pathname: "TimeTableDetails",
      params: {
        timetableId: item.id,
        isUserLeader: "false", // You might want to determine this based on user role
      },
    });
  }, []);

  const renderEventCard = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[
          styles.eventCard,
          {
            backgroundColor: themeColors.secondaryBackground,
            borderColor: themeColors.tint + "20",
          },
        ]}
        onPress={() => handleEventPress(item)}
      >
        <View style={styles.eventHeader}>
          <View
            style={[
              styles.eventIcon,
              { backgroundColor: themeColors.tint + "20" },
            ]}
          >
            <Ionicons name="calendar" size={20} color={themeColors.tint} />
          </View>
          <View style={styles.eventInfo}>
            <Text
              style={[styles.eventTitle, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.eventDescription,
                { color: themeColors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.eventStats}>
            <Ionicons
              name="time-outline"
              size={14}
              color={themeColors.textSecondary}
            />
            <Text
              style={[
                styles.eventStatText,
                { color: themeColors.textSecondary },
              ]}
            >
              {item.periods?.length || 0} periods
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={themeColors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    ),
    [themeColors, handleEventPress]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name="calendar-outline"
          size={64}
          color={themeColors.textSecondary}
        />
        <Text
          style={[styles.emptyStateText, { color: themeColors.textSecondary }]}
        >
          No events found
        </Text>
        <Text
          style={[
            styles.emptyStateSubtext,
            { color: themeColors.textSecondary },
          ]}
        >
          This community doesn't have any scheduled events yet
        </Text>
      </View>
    ),
    [themeColors]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      flex: 1,
      padding: rV(16),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: rV(20),
      paddingHorizontal: rV(16),
      paddingTop: rV(16),
    },
    headerTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    eventCount: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      backgroundColor: themeColors.tint + "20",
      paddingHorizontal: rS(12),
      paddingVertical: rV(6),
      borderRadius: rMS(16),
    },
    eventsList: {
      paddingHorizontal: rV(16),
      paddingBottom: rV(20),
    },
    eventCard: {
      borderRadius: rMS(12),
      padding: rV(16),
      marginBottom: rV(12),
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    eventHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: rV(12),
    },
    eventIcon: {
      width: rMS(40),
      height: rMS(40),
      borderRadius: rMS(20),
      alignItems: "center",
      justifyContent: "center",
      marginRight: rS(12),
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: SIZES.medium,
      fontWeight: "600",
      marginBottom: rV(4),
    },
    eventDescription: {
      fontSize: SIZES.small,
      lineHeight: 18,
    },
    eventFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    eventStats: {
      flexDirection: "row",
      alignItems: "center",
    },
    eventStatText: {
      fontSize: SIZES.xSmall,
      marginLeft: rS(4),
      fontWeight: "500",
    },
    emptyStateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: rV(60),
      paddingHorizontal: rS(20),
    },
    emptyStateText: {
      fontSize: SIZES.large,
      fontWeight: "600",
      marginTop: rV(16),
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: SIZES.medium,
      marginTop: rV(8),
      textAlign: "center",
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rS(20),
    },
    errorText: {
      fontSize: SIZES.medium,
      color: themeColors.errorText,
      textAlign: "center",
      marginTop: rV(12),
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.errorText, { color: themeColors.text }]}>
          Loading events...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={themeColors.errorText}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchEvents}
          style={{
            marginTop: rV(16),
            paddingHorizontal: rS(20),
            paddingVertical: rV(10),
            backgroundColor: themeColors.tint,
            borderRadius: rMS(8),
          }}
        >
          <Text style={{ color: themeColors.background, fontWeight: "600" }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={timetable}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>All Events</Text>
            <View style={styles.eventCount}>
              <Text style={{ color: themeColors.textSecondary }}>
                {timetable.length} event{timetable.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsList}
      />
    </View>
  );
};

export default AllEventsScreen;
