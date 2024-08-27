import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../CommunityApiCalls"; // API call for getting posts

const CommunityFeed = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Update the useQuery hook to use an object with queryKey and queryFn
  const { data: posts, status, error } = useQuery({
    queryKey: ["communityPosts"], // Query key must be an array
    queryFn: getPosts,
  });

  if (status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.text} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load posts: {error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.postContainer}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postContent}>{item.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity>
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  postContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  postContent: {
    fontSize: 16,
    marginVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionText: {
    color: "#007bff",
  },
});

export default CommunityFeed;
