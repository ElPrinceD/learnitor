import React, { useState, useEffect, useCallback } from "react";
import { View, Linking, ScrollView, RefreshControl } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import Articles from "../../../../components/Articles";
import { Topic, ArticleMaterial } from "../../../../components/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";

interface ArticleMaterialsProps {
  topic: Topic[];
  articleMaterials: ArticleMaterial[];
}

const ArticleMaterials: React.FC<ArticleMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic | null =
    typeof topic === "string" ? JSON.parse(topic) : topic || null;

  const {
    status: selectedArticleMaterialsStatus,
    data: selectedArticleMaterials,
    error: selectedArticleMaterialsError,
    refetch: refetchSelectedArticleMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic?.id],
    queryFn: () =>
      parsedTopic
        ? fetchTopicMaterials(parsedTopic.id, userToken?.token)
        : null,

    enabled: !!parsedTopic?.id,
  });

  useEffect(() => {
    if (selectedArticleMaterialsStatus === "error") {
      setErrorMessage(
        selectedArticleMaterialsError?.message || "An error occurred"
      );
    }
  }, [selectedArticleMaterialsStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchSelectedArticleMaterials();
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, refetchSelectedArticleMaterials]);

  const handleArticlePress = (articleMaterial: ArticleMaterial) => {
    if (articleMaterial.link) {
      Linking.openURL(articleMaterial.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this articleMaterial");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Articles
          articleMaterials={selectedArticleMaterials || []}
          handleArticlePress={handleArticlePress}
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

export default ArticleMaterials;
