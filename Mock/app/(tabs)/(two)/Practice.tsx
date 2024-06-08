import React from "react";
import { View, StyleSheet, useColorScheme, Text } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import PracticeInformation from "../../../components/PracticeInformation";
import PracticeLevel from "../../../components/PracticeLevel";
import { Topic, Level } from "../../../components/types";
import Colors from "../../../constants/Colors";
import { SIZES, rV } from "../../../constants";

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
    console.log("Level pressed:", level);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    headerTitle: {
      marginVertical: rV(8),
    },
    description: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
    },
  });
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: SIZES.large,
                  fontWeight: "bold",
                }}
              >
                {parsedTopic.title}
              </Text>
              <Text style={styles.description}>Practice</Text>
            </View>
          ),
          headerShadowVisible: false,
          headerTitleAlign: "center",
        }}
      />
      <View style={styles.container}>
        {/* <PracticeInformation topic={parsedTopic} /> */}
        <PracticeLevel onPress={handleLevelPress} levels={levels} />
      </View>
    </>
  );
};

export default Practice;
