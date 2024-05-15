import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import Articles from "@/components/Articles";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}
interface ArticleMaterial {
  name: string;
  type: "journal"; // Define the types of materials
  link: string;
}

interface ArticleMaterialsProps {
  topic: Topic[];
  articleMaterials: ArticleMaterial[];
}

const ArticleMaterials: React.FC<ArticleMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [selectedArticleMaterials, setSelectedArticleMaterials] = useState<
    ArticleMaterial[]
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
      setSelectedArticleMaterials(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <View>
      <Articles articleMaterials={selectedArticleMaterials} />
    </View>
  );
};

export default ArticleMaterials;
