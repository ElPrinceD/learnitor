import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { FileText } from "lucide-react-native";

import { useAuth } from "../../../../components/AuthContext";
import Articles from "../../../../components/Articles";
import { Topic, ArticleMaterial } from "../../../../components/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";
import Colors from "../../../../constants/Colors";
import { rMS, rV } from "../../../../constants";

interface ArticleMaterialsProps {
  topic: Topic[];
  articleMaterials: ArticleMaterial[];
}

const ArticleMaterials: React.FC<ArticleMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  // Filter articles from materials
  const articles = useMemo(() => {
    const materials = selectedArticleMaterials || [];
    return materials.filter((material: any) => material.type === "journal");
  }, [selectedArticleMaterials]);

  const hasArticles = articles && articles.length > 0;

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
        {!hasArticles && selectedArticleMaterialsStatus === "success" ? (
          <View style={styles(themeColors).emptyContainer}>
            <View style={styles(themeColors).emptyIconContainer}>
              <FileText size={28} color={themeColors.textSecondary} />
            </View>
            <Text style={styles(themeColors).emptyText}>
              No articles yet
            </Text>
            <Text style={styles(themeColors).emptySubtext}>
              Articles for this topic will be available soon!
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

export default ArticleMaterials;
