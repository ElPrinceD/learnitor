import React, { useState, useEffect } from "react";
import { View , StyleSheet, ScrollView} from "react-native";
import { useLocalSearchParams, useGlobalSearchParams } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config"


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
  const params = useGlobalSearchParams();
  const token = params.token;
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
        `${ApiUrl}:8000/api/course/${parsedCourse.id}/topics`, 
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      } 
      );
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    
    <View>
      
      
      <CourseInformation course={parsedCourse} />
      <CourseTopics topics={topics} />
    </View>
     
  );


};

const styles = StyleSheet.create({

  scrollViewContainer: {
    flexGrow: 1,
  },
})

export default CourseDetails;
