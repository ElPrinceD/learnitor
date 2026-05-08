import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Flame, Briefcase, Users, BookOpen, HelpCircle } from "lucide-react-native";
import { rMS, rV, rS, useShadows } from "../constants";
import Colors from "../constants/Colors";

// Map of Lucide icon components
const iconMap: Record<string, React.FC<any>> = {
  "Exams TimeTable": Flame,
  "TimeTable": Briefcase,
  "Assignments & Projects": Users,
  "Study TimeTable": BookOpen,
};

interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  onPress: () => void;
  onLongPress?: () => void;
  width: number;
}

const TimelineCategoryItem: React.FC<CategoryItemProps> = ({
  category,
  onPress,
  onLongPress,
  width,
}) => {
  const shadow = useShadows();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const IconComponent = iconMap[category.name] || HelpCircle;

  const styles = StyleSheet.create({
    categoryBox: {
      height: rV(130),
      marginVertical: rV(8),
      borderRadius: rMS(20),
      justifyContent: "center",
      alignItems: "center",
      padding: rMS(14),
      overflow: "hidden",
    },
    categoryText: {
      fontSize: rMS(12),
      fontWeight: "800",
      color: "#fff",
      marginTop: rV(8),
      letterSpacing: -0.1,
      textAlign: "center",
    },
  });

  return (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryBox,
        {
          backgroundColor: category.color,
          width: (width - 48) / 2,
          ...shadow.medium,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <IconComponent size={rMS(32)} color="#fff" />
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );
};

export default TimelineCategoryItem;
