import React from "react";
import { View, StyleSheet } from "react-native";
import CourseInformation from "./CourseInformation";
import CourseTopics from "./CourseTopics";
import { Course, Topic } from "./types";
import { Album, MAX_HEADER_HEIGHT, MIN_HEADER_HEIGHT } from "./Model";

interface CourseContentProps {
  course: Course;
  enrollCourse: () => void;
  unenrollCourse: () => void;
  progress: number;
  enrolled: boolean;
  enrollDisabled: boolean;
  onEnrollDisabledPress: () => void;
  handleContinue: () => void;
  topics: Topic[];
  selectedTopics: Topic[];
  onSelectedTopicsChange: (selectedTopics: Topic[]) => void;
}

const CourseContent: React.FC<CourseContentProps> = ({
  course,
  enrollCourse,
  unenrollCourse,
  progress,
  enrolled,
  enrollDisabled,
  onEnrollDisabledPress,
  handleContinue,
  topics,
  selectedTopics,
  onSelectedTopicsChange,
}) => {
  return (
    <View style={styles.container}>
      <CourseInformation
        course={course}
        enrollCourse={enrollCourse}
        unenrollCourse={unenrollCourse}
        progress={progress}
        enrolled={enrolled}
        enrollDisabled={enrollDisabled}
        onEnrollDisabledPress={onEnrollDisabledPress}
        handleContinue={handleContinue}
        topics={topics}
      />
      <CourseTopics
        topics={topics}
        selectedTopics={selectedTopics}
        onSelectedTopicsChange={onSelectedTopicsChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CourseContent;
