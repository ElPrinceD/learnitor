import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import CourseInformation from "../../../components/CourseInformation";
import CourseTopics from "../../../components/CourseTopics";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

interface Topic {
  title: string;
  description: string;
  id: string;
}

const CourseDetails: React.FC = () => {
  const { course } = useLocalSearchParams();
  const { userToken } = useAuth();
  const [selectedTopicCount, setSelectedTopicCount] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectedMiniTitle, setSelectedMiniTitle] = useState<string>("");
  const [showTopics, setShowTopics] = useState(true); // New state variable

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
    setSelectedTopicCount(selectedTopics.length);
  };

  const handleMiniTitleSelect = (title: string) => {
    setSelectedMiniTitle(title);
  };

  const handleEnrollmentStatusChange = (status: boolean) => {
    setShowTopics(!status);
  };


  return (
    <LinearGradient colors={['#ffffff', '#fdecd2']} style={styles.container}>
      <CourseInformation
        course={parsedCourse}
        selectedTopics={selectedTopics}
        onContinue={() => setShowTopics(false)} // Pass the function to hide topics
        setShowTopics={setShowTopics}
        onEnrollmentStatusChange={handleEnrollmentStatusChange}
      />
      <View style={styles.miniTitles}>
  <View style={styles.topicCountContainer}>
    {showTopics && (
      <TouchableOpacity onPress={() => handleMiniTitleSelect("Topics")}>
        <Text
          style={[
            styles.miniText,
            selectedMiniTitle === "Topics" && styles.selectedMiniTitle,
            { paddingHorizontal: 40 }
          ]}
        >
          Topics {selectedTopicCount > 0 && `(${selectedTopicCount} Selected)`}
        </Text>
      </TouchableOpacity>
    )}
    {!showTopics && (
      <>
        <TouchableOpacity onPress={() => handleMiniTitleSelect("Questions")}>
          <View style={styles.inline}>
            <Text
              style={[
                styles.miniText,
                selectedMiniTitle === "Questions" && styles.selectedMiniTitle,
              ]}
            >
              Questions
            </Text>
            <Ionicons name="lock-closed" size={15} color="#8e8e8e" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMiniTitleSelect("Materials")}>
          <View style={[styles.inline, selectedMiniTitle === "Materials" && styles.selectedMiniTitle]}>
            <Text
              style={[
                styles.miniText,
              ]}
            >
              Materials
            </Text>
            <Ionicons name="lock-closed" size={15} color="#8e8e8e" />
          </View>
        </TouchableOpacity>
      </>
    )}
  </View>
</View>
<CourseTopics
  topics={showTopics ? topics : selectedTopics}
  selectedTopics={selectedTopics}
  onSelectedTopicsChange={handleSelectedTopicsChange}
  course={parsedCourse}
/>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {selectedTopics.map((topic) => (
          <View key={topic.id}></View>
        ))}
        
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopEndRadius: 20,
    borderTopLeftRadius: 20,
  },
  topicCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    paddingHorizontal: 10,
    color: "#8e8e8e",
    fontWeight: "bold",
    paddingVertical: 15,
    fontSize: 15,
  },
  miniTitles: {  
    borderBottomColor: "#bababa",
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderWidth: 1,
  },
  miniText: {
    paddingHorizontal: 10,
    color: "#8e8e8e",
    fontWeight: "bold",
    paddingVertical: 15,
    fontSize: 15,
  },
  selectedMiniTitle: {
    borderBottomColor: "#9a580d",
    borderBottomWidth: 2.5,
    borderRadius: 7,
  },
  inline: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 15,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
});

export default CourseDetails;
