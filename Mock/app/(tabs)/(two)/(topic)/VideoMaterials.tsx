import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  RefreshControl,
  ScrollView,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Video as VideoIcon } from "lucide-react-native";

import { useAuth } from "../../../../components/AuthContext";
import Videos from "../../../../components/Videos";

import { Topic, Material } from "../../../../components/types";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import ErrorMessage from "../../../../components/ErrorMessage";
import { queryClient } from "../../../../QueryClient";
import Colors from "../../../../constants/Colors";
import { rMS, rV, useShadows } from "../../../../constants";

const VideoMaterials: React.FC = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const parsedTopic: Topic | null =
    typeof topic === "string" ? JSON.parse(topic) : topic || null;

  const {
    status: selectedTopicMaterialsStatus,
    data: selectedTopicMaterials,
    error: selectedTopicMaterialsError,
    refetch: refetchSelectedTopicMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic?.id],
    queryFn: () =>
      parsedTopic
        ? fetchTopicMaterials(parsedTopic.id, userToken?.token)
        : null,
    enabled: !!parsedTopic?.id,
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

  // Filter videos from materials
  const videos = useMemo(() => {
    const materials = selectedTopicMaterials || [];
    return materials.filter((material: any) => material.type === "video");
  }, [selectedTopicMaterials]);

  const hasVideos = videos && videos.length > 0;
  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
            colors={[themeColors.tint]}
            progressBackgroundColor={themeColors.background}
          />
        }
      >
        {!hasVideos && selectedTopicMaterialsStatus === "success" ? (
          <View style={styles(themeColors).emptyContainer}>
            <View style={styles(themeColors).emptyIconContainer}>
              <VideoIcon size={28} color={themeColors.textSecondary} />
            </View>
            <Text style={styles(themeColors).emptyText}>
              No videos yet
            </Text>
            <Text style={styles(themeColors).emptySubtext}>
              Videos for this topic will be available soon!
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

const styles = (themeColors: any) =>
  StyleSheet.create({
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(30),
      minHeight: 300,
    },
    emptyIconContainer: {
      width: rMS(56),
      height: rMS(56),
      borderRadius: rMS(28),
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(12),
    },
    emptyText: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: themeColors.text,
      textAlign: "center",
      letterSpacing: -0.2,
    },
    emptySubtext: {
      fontSize: rMS(12),
      fontWeight: "600",
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(6),
      lineHeight: rMS(18),
    },
  });

export default VideoMaterials;
