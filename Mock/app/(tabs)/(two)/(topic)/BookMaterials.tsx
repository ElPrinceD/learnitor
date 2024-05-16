import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import TopicInformation from "@/components/TopicInformation";
import Books from "@/components/Books";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}
interface BookMaterial {
  name: string;
  type: "book"; // Define the types of materials
  link: string;
}

interface BookMaterialsProps {
  topic: Topic[];
  bookMaterials: BookMaterial[];
}

const BookMaterials: React.FC<BookMaterialsProps> = () => {
  const { topic } = useGlobalSearchParams();
  const { userToken } = useAuth();
  const [selectedBookMaterials, setSelectedBookMaterials] = useState<
    BookMaterial[]
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
      setSelectedBookMaterials(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <View>
      <Books bookMaterials={selectedBookMaterials} />
    </View>
  );
};

export default BookMaterials;
