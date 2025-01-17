// components/TimetableDisplay.tsx

import React from "react";
import { View, Text, StyleSheet, FlatList, useColorScheme } from "react-native";
import Colors from "../constants/Colors";

interface Period {
  course_name: string;
  lecturer: string;
  days: string; // Comma-separated string
  venue: string;
  start_time: string;
  end_time: string;
}

const TimetableDisplay: React.FC<{ periods: Period[] }> = ({ periods }) => {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    tableHeader: {
      flexDirection: "row",
      backgroundColor: themeColors.tint,
      paddingVertical: 8,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    headerCell: {
      flex: 1,
      fontWeight: "bold",
      textAlign: "left",
      paddingHorizontal: 8,
    },
    row: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.textSecondary,
    },
    cell: {
      flex: 1,
      paddingHorizontal: 8,
      color: themeColors.text,
    },
    dayHeader: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },
  });

  const renderPeriod = ({ item }: { item: Period }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>
        {item.start_time} - {item.end_time}
      </Text>
      <Text style={styles.cell}>{item.course_name}</Text>
      <Text style={styles.cell}>{item.lecturer}</Text>
      <Text style={styles.cell}>{item.venue}</Text>
    </View>
  );

  return (
    <FlatList
      data={daysOfWeek}
      keyExtractor={(item) => item}
      renderItem={({ item: day }) => {
        const dayPeriods = periods.filter((period) =>
          period.days.split(", ").includes(day)
        );
        if (dayPeriods.length === 0) return null;

        dayPeriods.sort((a, b) => {
          const [aHours, aMinutes] = a.start_time.split(":").map(Number);
          const [bHours, bMinutes] = b.start_time.split(":").map(Number);
          return aHours - bHours || aMinutes - bMinutes;
        });

        return (
          <View key={day}>
            <Text style={[styles.dayHeader, { color: themeColors.text }]}>
              {day}
            </Text>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Course Name</Text>
              <Text style={styles.headerCell}>Lecturer</Text>
              <Text style={styles.headerCell}>Venue</Text>
            </View>
            <FlatList
              data={dayPeriods}
              renderItem={renderPeriod}
              keyExtractor={(item) =>
                item.course_name + item.start_time + item.venue
              }
            />
          </View>
        );
      }}
    />
  );
};

export default TimetableDisplay;
