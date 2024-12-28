import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { Plan } from "./types";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import Colors from "../constants/Colors";
import MapleSVG from "./MapleSVG";
import SunSVG from "./SunSVG";
import StarSVG from "./StarSVG";
import CrownSVG from "./CrownSVG";

interface Props {
  plan: Plan;
  categoryNames: { [key: number]: string };
  getCategoryColor: (type: string) => string;
  handleEditPlan: (plan: Plan) => void;
}

const PlanItem: React.FC<Props> = ({
  plan,
  categoryNames,
  getCategoryColor,
  handleEditPlan,
}) => {
  const category = categoryNames[plan.category] || "Unknown Category";
  const categoryColor = getCategoryColor(category);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  // Format time to HH:MM
  const formattedTimeStart = plan.due_time_start
    ? plan.due_time_start.split(":").slice(0, 2).join(":")
    : "";

  const formattedTimeEnd = plan.due_time_start
    ? plan.due_time_start.split(":").slice(0, 2).join(":") // Corrected this line
    : "";

  // Function to select SVG based on category name
  const renderSVGIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Exams TimeTable":
        return <StarSVG width={rMS(50)} height={rMS(50)} />;
      case "TimeTable":
        return <SunSVG width={rMS(50)} height={rMS(50)} />;
      case "Assignments & Projects":
        return <CrownSVG width={rMS(50)} height={rMS(50)} />;
      case "Study TimeTable":
        return <MapleSVG width={rMS(50)} height={rMS(50)} />;
      default:
        return <MapleSVG width={rMS(50)} height={rMS(50)} />;
    }
  };

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    planItemWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: rV(1),
    },
    planItemContainer: {
      flex: 1,
      marginHorizontal: rS(10),
      borderTopLeftRadius: rMS(10),
      borderBottomLeftRadius: rMS(10),
      padding: rS(10),
      ...shadow.small,
      flexDirection: "row",
      alignItems: "center", // Changed from 'center' to 'flex-start' for vertical alignment
    },
    planContent: {
      flex: 1, // Allow the content to take up space
    },
    planTitle: {
      fontSize: SIZES.xlarge,
      fontWeight: "bold",
      marginBottom: rS(5),
      textAlign: "left", // Align text to the left
    },
    svgWrapper: {
      marginLeft: rS(-10),
      overflow: "hidden",
    },
    planCategory: {
      fontSize: SIZES.medium,
      textAlign: "left", // Align text to the left
    },
    planTime: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
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
    <TouchableOpacity onPress={() => {}} activeOpacity={1} style={styles.wrapper}>
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
          <View
            style={[
              styles.planItemContainer,
              { backgroundColor: themeColors.background },
            ]}
          >
            <View style={styles.svgWrapper}>
              {renderSVGIcon(category)} 
            </View>
            <View style={styles.planContent}>
              <Text
                style={[
                  styles.planTitle,
                  {
                    color: themeColors.text,
                  },
                ]}
              >
                {plan.title || ""}
              </Text>
              <Text
                style={[
                  styles.planCategory,
                  {
                    color: themeColors.text,
                  },
                ]}
              >
                {category}
              </Text>
            </View>
            <Text style={[styles.planTime]}>
              {formattedTimeStart}-{formattedTimeEnd} {/* Corrected to show end time */}
            </Text>
          </View>
        </View>
      </Swipeable>
    </TouchableOpacity>
  );
};

export default memo(PlanItem);