import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import TopicInformation from "@/components/TopicInformation";
import Videos from "@/components/Videos";

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

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  useEffect(() => {
    fetchData();
  }, [parsedTopic.id]);
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/topic/materials/${parsedTopic.id}/`,
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

  return (
    <View>
      {/* <TopicInformation topic={parsedTopic} /> */}

      <Videos videoMaterials={selectedTopicMaterials} />
    </View>
  );
};

export default VideoMaterials;
