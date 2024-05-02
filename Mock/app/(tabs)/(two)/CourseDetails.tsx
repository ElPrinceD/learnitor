import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";

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
  const [topics, setTopics] = useState<Topic[]>([]);

  // Parse course into a Course object
  const parsedCourse: Course =
    typeof course === "string" ? JSON.parse(course) : course;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://192.168.83.198:8000/api/course/${parsedCourse.id}/topics`
      );
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <View>
      {/* Pass parsedCourse to CourseInformation */}
      <CourseInformation course={parsedCourse} />
      <CourseTopics topics={topics} />
    </View>
  );
};

export default CourseDetails;
