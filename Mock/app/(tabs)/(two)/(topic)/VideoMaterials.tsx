import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, RefreshControl, ScrollView, Text, StyleSheet, useColorScheme } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../../components/AuthContext";
import Videos from "../../../../components/Videos";

import { Topic, Material } from "../../../../components/types";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import ErrorMessage from "../../../../components/ErrorMessage";
import { queryClient } from "../../../../QueryClient";
import Colors from "../../../../constants/Colors";
import { SIZES, rMS, rV } from "../../../../constants";

const VideoMaterials: React.FC = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic | null =
    typeof topic === "string" ? JSON.parse(topic) : topic || null;

  const {
    status: selectedTopicMaterialsStatus,
    data: selectedTopicMaterials,
    error: selectedTopicMaterialsError,
    refetch: refetchSelectedTopicMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic?.id], // Use optional chaining to avoid accessing 'id' if parsedTopic is undefined
    queryFn: () =>
      parsedTopic
        ? fetchTopicMaterials(parsedTopic.id, userToken?.token)
        : null,
    enabled: !!parsedTopic?.id, // Ensure query only runs when parsedTopic and id are valid
  });

  useEffect(() => {
    if (selectedTopicMaterialsStatus === "error") {
      setErrorMessage(selectedTopicMaterialsError?.message);
    }
  }, [selectedTopicMaterialsStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchSelectedTopicMaterials();
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, refetchSelectedTopicMaterials]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Filter videos from materials
  const videos = useMemo(() => {
    const materials = selectedTopicMaterials || [];
    return materials.filter((material: any) => material.type === "video");
  }, [selectedTopicMaterials]);

  const hasVideos = videos && videos.length > 0;

  const styles = StyleSheet.create({
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(30),
      minHeight: 300,
    },
    emptyText: {
      fontSize: SIZES.large,
      fontWeight: "600",
      color: themeColors.text,
      textAlign: "center",
      lineHeight: rV(28),
    },
    emptySubtext: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(10),
      lineHeight: rV(22),
    },
  });

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <TopicInformation topic={parsedTopic} /> */}
        {!hasVideos && selectedTopicMaterialsStatus === "success" ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              🎥 Stay tuned! Videos will be available soon.
            </Text>
            <Text style={styles.emptySubtext}>
              We're working on providing the best videos for this topic!
            </Text>
          </View>
        ) : (
          <Videos videoMaterials={selectedTopicMaterials || []} />
        )}
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default VideoMaterials;
