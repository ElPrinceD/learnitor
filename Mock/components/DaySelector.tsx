import React, { useState, useEffect, memo } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Calendar } from "react-native-calendars";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
import { Plan } from "./types";

interface DaySelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  // plan: Plan;
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  setSelectedDate,
  // plan,
}) => {
  const [selected, setSelected] = useState(
    selectedDate.toISOString().split("T")[0]
  );

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    setSelected(selectedDate.toISOString().split("T")[0]);
  }, [selectedDate]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rS(18),
      backgroundColor: themeColors.tint,
    },
  });

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => {
          const date = new Date(day.timestamp);
          setSelectedDate(date);
          setSelected(day.dateString);
        }}
        enableSwipeMonths={true}
        markedDates={{
          [selected]: {
            selected: true,
            selectedColor: themeColors.background,
          },
        }}
        theme={{
          backgroundColor: themeColors.tint,
          calendarBackground: themeColors.tint,
          textSectionTitleColor: themeColors.text,
          selectedDayTextColor: "#1434A4",
          todayTextColor: "#FF6347",
          dayTextColor: themeColors.text,
          textDisabledColor: "#ccc",
          monthTextColor: themeColors.text,
          arrowColor: themeColors.text,
          textMonthFontWeight: "bold",
          textMonthFontSize: rMS(23),
          textDayHeaderFontWeight: "bold",
        }}
      />
    </View>
  );
};

export default memo(DaySelector);
