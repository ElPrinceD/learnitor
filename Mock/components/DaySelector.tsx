import React, { useState, useEffect } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Calendar } from "react-native-calendars";
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
interface DaySelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  y: SharedValue<number>;
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  setSelectedDate,
  y,
}) => {
  const [selected, setSelected] = useState(
    selectedDate.toISOString().split("T")[0]
  );

  const today = new Date();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    setSelected(selectedDate.toISOString().split("T")[0]);
  }, [selectedDate]);

  const bigCalendarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      y.value,
      [-10, 0, 400],
      [1, 0.9, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      y.value,
      [-200, 0],
      [4, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rS(18),
      backgroundColor: themeColors.tint,
    },

    month: {
      fontSize: rMS(23),
      fontWeight: "bold",
      textAlign: "center",
    },
    selectorContainer: {
      marginTop: rV(5),
      flexDirection: "row",
      alignItems: "center",
    },
    dayContainer: {
      alignItems: "center",
      marginHorizontal: rS(8),
    },
    date: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    selectedDay: {
      color: "#1434A4",
      fontWeight: "bold",
    },
    today: {
      fontWeight: "bold",
      color: "#FF6347",
    },
    scrollViewContent: {
      flexGrow: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[bigCalendarStyle]}>
        <Calendar
          onDayPress={(day) => {
            const date = new Date(day.timestamp);
            setSelectedDate(date);
            setSelected(day.dateString);
          }}
          markedDates={{
            [selected]: {
              selected: true,
              selectedColor: themeColors.buttonBackground,
            },
          }}
          theme={{
            backgroundColor: themeColors.tint,
            calendarBackground: themeColors.tint,
            textSectionTitleColor: themeColors.text,
            selectedDayBackgroundColor: "blue",
            selectedDayTextColor: "green",
            todayTextColor: "#FF6347",
            dayTextColor: themeColors.text,
            textDisabledColor: "#d9e1e8",
            monthTextColor: themeColors.text,
            arrowColor: themeColors.text,
            textMonthFontWeight: "bold",
            textMonthFontSize: rMS(23),
            textDayHeaderFontWeight: "bold",
          }}
        />
      </Animated.View>
    </View>
  );
};

export default DaySelector;
