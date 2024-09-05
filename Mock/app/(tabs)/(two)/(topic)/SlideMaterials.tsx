import React, { useState, useEffect, useCallback } from "react";
import { View, Linking, ScrollView, RefreshControl } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import { Topic, SlideMaterial } from "../../../../components/types";
import Slides from "../../../../components/Slides"; // Import the new Slides component
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";

interface SlideMaterialsProps {
  topic: Topic[];
  slideMaterials: SlideMaterial[];
}

const SlideMaterials: React.FC<SlideMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic | null =
    typeof topic === "string" ? JSON.parse(topic) : topic || null;

  const {
    status: selectedSlideMaterialsStatus,
    data: selectedSlideMaterials,
    error: selectedSlideMaterialsError,
    refetch: refetchSelectedSlideMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic?.id],
    queryFn: () =>
      parsedTopic
        ? fetchTopicMaterials(parsedTopic.id, userToken?.token)
        : null,
    enabled: !!parsedTopic?.id,
  });

  useEffect(() => {
    if (selectedSlideMaterialsStatus === "error") {
      setErrorMessage(
        selectedSlideMaterialsError?.message || "An error occurred"
      );
    }
  }, [selectedSlideMaterialsStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchSelectedSlideMaterials();
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, refetchSelectedSlideMaterials]);

  const handleSlidePress = (slideMaterial: SlideMaterial) => {
    if (slideMaterial.link) {
      Linking.openURL(slideMaterial.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this slideMaterial");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Slides
          slideMaterials={selectedSlideMaterials || []}
          handleSlidePress={handleSlidePress}
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

export default SlideMaterials;
