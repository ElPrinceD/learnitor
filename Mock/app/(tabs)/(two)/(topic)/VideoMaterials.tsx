import React, { useState, useCallback, useEffect } from "react";
import { View, Linking, RefreshControl, ScrollView } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../../components/AuthContext";
import Videos from "../../../../components/Videos";

import { Topic, Material } from "../../../../components/types";
import { fetchTopicMaterials } from "../../../../CoursesApiCalls";
import ErrorMessage from "../../../../components/ErrorMessage";
import { queryClient } from "../../../../QueryClient";

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

  const handleVideoPress = (material: Material) => {
    if (material.link) {
      Linking.openURL(material.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this material");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <TopicInformation topic={parsedTopic} /> */}
        <Videos
          videoMaterials={selectedTopicMaterials || []}
          handleVideoPress={handleVideoPress}
        />
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />
    </View>
  );
};

export default VideoMaterials;
