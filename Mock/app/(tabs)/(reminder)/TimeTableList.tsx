import React, { memo, useCallback, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Share,
  RefreshControl,
} from "react-native";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../components/AuthContext";
import {
  createPeriod,
  createTimetable,
  getTimetables,
  getUserDetails,
} from "../../../TimelineApiCalls";
import Colors from "../../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../../constants";
import Icon from "react-native-vector-icons/Ionicons";
import ErrorMessage from "../../../components/ErrorMessage";
import { router } from "expo-router";
import GameButton from "../../../components/GameButton";
import { Skeleton } from "moti/skeleton";
import { User } from "../../../components/types";
import { FontAwesome6 } from "@expo/vector-icons";

interface Timetable {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  join_link?: string;
}

const TimetableListPage: React.FC = memo(() => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    data: timetables,
    isLoading,
    isError: timetableError,
    refetch: refetchTimetables,
  } = useQuery<Timetable[], Error>({
    queryKey: [userToken, "timetables"],
    queryFn: () => getTimetables(userToken?.token!),
    refetchOnWindowFocus: true,
  });

  const userQueries = useQueries({
    queries: useMemo(
      () =>
        (timetables || []).map((timetable) => ({
          queryKey: [userToken, "user", timetable.created_by],
          queryFn: () =>
            getUserDetails(timetable.created_by, userToken?.token!),
          enabled: !!timetables,
        })),
      [timetables, userToken]
    ),
  });

  useEffect(() => {
    if (timetableError) {
      setErrorMessage("An error occurred while fetching timetables");
    } else {
      setErrorMessage(null);
    }
  }, [timetableError]);

  const handleShare = useCallback(async (joinLink: string | undefined) => {
    try {
      await Share.share({
        message: `Sharing timetable: ${joinLink}`,
      });
    } catch (error) {
      console.error("Error sharing timetable:", error);
    }
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: rV(15),
          paddingBottom: rV(70),
        },
        timetableItem: {
          backgroundColor: themeColors.background,
          padding: rV(10),
          marginVertical: rV(5),
          borderRadius: rS(8),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          elevation: 3,
          flexDirection: "row",
          alignItems: "center",
        },
        title: {
          fontSize: rS(16),
          fontWeight: "bold",
          color: themeColors.text,
          flex: 1,
        },
        description: {
          fontSize: rS(12),
          color: themeColors.text,
          flex: 1,
        },
        subText: {
          fontSize: rS(10),
          color: themeColors.textSecondary,
        },
        shareButton: {
          marginRight: rS(5),
        },
        editButton: {
          marginRight: rS(5),
        },
        buttonContainer: {
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 10,
        },
        createButton: {
          position: "absolute",
          right: rS(20),
          bottom: rV(75),
          width: 60,
          height: 60,
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: themeColors.buttonBackground,
        },
        createButtonText: {
          color: themeColors.text,
          textAlign: "center",
          fontSize: rS(16),
        },
        loadingText: {
          textAlign: "center",
          marginTop: rV(20),
          fontSize: rS(18),
          color: themeColors.textSecondary,
        },
        errorText: {
          textAlign: "center",
          marginTop: rV(20),
          fontSize: rS(18),
          color: themeColors.errorText,
        },
        skeletonContainer: {
          padding: rV(15),
          flex: 1,
          backgroundColor: themeColors.background,
        },
        skeletonItem: {
          backgroundColor: themeColors.tint,
          marginVertical: rV(5),
          borderRadius: rS(8),
        },
      }),
    [themeColors]
  );

  const renderSkeletonItem = useCallback(
    () => (
      <View style={styles.skeletonItem}>
        <Skeleton
          colorMode={colorScheme === "dark" ? "dark" : "light"}
          height={rV(80)}
          width={"100%"}
        />
      </View>
    ),
    [styles, colorScheme]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Timetable; index: number }) => {
      const user = userQueries[index].data as User | undefined;

      return (
        <TouchableOpacity
          onPressIn={() =>
            router.push({
              pathname: "TimeTableDetails",
              params: { timetableId: item.id },
            })
          }
          style={styles.timetableItem}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View
              style={{ justifyContent: "space-between", flexDirection: "row" }}
            >
              {user && (
                <Text style={styles.subText}>
                  Created by: {`${user.first_name} ${user.last_name}`}
                </Text>
              )}
              <Text style={[styles.subText, { marginRight: -50 }]}>
                {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPressIn={() => handleShare(item.join_link)}
              style={styles.shareButton}
            >
              <Icon
                name="share-social-outline"
                size={20}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPressIn={() => console.log("Edit timetable", item.id)}
              style={styles.editButton}
            >
              <Icon name="create-outline" size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, themeColors, handleShare, userQueries]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchTimetables().then(() => setRefreshing(false));
  }, [refetchTimetables]);

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(6)].map((_, index) => (
          <React.Fragment key={index}>{renderSkeletonItem()}</React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={timetables}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint, themeColors.text]}
            progressBackgroundColor={themeColors.background}
          />
        }
      />
      <GameButton
        style={styles.createButton}
        onPress={() => router.push("TimeTable")}
      >
        <FontAwesome6 name="add" size={SIZES.xLarge} color={themeColors.text} />
      </GameButton>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
});

export default TimetableListPage;
