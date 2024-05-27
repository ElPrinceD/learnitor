import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const Questions = ({
  practiceQuestions,
  practiceAnswers,
  currentQuestion,
  selectedAnswers,
  questionsWithMultipleCorrectAnswers,
  isAnswerSelected,
  handleAnswerSelection,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        {practiceQuestions.length > 0 && (
          <View key={currentQuestion}>
            {practiceQuestions[currentQuestion] &&
              practiceQuestions[currentQuestion].text && (
                <Text style={styles.questionText}>
                  {practiceQuestions[currentQuestion].text}
                </Text>
              )}
          </View>
        )}
      </View>
      <View style={styles.answersContainer}>
        {practiceAnswers
          .filter(
            (answer) =>
              answer.question === practiceQuestions[currentQuestion].id
          )
          .map((answer, ansIndex) => (
            <TouchableOpacity
              key={ansIndex}
              style={[
                styles.answerTouchable,
                isAnswerSelected(
                  practiceQuestions[currentQuestion].id,
                  answer.id
                ) && styles.selectedAnswer,
              ]}
              onPress={() =>
                handleAnswerSelection(
                  answer.id,
                  practiceQuestions[currentQuestion].id
                )
              }
            >
              {!questionsWithMultipleCorrectAnswers.includes(
                practiceQuestions[currentQuestion].id
              ) && (
                <View style={styles.circleContainer}>
                  <View
                    style={[
                      styles.circle,
                      isAnswerSelected(
                        practiceQuestions[currentQuestion].id,
                        answer.id
                      ) && styles.selectedCircle,
                    ]}
                  >
                    {isAnswerSelected(
                      practiceQuestions[currentQuestion].id,
                      answer.id
                    ) && <View style={styles.innerCircle} />}
                  </View>
                </View>
              )}
              {questionsWithMultipleCorrectAnswers.includes(
                practiceQuestions[currentQuestion].id
              ) && (
                <View
                  style={[
                    styles.checkBox,
                    isAnswerSelected(
                      practiceQuestions[currentQuestion].id,
                      answer.id
                    ) && styles.checkedBox,
                  ]}
                />
              )}
              {answer && answer.text && (
                <Text
                  style={[
                    styles.answerText,
                    isAnswerSelected(
                      practiceQuestions[currentQuestion].id,
                      answer.id
                    ) && styles.selectedAnswerText,
                  ]}
                >
                  {answer.text}
                </Text>
              )}
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 10,
  },
  questionContainer: {
    flex: 1,
    backgroundColor: '#e0dede',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  answersContainer: {
    flex: 1,
    backgroundColor: '#e0dede',
    paddingTop: 30,
    paddingBottom: 0,
    marginTop: -27,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 25,
    color: "#232222",
    paddingLeft: 20,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  answerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '85%',
    padding: 30,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    paddingLeft: 40,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4b4a4a",
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: "#ffffff",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4b4a4a',
  },
  selectedAnswer: {
    backgroundColor: '#e1943b',
  },
  answerText: {
    fontSize: 14,
    marginLeft: 10,
    color: "#2b2a2a",
    flexWrap: 'wrap', 
    maxWidth: '85%',
    
  },
  selectedAnswerText: {
    fontSize: 14,
    marginLeft: 10,
    color: "#fff",
  },
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 3,
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: '#ffffff',
    borderColor: "#fff"
  },
});

export default Questions;
