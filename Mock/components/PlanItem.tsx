// PlanItem.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
        <View style={styles.planContainer}>
          <View
            style={[
              styles.timeMarker,
              {
                backgroundColor: getCategoryColor(categoryNames[plan.category]),
              },
            ]}
          >
            <Text
              style={[styles.typeText, { transform: [{ rotate: "180deg" }] }]}
            >
              {categoryNames[plan.category] || "Unknown Category"}
            </Text>
          </View>
          <View style={styles.planContent}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planTime}>
              {plan.due_time ? plan.due_time.slice(0, 5) : ""}
            </Text>
          </View>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  planContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  planContent: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginLeft: -18,
    borderRadius: 8,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  planTime: {
    fontSize: 14,
    color: "#777",
  },
  timeMarker: {
    width: 59,
    height: 30,
    borderTopLeftRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "270deg" }],
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
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
