import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import { Topic, BookMaterial } from "../../../../components/types";
import Books from "../../../../components/Books";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";
import InAppBrowserLink from "../../../../components/InAppBrowserLink";

interface BookMaterialsProps {
  topic: Topic[];
  bookMaterials: BookMaterial[];
}

const BookMaterials: React.FC<BookMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic | null =
    typeof topic === "string" ? JSON.parse(topic) : topic || null;
  const {
    status: selectedBookMaterialsStatus,
    data: selectedBookMaterials,
    error: selectedBookMaterialsError,
    refetch: refetchSelectedBookMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic?.id],
    queryFn: () =>
      parsedTopic
        ? fetchTopicMaterials(parsedTopic?.id, userToken?.token)
        : null,

    enabled: !!parsedTopic?.id,
  });

  useEffect(() => {
    if (selectedBookMaterialsStatus === "error") {
      setErrorMessage(
        selectedBookMaterialsError?.message || "An error occurred"
      );
    }
  }, [selectedBookMaterialsStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["courses", userToken?.token],
      });
      refetchSelectedBookMaterials();
    } finally {
      setRefreshing(false);
      setErrorMessage(null);
    }
  }, [queryClient, userToken?.token, refetchSelectedBookMaterials]);

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Books bookMaterials={selectedBookMaterials || []} />
      </ScrollView>
      <ErrorMessage
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={handleDismissError}
      />
    </View>
  );
};

export default BookMaterials;
