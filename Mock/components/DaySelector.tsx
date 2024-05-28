import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

interface DaySelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDate, setSelectedDate }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [month, setMonth] = useState<string>("");
  const today = new Date();

  const getMonthName = (date: Date) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[date.getMonth()];
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekDays = [];
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

  return (
    <View style={styles.container}>
      <Text style={styles.month}>{month}</Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity onPress={() => handleScroll("prev")}>
          <Text style={styles.arrow}>{"<"}</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity key={index} onPress={() => handleDayPress(date)} style={styles.dayContainer}>
                <Text style={[styles.date, isSelected && styles.selectedDay, isToday && styles.today]}>
                  {days[date.getDay()]}
                </Text>
                <Text style={[styles.date, isSelected && styles.selectedDay, isToday && styles.today]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={() => handleScroll("next")}>
          <Text style={styles.arrow}>{">"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    backgroundColor: "#fdecd2"
  },
  month: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 3,
  },
  selectorContainer: {
    flexDirection: "row",
    alignItems: "center",
   

  },
  arrow: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 1,
  },
  dayContainer: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  day: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedDay: {
    color: "#007BFF",
     
  },
  date: {
    fontSize: 16,
    color: "#888",
  },
  today: {
    fontWeight: "bold",
    color: "#FF6347",
  },
});

export default DaySelector;
