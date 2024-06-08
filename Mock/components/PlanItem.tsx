import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Plan } from "./types";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import Colors from "../constants/Colors";

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
  handleEditPlan,
}) => {
  const [isSwipeableOpen, setIsSwipeableOpen] = useState(false);
  const categoryColor = getCategoryColor(categoryNames[plan.category]);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

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

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: rV(10),
    },
    planItemContainer: {
      flex: 1,
      marginLeft: rS(10),
      borderTopLeftRadius: rMS(15),
      borderBottomLeftRadius: rMS(15),
      padding: rS(10),
      ...shadow.medium,
    },
    planContent: {
      paddingTop: rV(8),
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
      paddingBottom: rV(8),
    },
    editButton: {
      backgroundColor: "green",
      alignSelf: "center",
      height: "80%",
      justifyContent: "center",
      alignItems: "center",
      width: rS(100),
    },
  });

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
              <Feather name="edit" size={rMS(24)} color="white" />
            </TouchableOpacity>
          )}
        >
          <View style={styles.planItemWrapper}>
            <Ionicons
              name={getCategoryIcon(categoryNames[plan.category])}
              size={rMS(24)}
              color={categoryColor}
            />
            <View
              style={[
                styles.planItemContainer,
                { backgroundColor: categoryColor },
              ]}
            >
              <View style={styles.planContent}>
                <Text
                  style={[
                    styles.planCategory,
                    {
                      color:
                        categoryNames[plan.category] ===
                        "Assignments & Projects"
                          ? colorScheme === "dark"
                            ? "#000"
                            : "#fff"
                          : "#fff",
                    },
                  ]}
                >
                  {categoryNames[plan.category] || "Unknown Category"}
                </Text>
                <Text
                  style={[
                    styles.planTitle,
                    {
                      color:
                        categoryNames[plan.category] ===
                        "Assignments & Projects"
                          ? colorScheme === "dark"
                            ? "#000"
                            : "#fff"
                          : "#fff",
                    },
                  ]}
                >
                  {plan.title}
                </Text>
                <Text
                  style={[
                    styles.planDescription,
                    {
                      color:
                        categoryNames[plan.category] ===
                        "Assignments & Projects"
                          ? colorScheme === "dark"
                            ? "#000"
                            : "#fff"
                          : "#fff",
                    },
                  ]}
                >
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

export default PlanItem;
