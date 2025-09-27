import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { rMS, rS, rV, SIZES } from "../../constants";
import AppImage from "../../components/AppImage";
import FullScreenImageViewer from "../../components/FullScreenImageViewer";
import { getCommunityMessages } from "../../services/CommunityApiCalls";
import { useAuth } from "../../components/AuthContext";
import { useCache } from "../../contexts/CacheContext";
import { useAlert } from "../../contexts/AlertContext";

type RouteParams = {
  id: string;
  images?: string[] | string;
};

const CommunityImagesScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const { userToken } = useAuth();
  const { getItem, setItem } = useCache();
  const { showErrorAlert } = useAlert();

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Fetch fresh images from community messages
  const fetchImages = useCallback(
    async (isRefresh = false) => {
      if (!userToken?.token) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Try to get cached data first
        const cachedImages = await getItem(`images_${id}`);
        if (cachedImages && !isRefresh) {
          setImages(JSON.parse(cachedImages));
          setLoading(false);
        }

        // Fetch fresh data
        const messages = await getCommunityMessages(id, userToken.token);
        const imageUrls = messages
          .filter((msg) => msg.image)
          .map((msg) => msg.image)
          .filter((url): url is string => url !== undefined && url !== null);

        setImages(imageUrls);
        await setItem(`images_${id}`, JSON.stringify(imageUrls));
      } catch (err: any) {
        console.error("Error fetching images:", err);
        setError(err.message || "Failed to load images");
        showErrorAlert(
          "Error",
          "Failed to load community images. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, userToken?.token, getItem, setItem, showErrorAlert]
  );

  // Fetch fresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchImages();
    }, [fetchImages])
  );

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        setCurrentImageIndex(index);
        setIsVisible(true);
      }}
      style={styles.imageContainer}
    >
      <AppImage uri={item} style={styles.image} />
      <View style={styles.imageOverlay}>
        <Ionicons name="eye" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="images-outline"
        size={64}
        color={themeColors.textSecondary}
      />
      <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
        No Images Yet
      </Text>
      <Text
        style={[
          styles.emptyStateSubtitle,
          { color: themeColors.textSecondary },
        ]}
      >
        Images shared in this community will appear here
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: themeColors.text }]}>
        Community Photos
      </Text>
      <Text
        style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
      >
        {images.length} {images.length === 1 ? "photo" : "photos"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text
            style={[styles.loadingText, { color: themeColors.textSecondary }]}
          >
            Loading photos...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={themeColors.errorText}
          />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Failed to Load
          </Text>
          <Text
            style={[styles.errorSubtitle, { color: themeColors.textSecondary }]}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchImages()}
            style={[styles.retryButton, { backgroundColor: themeColors.tint }]}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => String(index)}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchImages(true)}
            tintColor={themeColors.tint}
            colors={[themeColors.tint]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <FullScreenImageViewer
        visible={visible}
        images={images}
        currentIndex={currentImageIndex}
        onRequestClose={() => setIsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: rS(16),
    paddingBottom: rV(100),
  },
  header: {
    paddingVertical: rV(20),
    paddingHorizontal: rS(4),
    marginBottom: rV(10),
  },
  headerTitle: {
    fontSize: rMS(24),
    fontWeight: "bold",
    marginBottom: rV(4),
  },
  headerSubtitle: {
    fontSize: rMS(14),
    fontWeight: "500",
  },
  imageContainer: {
    flex: 1,
    margin: rS(4),
    borderRadius: rMS(12),
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: rMS(12),
  },
  imageOverlay: {
    position: "absolute",
    top: rV(8),
    right: rS(8),
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: rMS(12),
    padding: rS(6),
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: rV(60),
    paddingHorizontal: rS(40),
  },
  emptyStateTitle: {
    fontSize: rMS(20),
    fontWeight: "bold",
    marginTop: rV(16),
    marginBottom: rV(8),
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: rMS(14),
    textAlign: "center",
    lineHeight: rV(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: rV(60),
  },
  loadingText: {
    fontSize: rMS(16),
    marginTop: rV(16),
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: rV(60),
    paddingHorizontal: rS(40),
  },
  errorTitle: {
    fontSize: rMS(20),
    fontWeight: "bold",
    marginTop: rV(16),
    marginBottom: rV(8),
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: rMS(14),
    textAlign: "center",
    lineHeight: rV(20),
    marginBottom: rV(24),
  },
  retryButton: {
    paddingHorizontal: rS(24),
    paddingVertical: rV(12),
    borderRadius: rMS(8),
  },
  retryButtonText: {
    color: "white",
    fontSize: rMS(14),
    fontWeight: "600",
  },
});

export default CommunityImagesScreen;
