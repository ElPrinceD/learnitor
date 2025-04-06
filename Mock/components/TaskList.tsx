import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import Colors from "../constants/Colors";

interface Task {
  id: number;
  title: string;
  description: string;
  category: number;
}

interface Props {
  tasks: Task[];
  categoryNames: { [key: number]: string };
}

const TaskList: React.FC<Props> = ({ tasks, categoryNames }) => {
  const shadow = useShadows();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "short" });
  const dayOfMonth = today.getDate();
  const month = today.toLocaleDateString("en-US", { month: "short" });

  // Randomly select a task from the list
  const randomTask = useMemo(() => {
    if (tasks.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tasks.length);
    return tasks[randomIndex];
  }, [tasks]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
    },
    dateView: {
      backgroundColor: "black",
      justifyContent: "center",
      alignItems: "center",
      padding: rS(10),
      borderRadius: rS(5),
      width: "30%", // Adjust width as necessary
    },
    dayOfWeek: {
      position: "absolute",
      top: rV(2),
      left: rS(2),
      fontSize: SIZES.small,
      color: "#FFD600", // Example color, adjust as per your theme
    },
    dayOfMonth: {
      fontSize: SIZES.xxxlarge, // Make the number bigger
      fontWeight: "bold",
      color: "#FFD600",
    },
    month: {
      position: "absolute",
      bottom: rV(2),
      right: rS(2),
      fontSize: SIZES.small,
      color: "#FFD600",
    },
    taskView: {
      flex: 1,
      backgroundColor: "#03c879",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      padding: rS(10),
      borderTopRightRadius: rS(5),
      borderBottomRightRadius: rS(5),
      borderLeftWidth: 0, // Remove border between views
    },
    taskTitle: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
      paddingBottom: rV(50),
    },
    taskCategory: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
    },
  });

  if (!randomTask) {
    return <Text style={{ color: themeColors.text }}>No tasks available</Text>;
  }

  const categoryName = categoryNames[randomTask.category] || "Unknown Category";

  return (
    <View style={{ flexDirection: "row", marginVertical: rV(1), flex: 1 }}>
      <View style={styles.dateView}>
        <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
        <Text style={styles.dayOfMonth}>{dayOfMonth}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>
      <View style={styles.taskView}>
        <Text style={styles.taskTitle}>{randomTask.title}</Text>
        <Text style={styles.taskCategory}>{categoryName}</Text>
      </View>
    </View>
  );
};

export default memo(TaskList);
