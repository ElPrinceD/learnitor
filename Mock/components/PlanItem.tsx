import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  category: number;
}

interface Props {
  plan: Plan;
  categoryNames: { [key: number]: string };
  getCategoryColor: (type: string) => string;
  handleDeletePlan: (planId: number) => void;
  handleEditPlan: (plan: Plan) => void;
}

const PlanItem: React.FC<Props> = ({
  plan,
  categoryNames,
  getCategoryColor,
  handleDeletePlan,
  handleEditPlan,
}) => {
  const categoryColor = getCategoryColor(categoryNames[plan.category]);

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

  return (
    <GestureHandlerRootView>
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePlan(plan.id)}
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        )}
        renderLeftActions={() => (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditPlan(plan)}
          >
            <Feather name="edit" size={24} color="white" />
          </TouchableOpacity>
        )}
      >
        <View style={styles.planItemWrapper}>
          {/* <Text style={styles.planTime}>{plan.due_time.slice(0, -3)}</Text> */}
          <Ionicons name={getCategoryIcon(categoryNames[plan.category]  )} size={24} color={categoryColor} style={styles.planIcon} />
          <View style={[styles.planItemContainer, { backgroundColor: categoryColor }]}>
            
            <View style={styles.planContent}>
            <Text style={[styles.planCategory, { color: "#fff" }]}>
                {categoryNames[plan.category] || "Unknown Category"}
              </Text>
              <Text style={[styles.planTitle, { color: "#fff" }]}>{plan.title}</Text>
              <Text style={[styles.planDescription, { color: "#fff" }]}>{plan.description}</Text>
              
            </View>
          </View>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  planItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  planIcon: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#ffffff"
    //marginRight: 10, // Add space between the icon and the plan item
  },
  planTime: {
    width: 50,
    textAlign: 'center',
    color: "#ffffff",
  },
  planItemContainer: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  planItemLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ccc',
  },
  planContent: {
    paddingTop: 10, // Adjust padding to ensure text is not hidden by the line
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
  },
  planCategory: {
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "red",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
  },
  editButton: {
    backgroundColor: "green",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
  },
});

export default PlanItem;
