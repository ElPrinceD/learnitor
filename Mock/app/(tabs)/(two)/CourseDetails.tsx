import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";

interface Course {
  title: string;
  description: string;
  id: string;
  url: string;
}

interface Topic {
  title: string;
  description: string;
  id: string;
}

const CourseDetails: React.FC = () => {
  const { course } = useLocalSearchParams();
  const { userToken } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

  // Parse course into a Course object
  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
    loadSelectedTopics(); // Load selected topics when component mounts
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${ApiUrl}:8000/api/course/${parsedCourse.id}/topics`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const loadSelectedTopics = async () => {
    try {
      const storedTopics = await AsyncStorage.getItem("selectedTopics");
      console.log("Stored selectedTopics:", storedTopics); // Log the stored topics
      if (storedTopics !== null) {
        setSelectedTopics(JSON.parse(storedTopics));
      }
    } catch (error) {
      console.error("Error loading selected topics:", error);
    }
  };

  const saveSelectedTopics = async (selectedTopics: Topic[]) => {
    try {
      await AsyncStorage.setItem(
        "selectedTopics",
        JSON.stringify(selectedTopics)
      );
    } catch (error) {
      console.error("Error saving selected topics:", error);
    }
  };

  const handleSelectedTopicsChange = (selectedTopics: Topic[]) => {
    setSelectedTopics(selectedTopics);
    saveSelectedTopics(selectedTopics); // Save selected topics whenever they change
  };
  console.log("that:", selectedTopics);
  return (
    <View style={styles.container}>
      <CourseInformation
        course={parsedCourse}
        selectedTopics={selectedTopics}
      />

      <CourseTopics
        topics={topics}
        selectedTopics={selectedTopics} // Pass selected topics to CourseTopics component
        onSelectedTopicsChange={handleSelectedTopicsChange}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {/* Display selected topics */}
        {selectedTopics.map((topic) => (
          <View key={topic.id}></View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
});

export default CourseDetails;
