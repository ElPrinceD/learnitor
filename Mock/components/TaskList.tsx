import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import Colors from "../constants/Colors";


interface Task {
  id: number;
  title: string;
  description: string;
  category: number; // Changed to number to match the categoryNames key
}

interface Props {
  tasks: Task[];
  categoryNames: { [key: number]: string }; // Category names should be indexed by number
  getCategoryColor: (type: string) => string;
}

const TaskList: React.FC<Props> = ({ tasks, categoryNames}) => {
  const shadow = useShadows();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  // Determine theme colors


  const getCategoryIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "Exams TimeTable":
        return "flame";
      case "TimeTable":
        return "briefcase";
      case "Assignments & Projects":
        return "people";
      case "Study TimeTable":
        return "book";
      default:
        return "help-circle"; // Default icon name
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case "Assignments & Projects":
        return themeColors.text;
      case "TimeTable":
        return "#ed892e";
      case "Study TimeTable":
        return "#6c77f4";
      case "Exams TimeTable":
        return "#a96ae3";
      default:
        return "#000";
    }
  };


  const styles = StyleSheet.create({
    taskWrapper: {
      marginTop: rS(3),
      marginBottom: rS(7), // Space between each task
      padding: rS(2),
      borderRadius: rS(10),
      marginHorizontal: rS(3),
      backgroundColor: themeColors.background, // Background color for each task
      ...shadow.medium, // Optional: Add shadow if desired
    },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      
      marginVertical: rV(2), // Adjusted vertical margin for spacing
    },
    iconWrapper: {
      width: rMS(40), // Size of the icon background
      height: rMS(40), // Size of the icon background
      borderRadius: rMS(20), // Round shape
      backgroundColor: themeColors.background, // Background color for the icon
      marginLeft: rMS(10),
      justifyContent: "center",
      alignItems: "center",
      ...shadow.medium,
    },
    planItemContainer: {
      flex: 1,
      marginLeft: rS(8), // Reduced margin for less space
      borderTopLeftRadius: rMS(15),
      borderBottomLeftRadius: rMS(15),
      padding: rS(10),
    },
    planContent: {
      paddingTop: rV(1),
    },
    planTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      marginBottom: rS(5),
    },
    planDescription: {
      fontSize: SIZES.medium,
    },
    planCategory: {
      fontSize: SIZES.small,
      paddingBottom: rV(1),
    },
  });

  return (
    <>
      {tasks.map((task) => {
        const categoryName = categoryNames[task.category] || "Unknown Category"; // Use categoryNames with the task's category ID
        const categoryColor = getCategoryColor(categoryName);
        return (
          <View key={task.id} style={styles.taskWrapper}>
            <View style={styles.planItemWrapper}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={getCategoryIcon(categoryName)}
                  size={rMS(24)}
                  color={categoryColor}
                />
              </View>
              <View
                style={[
                  styles.planItemContainer,
                  ,
                ]}
              >
                <View style={styles.planContent}>
                  <Text
                    style={[
                      styles.planCategory,
                      { color: themeColors.text },
                    ]}
                  >
                    {categoryName}
                  </Text>
                  <Text
                    style={[
                      styles.planTitle,
                      { color: themeColors.text },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text
                    style={[
                      styles.planDescription,
                      { color: themeColors.text },
                    ]}
                  >
                    {task.description}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
};

export default memo(TaskList);
