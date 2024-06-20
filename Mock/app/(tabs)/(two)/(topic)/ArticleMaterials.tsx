import React, { useState, useEffect } from "react";
import { View, Linking } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import Articles from "../../../../components/Articles";
import { Topic, ArticleMaterial } from "../../../../components/types";

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
        `${ApiUrl}/api/topic/materials/${parsedTopic.id}/`,
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
  const handleArticlePress = (articleMaterial: ArticleMaterial) => {
    if (articleMaterial.link) {
      Linking.openURL(articleMaterial.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this articleMaterial");
    }
  };

  return (
    <View>
      <Articles
        articleMaterials={selectedArticleMaterials}
        handleArticlePress={handleArticlePress}
      />
    </View>
  );
};

export default ArticleMaterials;
