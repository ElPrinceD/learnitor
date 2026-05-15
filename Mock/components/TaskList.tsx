import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { CheckCircle, ChevronRight } from "lucide-react-native";
import { rMS, rS, rV, useShadows } from "../constants";
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
    // Date badge — pill-shaped, tint-tinted
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(12),
    },
    dateContainer: {
      backgroundColor: themeColors.tint + "10",
      paddingHorizontal: rMS(14),
      paddingVertical: rMS(8),
      borderRadius: rMS(16),
      borderWidth: 1,
      borderColor: themeColors.tint + "20",
    },
    dateText: {
      fontSize: rMS(10),
      fontWeight: "700",
      color: themeColors.tint,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dayText: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      marginTop: rV(2),
    },
    // Task items — glassmorphic cards
    taskItem: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      padding: rMS(12),
      marginBottom: rV(8),
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      flexDirection: "row",
      alignItems: "center",
    },
    taskColorIndicator: {
      width: rMS(4),
      height: "80%",
      borderRadius: rMS(2),
      marginRight: rS(10),
    },
    taskContent: {
      flex: 1,
    },
    taskHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rV(4),
    },
    categoryBadge: {
      paddingHorizontal: rMS(8),
      paddingVertical: rMS(3),
      borderRadius: rMS(12),
      marginRight: rMS(6),
    },
    categoryText: {
      fontSize: rMS(9),
      fontWeight: "700",
      color: "white",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    taskTitle: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.text,
      lineHeight: rMS(18),
    },
    taskDescription: {
      fontSize: rMS(11),
      color: themeColors.textSecondary,
      marginTop: rV(2),
      lineHeight: rMS(15),
    },
    // Empty state — matches Play's squadEmpty pattern
    emptyState: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(24),
      padding: rMS(24),
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border + "40",
    },
    emptyText: {
      fontSize: rMS(12),
      color: themeColors.textSecondary,
      textAlign: "center",
      marginTop: rV(8),
      fontWeight: "600",
      lineHeight: rMS(18),
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
          <CheckCircle
            size={28}
            color={themeColors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No tasks for today — enjoy your free time!
          </Text>
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
            <View
              style={[
                styles.taskColorIndicator,
                { backgroundColor: categoryColor },
              ]}
            />
            <View style={styles.taskContent}>
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
            </View>
            <ChevronRight
              size={16}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default memo(TaskList);
