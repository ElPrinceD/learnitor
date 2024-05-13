import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";

interface ScorePageProps {
  score: number;
  practiceQuestions: Question[];
  practiceAnswers: Answer[];
}

const ScorePage: React.FC<ScorePageProps> = ({}) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const { score, practiceQuestions, practiceAnswers } = useLocalSearchParams();

  const handleToggleAnswers = () => {
    setShowAnswers((prevShowAnswers) => !prevShowAnswers);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Score</Text>
      <Text style={styles.score}>{score}</Text>
      <TouchableOpacity onPress={handleToggleAnswers} style={styles.button}>
        <Text style={styles.buttonText}>
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </Text>
      </TouchableOpacity>
      {showAnswers && (
        <View style={styles.answersContainer}>
          {practiceQuestions.map((question) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionText}>{question.text}</Text>
              <View style={styles.answersList}>
                {practiceAnswers
                  .filter((answer) => answer.question === question.id)
                  .map((answer) => (
                    <Text key={answer.id} style={styles.answerText}>
                      {answer.text}
                    </Text>
                  ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  score: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#337ab7",
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#337ab7",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
  },
  answersContainer: {
    marginTop: 20,
    width: "100%",
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  answersList: {
    marginLeft: 20,
  },
  answerText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default ScorePage;
