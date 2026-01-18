import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, Text, StyleSheet, useColorScheme } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import { Topic, BookMaterial } from "../../../../components/types";
import Books from "../../../../components/Books";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";
import InAppBrowserLink from "../../../../components/InAppBrowserLink";
import Colors from "../../../../constants/Colors";
import { SIZES, rMS, rV } from "../../../../constants";

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

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Filter books from materials
  const books = useMemo(() => {
    const materials = selectedBookMaterials || [];
    return materials.filter((material: any) => material.type === "book");
  }, [selectedBookMaterials]);

  const hasBooks = books && books.length > 0;

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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!hasBooks && selectedBookMaterialsStatus === "success" ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
            📚 Stay tuned! Books will be available soon.
            </Text>
            <Text style={styles.emptySubtext}>
              We're working on providing the best books for this topic!
            </Text>
          </View>
        ) : (
          <Books bookMaterials={selectedBookMaterials || []} />
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

export default BookMaterials;
