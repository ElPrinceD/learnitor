import { View, StyleSheet, Text, FlatList, Dimensions } from "react-native";
import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Course, Topic } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ApiUrl from "../../config";
import TimelineCategoryItem from "../../components/TimelineCategoryItem";

const GameTopics: React.FC = () => {
  const { userToken } = useAuth();
  const { course } = useLocalSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const screenWidth = Dimensions.get("window").width;

  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/course/${parsedCourse.id}/topics/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      const topicsWithColor = response.data.map((topic: Topic) => ({
        ...topic,
        color: getRandomColor(), // Generate a random color for each topic
      }));
      setTopics(topicsWithColor);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    router.navigate({
      pathname: "GameLevel",
      params: {
        topic: JSON.stringify(topic),
        course: course?.toString(),
      },
    });
  };

  const renderItem = ({ item }: { item: Topic }) => (
    <TimelineCategoryItem
      category={{
        id: item.id.toString(),
        name: item.title,
        color: item.color, // Use the generated color
        icon: "book", // Ensure each topic has an icon property
      }}
      onPress={() => handleTopicPress(item)}
      width={screenWidth}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Topic</Text>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={topics}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        key={screenWidth} // Force re-render when screen width changes
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

// Function to generate a random color
const darkColors = [
  "#1A1D23",
  "#2F3640",
  "#3B3F54",
  "#454F63",
  "#5A5F72",
  "#665D7E",
  "#77618F",
  "#876A9D",
  "#977CA7",
  "#A788B5",
  "#B67D8A",
  "#C66C7A",
  "#D5636F",
  "#E45973",
  "#F2557A",
  "#2C3E50",
  "#3A4055",
  "#463A54",
  "#5C4B63",
  "#742F4B",
];

const getRandomColor = () => {
  return darkColors[Math.floor(Math.random() * darkColors.length)];
};

export default GameTopics;
