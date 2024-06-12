import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { SIZES, rS, rV } from "../constants";
import PlanItem from "../components/PlanItem";

interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  category: number;
}

interface PlansListProps {
  todayPlans: Plan[];
  categoryNames: { [key: number]: string };
  getCategoryColor: (type: string) => string;
  handleEditPlan: (plan: Plan) => void;
}

const PlansList: React.FC<PlansListProps> = ({
  todayPlans,
  categoryNames,
  getCategoryColor,
  handleEditPlan,
}) => {
  const styles = StyleSheet.create({
    plansContainer: {
      marginTop: rV(18),
    },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(8),
    },
    planTime: {
      marginHorizontal: rS(10),
      textAlign: "left",
      color: "#888", // Adjust this based on your theme
      alignSelf: "flex-start",
    },
    noPlansText: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: "#888", // Adjust this based on your theme
      textAlign: "center",
      paddingVertical: rV(20),
    },
    planItemLine: {
      position: "absolute",
      top: rV(-10),
      left: 0,
      right: 0,
      height: 0.8,
      backgroundColor: "#888", // Adjust this based on your theme
    },
  });

  return (
    <View style={styles.plansContainer}>
      {todayPlans.length === 0 ? (
        <Text style={styles.noPlansText}>Hey, you have a free day!</Text>
      ) : (
        todayPlans.map((plan, index) => {
          const categoryColor = getCategoryColor(categoryNames[plan.category]);
          return (
            <View key={index} style={styles.planItemWrapper}>
              <Text style={styles.planTime}>{plan.due_time.slice(0, -3)}</Text>
              <View style={styles.planItemLine} />
              <PlanItem
                plan={plan}
                categoryNames={categoryNames}
                getCategoryColor={getCategoryColor}
                handleEditPlan={handleEditPlan}
              />
            </View>
          );
        })
      )}
    </View>
  );
};

export default PlansList;
