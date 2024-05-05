import React from "react";
import CourseRoadmap from "../../../components/CourseRoadmap";
import { useLocalSearchParams } from "expo-router";

interface Topic {
  title: string;
  description: string;
  id: string;
}

const EnrolledCourse: React.FC = () => {
  const { selectedTopics } = useLocalSearchParams();
  const parsedTopics: Topic[] = Array.isArray(selectedTopics)
    ? selectedTopics
    : JSON.parse(selectedTopics);

  return (
    <>
      <CourseRoadmap selectedTopics={parsedTopics} />
    </>
  );
};

export default EnrolledCourse;
