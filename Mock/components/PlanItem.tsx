import React, { useState } from "react";
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
  const [isSwipeableOpen, setIsSwipeableOpen] = useState(false);
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

  const closeSwipeable = () => {
    setIsSwipeableOpen(false);
  };

  return (
    <GestureHandlerRootView>
      <TouchableOpacity
        onPress={() => {
          // Handle tap to close Swipeable
          // You might need to implement a function to close the Swipeable component here
        }}
        activeOpacity={1} // Prevent visual feedback on tap
        style={styles.wrapper} // Ensure the wrapper covers the entire screen
      >
        <Swipeable
          renderRightActions={() => (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditPlan(plan)}
              
            >
              <Feather name="edit" size={24} color="white" />
            </TouchableOpacity>
          )}
        >
          <View style={styles.planItemWrapper}>
            <Ionicons
              name={getCategoryIcon(categoryNames[plan.category])}
              size={24}
              color={categoryColor}
              style={styles.planIcon}
            />
            <View
              style={[
                styles.planItemContainer,
                { backgroundColor: categoryColor },
              ]}
            >
              <View style={styles.planContent}>
                <Text style={[styles.planCategory, { color: "#fff" }]}>
                  {categoryNames[plan.category] || "Unknown Category"}
                </Text>
                <Text style={[styles.planTitle, { color: "#fff" }]}>
                  {plan.title}
                </Text>
                <Text style={[styles.planDescription, { color: "#fff" }]}>
                  {plan.description}
                </Text>
              </View>
            </View>
          </View>
        </Swipeable>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  planItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  planIcon: {
    paddingHorizontal: 1,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#ffffff",
  },
  planItemContainer: {
    flex: 1,
    marginLeft: 10,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  planContent: {
    paddingTop: 10,
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
    paddingBottom: 10
  },
  editButton: {
    backgroundColor: "green",
    marginTop: 10,
    height: "82%",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    // borderTopRightRadius: 15,
    // borderBottomRightRadius: 15,
  },
});

export default PlanItem;
