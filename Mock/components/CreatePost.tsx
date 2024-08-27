import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { createPost } from "../CommunityApiCalls"; // API call for creating a post
import { useAuth } from "../components/AuthContext";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { userToken } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const createPostMutation = useMutation({
    mutationFn: createPost, // The function that triggers the mutation
    onSuccess: () => {
      // Navigate to community feed or reset form on success
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      console.error("Error creating post:", error.message);
    },
  });

  const handleCreatePost = () => {
    if (title && content) {
      createPostMutation.mutate({ title, content, token: userToken?.token });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter post title"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>Content</Text>
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreatePost}
        disabled={createPostMutation.isLoading}
      >
        {createPostMutation.isLoading ? (
          <ActivityIndicator color={themeColors.text} />
        ) : (
          <Text style={styles.buttonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  contentInput: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreatePost;
