import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
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
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const dayOfMonth = today.getDate();
  const month = today.toLocaleDateString("en-US", { month: "short" });

  // Show only the first task (earliest start time)
  const displayTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return [tasks[0]]; // Only show the first task
  }, [tasks]);

  const getCategoryColor = (categoryId: number) => {
    const colors = [
      "#EF643B", // Orange
      "#4A90E2", // Blue
      "#7ED321", // Green
      "#F5A623", // Yellow
      "#9013FE", // Purple
    ];
    return colors[categoryId % colors.length];
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rMS(8),
    },
    dateContainer: {
      backgroundColor: themeColors.card,
      paddingHorizontal: rMS(12),
      paddingVertical: rMS(8),
      borderRadius: rMS(8),
      marginRight: rMS(12),
    },
    dateText: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: themeColors.text,
    },
    dayText: {
      fontSize: SIZES.medium,
      fontWeight: "bold",
      color: themeColors.text,
      marginTop: rV(2),
    },
    taskItem: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(8),
      padding: rMS(8),
      marginBottom: rMS(4),
    },
    taskHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rMS(4),
    },
    categoryBadge: {
      paddingHorizontal: rMS(6),
      paddingVertical: rMS(2),
      borderRadius: rMS(8),
      marginRight: rMS(6),
    },
    categoryText: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: "white",
    },
    taskTitle: {
      fontSize: SIZES.small,
      fontWeight: "600",
      color: themeColors.text,
      flex: 1,
      lineHeight: rMS(16),
    },
    taskDescription: {
      fontSize: SIZES.small,
      color: themeColors.textSecondary,
      marginTop: rV(2),
      lineHeight: rMS(14),
      numberOfLines: 1,
      ellipsizeMode: "tail",
    },
    emptyState: {
      backgroundColor: themeColors.card,
      borderRadius: rMS(12),
      padding: rMS(20),
      alignItems: "center",
    },
    emptyText: {
      fontSize: SIZES.medium,
      color: themeColors.textSecondary,
      textAlign: "center",
    },
  });

  if (displayTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dayOfWeek}</Text>
            <Text style={styles.dayText}>
              {dayOfMonth} {month}
            </Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks for today</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{dayOfWeek}</Text>
          <Text style={styles.dayText}>
            {dayOfMonth} {month}
          </Text>
        </View>
      </View>

      {displayTasks.map((task, index) => {
        const categoryName =
          (categoryNames && categoryNames[task.category]) || "General";
        const categoryColor = getCategoryColor(task.category);

        return (
          <TouchableOpacity
            key={task.id}
            style={styles.taskItem}
            activeOpacity={0.7}
          >
            <View style={styles.taskHeader}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryText}>{categoryName}</Text>
              </View>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.description && (
              <Text
                style={styles.taskDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.description}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default memo(TaskList);
