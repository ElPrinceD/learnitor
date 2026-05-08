import React from "react";
import { View, StyleSheet, useColorScheme, Text } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import PracticeLevel from "../../../components/PracticeLevel";
import { Topic, Level } from "../../../components/types";
import Colors from "../../../constants/Colors";
import { rMS, rV, rS } from "../../../constants";

const Practice: React.FC = () => {
  const { topic, course } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const parsedTopic: Topic =
    typeof topic === "string" ? JSON.parse(topic) : topic;

  const handleLevelPress = (level: Level) => {
    router.navigate("PracticeInstructions");
    router.setParams({
      level: level.title,
      topic: JSON.stringify(parsedTopic),
      course: course?.toString(),
    });
  };

  const levels: Level[] = [
    {
      title: "Beginner",
      image: require("../../../assets/images/Beginner.jpg"),
    },
    {
      title: "Intermediate",
      image: require("../../../assets/images/Intermediate.png"),
    },
    {
      title: "Advanced",
      image: require("../../../assets/images/Advanced.jpg"),
    },
    { title: "Master", image: require("../../../assets/images/Master.jpg") },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Text style={[styles.titleText, { color: themeColors.text }]}>
                {parsedTopic.title}
              </Text>
              <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>
                Choose your difficulty
              </Text>
            </View>
          ),
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: themeColors.background,
          },
        }}
      />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <PracticeLevel onPress={handleLevelPress} levels={levels} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: rV(4),
  },
  headerTitle: {
    alignItems: "center",
    paddingVertical: rV(4),
  },
  titleText: {
    fontSize: rMS(16),
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: rMS(11),
    fontWeight: "600",
    marginTop: rV(2),
  },
});

export default Practice;
