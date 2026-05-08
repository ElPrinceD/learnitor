import React, { useState, useEffect, memo } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Calendar } from "react-native-calendars";
import Colors from "../constants/Colors";
import { rMS, rS, rV } from "../constants";

interface DaySelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  setSelectedDate,
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
      paddingHorizontal: rS(14),
      backgroundColor: themeColors.tint,
      paddingBottom: rV(6),
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
            selectedColor: "#fff",
          },
        }}
        theme={{
          backgroundColor: themeColors.tint,
          calendarBackground: themeColors.tint,
          textSectionTitleColor: "#ffffffCC",
          selectedDayTextColor: themeColors.tint,
          todayTextColor: "#FFD700",
          dayTextColor: "#fff",
          textDisabledColor: "#ffffff40",
          monthTextColor: "#fff",
          arrowColor: "#fff",
          textMonthFontWeight: "900",
          textMonthFontSize: rMS(20),
          textDayHeaderFontWeight: "700",
          textDayFontWeight: "600",
          textDayFontSize: rMS(13),
          textDayHeaderFontSize: rMS(11),
        }}
      />
    </View>
  );
};

export default memo(DaySelector);
