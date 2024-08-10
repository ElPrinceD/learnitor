import React, { useState, useEffect, useCallback } from "react";
import { View, Linking, ScrollView, RefreshControl } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import { Topic, BookMaterial } from "../../../../components/types";
import Books from "../../../../components/Books";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";

interface BookMaterialsProps {
  topic: Topic[];
  bookMaterials: BookMaterial[];
}

const BookMaterials: React.FC<BookMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  const {
    status: selectedBookMaterialsStatus,
    data: selectedBookMaterials,
    error: selectedBookMaterialsError,
    refetch: refetchSelectedBookMaterials,
  } = useQuery({
    queryKey: ["topicMaterials", parsedTopic.id],
    queryFn: () => fetchTopicMaterials(parsedTopic.id, userToken?.token),

    enabled: !!parsedTopic.id,
  });

  useEffect(() => {
    if (selectedBookMaterialsStatus) {
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

  const handleBookPress = (bookMaterial: BookMaterial) => {
    if (bookMaterial.link) {
      Linking.openURL(bookMaterial.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this bookMaterial");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Books
          bookMaterials={selectedBookMaterials || []}
          handleBookPress={handleBookPress}
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

export default BookMaterials;
