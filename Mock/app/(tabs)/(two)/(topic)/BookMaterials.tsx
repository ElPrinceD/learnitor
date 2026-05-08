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
import { BookOpen } from "lucide-react-native";

import { useAuth } from "../../../../components/AuthContext";
import { Topic, BookMaterial } from "../../../../components/types";
import Books from "../../../../components/Books";
import { useQuery } from "@tanstack/react-query";
import { fetchTopicMaterials } from "../../../../services/CoursesApiCalls";
import { queryClient } from "../../../../QueryClient";
import ErrorMessage from "../../../../components/ErrorMessage";
import InAppBrowserLink from "../../../../components/InAppBrowserLink";
import Colors from "../../../../constants/Colors";
import { rMS, rV } from "../../../../constants";

interface BookMaterialsProps {
  topic: Topic[];
  bookMaterials: BookMaterial[];
}

const BookMaterials: React.FC<BookMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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

  // Filter books from materials
  const books = useMemo(() => {
    const materials = selectedBookMaterials || [];
    return materials.filter((material: any) => material.type === "book");
  }, [selectedBookMaterials]);

  const hasBooks = books && books.length > 0;

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
        {!hasBooks && selectedBookMaterialsStatus === "success" ? (
          <View style={styles(themeColors).emptyContainer}>
            <View style={styles(themeColors).emptyIconContainer}>
              <BookOpen size={28} color={themeColors.textSecondary} />
            </View>
            <Text style={styles(themeColors).emptyText}>
              No books yet
            </Text>
            <Text style={styles(themeColors).emptySubtext}>
              Books for this topic will be available soon!
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

export default BookMaterials;
