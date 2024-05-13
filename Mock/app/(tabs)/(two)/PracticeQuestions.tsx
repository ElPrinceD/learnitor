import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import Questions from "@/components/Questions";
import ApiUrl from "../../../config";
import { useAuth } from "../../../components/AuthContext";

interface Topic {
  title: string;
  description: string;
  id: string;
  completed?: boolean;
}

interface Question {
  text: string;
  id: number;
  level: string;
}
interface Answer {
  text: string;
  id: number;
  isRight: boolean;
  question: number;
}

const PracticeQuestions: React.FC = () => {
  const { topic, level } = useLocalSearchParams();
  const { userToken } = useAuth();
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Answer[]>([]);

  // Ensure `level` is always treated as a string
  const parsedLevel: string = typeof level === "string" ? level : "";

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  console.log("NAT:", parsedTopic.id, parsedLevel);
  useEffect(() => {
    fetchData();
  }, [parsedTopic.id]);

  const fetchData = async () => {
    try {
      const questionsResponse = await axios.get(
        `${ApiUrl}:8000/api/course/topic/${parsedTopic.id}/questions/`,
        {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        }
      );

      // Filter questions based on the level parameter
      const filteredQuestions = questionsResponse.data.filter(
        (question: Question) => question.level === parsedLevel
      );
      console.log(questionsResponse.data);
      setPracticeQuestions(filteredQuestions);

      // Fetch answers for each question
      const answersPromises = filteredQuestions.map(
        async (question: Question) => {
          const answersResponse = await axios.get(
            `${ApiUrl}:8000/api/course/topic/questions/${question.id}/answers`,
            {
              headers: {
                Authorization: `Token ${userToken?.token}`,
              },
            }
          );
          return answersResponse.data;
        }
      );

      const answers = await Promise.all(answersPromises);
      setPracticeAnswers(answers.flat()); // Flattening the array of arrays
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error as needed
    }
  };

  return (
    <View style={styles.container}>
      <Questions
        practiceQuestions={practiceQuestions}
        practiceAnswers={practiceAnswers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PracticeQuestions;
