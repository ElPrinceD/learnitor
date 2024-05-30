import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Course, Topic } from "../../components/types";
import { useAuth } from "../../components/AuthContext";
import ApiUrl from "../../config";
import TimelineCategoryItem from "../../components/TimelineCategoryItem";
import GameButton from "../../components/GameButton";
import Colors from "../../constants/Colors";

const GameTopics: React.FC = () => {
  const { userToken } = useAuth();
  const { course } = useLocalSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

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
        isChecked: false, // Add isChecked property to track selection
      }));
      setTopics(topicsWithColor);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    if (selectedTopics.length === 0) {
      router.navigate({
        pathname: "GameLevel",
        params: {
          topic: JSON.stringify(topic),
          course: course?.toString(),
        },
      });
    } else {
      handleTopicLongPress(topic);
    }
  };

  const handleTopicLongPress = (topic: Topic) => {
    setSelectionMode(true);
    const isSelected = selectedTopics.some((t) => t.id === topic.id);
    if (isSelected) {
      const updatedSelectedTopics = selectedTopics.filter(
        (t) => t.id !== topic.id
      );
      setSelectedTopics(updatedSelectedTopics);
      const updatedTopics = topics.map((t) =>
        t.id === topic.id ? { ...t, isChecked: false } : t
      );
      setTopics(updatedTopics);
      if (updatedSelectedTopics.length === 0) {
        setSelectionMode(false);
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
      const updatedTopics = topics.map((t) =>
        t.id === topic.id ? { ...t, isChecked: true } : t
      );
      setTopics(updatedTopics);
    }
  };

  const handleSelectAll = () => {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([]);
      const updatedTopics = topics.map((t) => ({ ...t, isChecked: false }));
      setTopics(updatedTopics);
      setSelectionMode(false);
    } else {
      setSelectedTopics([...topics]);
      const updatedTopics = topics.map((t) => ({ ...t, isChecked: true }));
      setTopics(updatedTopics);
      setSelectionMode(true);
    }
  };

  const handleContinue = () => {
    router.navigate({
      pathname: "GameLevel",
      params: {
        topics: JSON.stringify(selectedTopics),
        course: course?.toString(),
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      marginTop: 50,
    },
    header: {
      color: themeColors.text,
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: 20,
      textAlign: "center",
    },
    row: {
      justifyContent: "space-between",
    },
    flatListContent: {
      paddingBottom: 20,
    },
    topicContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      position: "relative",
    },
    checkBoxContainer: {
      position: "absolute",
      top: 7,
      right: -1.5,
      zIndex: 1,
    },
    checkBox: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-end",
    },
    selectAllContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
    },
    selectAllText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 5,
    },
    continueButton: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 20,
      position: "absolute",
      bottom: 20,
      width: 250,
      alignSelf: "center",
      backgroundColor: themeColors.buttonBackground,
      padding: 15,
      borderRadius: 5,
      marginHorizontal: 10,
      borderTopLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
  });

  const renderItem = ({ item }: { item: Topic }) => {
    const opacity = item.isChecked ? 0.9 : 1;
    return (
      <View style={styles.topicContainer}>
        <View style={styles.checkBoxContainer}>
          <TouchableOpacity onPress={() => handleTopicPress(item)}>
            {selectionMode &&
              (item.isChecked ? (
                <Ionicons
                  name="checkmark-circle-sharp"
                  size={24}
                  color={themeColors.icon}
                />
              ) : (
                <Feather name="circle" size={22} color="black" />
              ))}
          </TouchableOpacity>
        </View>
        <View style={{ opacity }}>
          <TimelineCategoryItem
            category={{
              id: item.id.toString(),
              name: item.title,
              color: item.color,
              icon: "book",
            }}
            onPress={() => handleTopicPress(item)}
            onLongPress={() => handleTopicLongPress(item)}
            width={screenWidth}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Topic(s)</Text>
      <TouchableOpacity
        onPress={handleSelectAll}
        style={styles.selectAllContainer}
      >
        <View style={styles.checkBox}>
          {selectedTopics.length === topics.length ? (
            <Ionicons
              name="checkmark-circle-sharp"
              size={24}
              color={themeColors.icon}
            />
          ) : selectedTopics.length > 0 ? (
            <Feather name="circle" size={22} color={themeColors.text} />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={themeColors.text}
            />
          )}
        </View>
        <Text style={styles.selectAllText}>Select All</Text>
      </TouchableOpacity>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={topics}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        key={screenWidth}
      />
      {selectedTopics.length > 0 && (
        <GameButton
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      )}
    </View>
  );
};

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
