import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../config";

import { useAuth } from "../../../components/AuthContext";
import TopicInformation from "@/components/TopicInformation";
import Materials from "@/components/Materials";
interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}
interface Material {
  name: string;
  type: "video" | "book" | "journal"; // Define the types of materials
  link: string;
}

interface TopicProps {
  topic: Topic[];
  topicMaterials: Material[];
}

const Topic: React.FC<TopicProps> = () => {
  const { topic } = useLocalSearchParams();
  const { userToken } = useAuth();
  const [selectedTopicMaterials, setSelectedTopicMaterials] = useState<
    Material[]
  >([]);

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;
  console.log("That topic:", topic);

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
      <TopicInformation topic={parsedTopic} />

      <Materials topicMaterials={selectedTopicMaterials} />
    </View>
  );
};

export default Topic;
