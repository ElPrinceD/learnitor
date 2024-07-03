import React, { useState, useEffect, useCallback } from "react";
import { View, Linking, RefreshControl, ScrollView } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import Videos from "../../../../components/Videos";

import { Topic, Material } from "../../../../components/types";

interface VideoMaterialsProps {
  topic: Topic[];
  topicMaterials: Material[];
}

const VideoMaterials: React.FC<VideoMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [selectedTopicMaterials, setSelectedTopicMaterials] = useState<
    Material[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  useEffect(() => {
    fetchData();
  }, [parsedTopic.id]);
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}/api/topic/materials/${parsedTopic.id}/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setSelectedTopicMaterials(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleVideoPress = (material: Material) => {
    if (material.link) {
      Linking.openURL(material.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this material");
    }
  };
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* <TopicInformation topic={parsedTopic} /> */}
      <Videos
        videoMaterials={selectedTopicMaterials}
        handleVideoPress={handleVideoPress}
      />
    </ScrollView>
  );
};

export default VideoMaterials;
