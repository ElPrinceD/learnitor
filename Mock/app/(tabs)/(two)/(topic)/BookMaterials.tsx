import React, { useState, useEffect } from "react";
import { View, Linking } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import axios from "axios";

import ApiUrl from "../../../../config";

import { useAuth } from "../../../../components/AuthContext";
import TopicInformation from "@/components/TopicInformation";
import Books from "@/components/Books";
import { Topic, BookMaterial } from "../../../../components/types";

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
  const handleBookPress = (bookMaterial: BookMaterial) => {
    if (bookMaterial.link) {
      Linking.openURL(bookMaterial.link).catch((error) =>
        console.error("Error opening link:", error)
      );
    } else {
      console.log("No link available for this bookMaterial");
    }
  };

  return (
    <View>
      <Books
        bookMaterials={selectedBookMaterials}
        handleBookPress={handleBookPress}
      />
    </View>
  );
};

export default BookMaterials;
