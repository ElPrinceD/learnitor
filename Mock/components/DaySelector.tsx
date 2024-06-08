import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SIZES, rMS, rS, rV } from "../constants";
import Colors from "../constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface DaySelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  setSelectedDate,
}) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [month, setMonth] = useState<string>("");
  const today = new Date();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const getMonthName = (date: Date): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[date.getMonth()];
  };

  const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const handleScroll = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };

  const weekDays = getWeekDays(selectedDate);

  useEffect(() => {
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    setMonth(getMonthName(selectedDate));
  }, [selectedDate]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: rS(18),
      backgroundColor: themeColors.tabIconSelected,
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
  });

  return (
    <View style={styles.container}>
      <Text style={styles.month}>{month}</Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity onPress={() => handleScroll("prev")}>
          <MaterialCommunityIcons
            name="code-less-than"
            size={SIZES.xLarge}
            color={themeColors.text}
          />
        </TouchableOpacity>
        <FlatList
          data={weekDays}
          horizontal
          keyExtractor={(item) => item.toISOString()}
          renderItem={({ item: date }) => {
            const isToday = date.toDateString() === today.toDateString();
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                onPress={() => handleDayPress(date)}
                style={styles.dayContainer}
              >
                <Text
                  style={[
                    styles.date,
                    isSelected && styles.selectedDay,
                    isToday && styles.today,
                  ]}
                >
                  {days[date.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.date,
                    isSelected && styles.selectedDay,
                    isToday && styles.today,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
        <TouchableOpacity onPress={() => handleScroll("next")}>
          <MaterialCommunityIcons
            name="code-greater-than"
            size={SIZES.xLarge}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DaySelector;
