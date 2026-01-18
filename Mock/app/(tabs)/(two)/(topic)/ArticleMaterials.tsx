import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, Text, StyleSheet, useColorScheme } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import { useAuth } from "../../../../components/AuthContext";
import Articles from "../../../../components/Articles";
import { Topic, ArticleMaterial } from "../../../../components/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";
import Colors from "../../../../constants/Colors";
import { SIZES, rMS, rV } from "../../../../constants";

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

  const handleDismissError = useCallback(() => setErrorMessage(null), []);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Filter articles from materials
  const articles = useMemo(() => {
    const materials = selectedArticleMaterials || [];
    return materials.filter((material: any) => material.type === "journal");
  }, [selectedArticleMaterials]);

  const hasArticles = articles && articles.length > 0;

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
        {!hasArticles && selectedArticleMaterialsStatus === "success" ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              📖 Stay tuned! Articles will be available soon.
            </Text>
            <Text style={styles.emptySubtext}>
              We're working on providing the best articles for this topic!
            </Text>
          </View>
        ) : (
          <Articles articleMaterials={selectedArticleMaterials || []} />
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

export default ArticleMaterials;
