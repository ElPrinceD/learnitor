import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Pencil } from "lucide-react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Plan } from "./types";
import { SIZES, rMS, rS, rV, useShadows } from "../constants";
import Colors from "../constants/Colors";
import MapleSVG from "./MapleSVG";
import SunSVG from "./SunSVG";
import StarSVG from "./StarSVG";
import CrownSVG from "./CrownSVG";

interface Props {
  plan: Plan;
  categoryNames: Record<number, string>;
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

  const formattedTimeEnd = plan.due_time_end
    ? plan.due_time_end.split(":").slice(0, 2).join(":")
    : "";

  // Function to select SVG based on category name
  const renderSVGIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Exams TimeTable":
        return <StarSVG width={rMS(44)} height={rMS(44)} />;
      case "TimeTable":
        return <SunSVG width={rMS(44)} height={rMS(44)} />;
      case "Assignments & Projects":
        return <CrownSVG width={rMS(44)} height={rMS(44)} />;
      case "Study TimeTable":
        return <MapleSVG width={rMS(44)} height={rMS(44)} />;
      default:
        return <MapleSVG width={rMS(44)} height={rMS(44)} />;
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
      marginVertical: rV(2),
    },
    planItemContainer: {
      flex: 1,
      borderRadius: rMS(20),
      padding: rS(12),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.cardGlass,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
      ...shadow.small,
    },
    planContent: {
      flex: 1,
    },
    planTitle: {
      fontSize: rMS(14),
      fontWeight: "800",
      marginBottom: rV(2),
      textAlign: "left",
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    svgWrapper: {
      marginRight: rS(10),
      overflow: "hidden",
    },
    planCategory: {
      fontSize: rMS(11),
      textAlign: "left",
      color: themeColors.textSecondary,
      fontWeight: "600",
    },
    planTime: {
      fontSize: rMS(11),
      color: themeColors.tint,
      fontWeight: "800",
    },
    editButton: {
      backgroundColor: themeColors.tint,
      alignSelf: "center",
      height: "95%",
      justifyContent: "center",
      alignItems: "center",
      width: rS(60),
      borderTopRightRadius: rMS(20),
      borderBottomRightRadius: rMS(20),
    },
    editActionContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      width: rS(60),
      paddingHorizontal: rS(10),
    },
  });

  return (
    <TouchableOpacity
      onPress={() => {}}
      activeOpacity={1}
      style={styles.wrapper}
    >
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditPlan(plan)}
          >
            <Pencil size={rMS(18)} color="#fff" />
          </TouchableOpacity>
        )}
        friction={2}
        rightThreshold={60}
      >
        <View style={styles.planItemWrapper}>
          <View style={styles.planItemContainer}>
            <View style={styles.svgWrapper}>{renderSVGIcon(category)}</View>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>
                {plan.title || ""}
              </Text>
              <Text style={styles.planCategory}>
                {category}
              </Text>
            </View>
            <Text style={styles.planTime}>
              {formattedTimeStart}-{formattedTimeEnd}
            </Text>
          </View>
        </View>
      </Swipeable>
    </TouchableOpacity>
  );
};

export default memo(PlanItem);
