import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { Topic, Course } from "../../../components/types";

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

  const handleSelectedTopicsChange = (selectedTopics: Topic[]) => {
    setSelectedTopics(selectedTopics);
  };
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
